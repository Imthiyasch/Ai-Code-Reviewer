import express, { Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { query } from '../db/client';
import { authenticate, AuthRequest } from '../middleware/authenticate';

const router: Router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/auth/google — verify ID token, upsert user, issue JWT
router.post('/google', async (req: Request, res: Response): Promise<void> => {
  const { credential } = req.body;
  if (!credential) {
    res.status(400).json({ error: 'Missing Google credential' });
    return;
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) {
      res.status(401).json({ error: 'Invalid Google token' });
      return;
    }

    const { sub: google_id, email, name, picture: avatar_url } = payload;

    // Assign admin role if email matches exactly
    const role = email === 'imthiranu@gmail.com' ? 'admin' : 'user';

    // Upsert user
    const result = await query<{
      id: string;
      email: string;
      name: string;
      avatar_url: string | null;
      role: string;
    }>(
      `INSERT INTO users (google_id, email, name, avatar_url, role, last_active_at)
       VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (google_id) DO UPDATE
         SET email = EXCLUDED.email,
             name = EXCLUDED.name,
             avatar_url = EXCLUDED.avatar_url,
             role = CASE WHEN EXCLUDED.email = 'imthiranu@gmail.com' THEN 'admin' ELSE users.role END,
             last_active_at = now()
       RETURNING id, email, name, avatar_url, role`,
      [google_id, email, name, avatar_url ?? null, role]
    );

    const user = result.rows[0];
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET!, {
      expiresIn: '7d',
    });

    res.json({ token, user });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req: AuthRequest, res: Response): void => {
  res.json({ user: req.user });
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response): void => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
