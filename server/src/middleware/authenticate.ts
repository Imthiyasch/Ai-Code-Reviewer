import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db/client';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    avatar_url: string | null;
    role: string;
  };
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      sub: string;
    };

    const result = await query<{
      id: string;
      email: string;
      name: string;
      avatar_url: string | null;
      role: string;
    }>(
      'SELECT id, email, name, avatar_url, role FROM users WHERE id = $1',
      [payload.sub]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // Update last_active_at (fire-and-forget)
    query('UPDATE users SET last_active_at = now() WHERE id = $1', [
      payload.sub,
    ]).catch(() => {});

    req.user = result.rows[0];
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
