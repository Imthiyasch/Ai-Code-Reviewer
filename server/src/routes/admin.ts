import express, { Response, Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/authenticate.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { query } from '../db/client.js';

const router: Router = express.Router();
router.use(authenticate, requireAdmin);

// GET /api/admin/users — all users with review counts
router.get('/users', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query<{
      id: string;
      email: string;
      name: string;
      avatar_url: string | null;
      role: string;
      created_at: string;
      last_active_at: string;
      review_count: number;
    }>(`
      SELECT u.id, u.email, u.name, u.avatar_url, u.role,
             u.created_at, u.last_active_at,
             COUNT(r.id)::int AS review_count,
             ROUND(AVG(r.quality_score), 1)::float AS avg_score
      FROM users u
      LEFT JOIN reviews r ON r.user_id = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    await query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// GET /api/admin/stats
router.get('/stats', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totals, daily, topBugs] = await Promise.all([
      query<{ total: number; today: number; this_week: number }>(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE created_at >= now() - INTERVAL '1 day')::int AS today,
          COUNT(*) FILTER (WHERE created_at >= now() - INTERVAL '7 days')::int AS this_week
        FROM reviews
      `),
      query<{ day: string; avg_score: number; count: number }>(`
        SELECT
          DATE(created_at) AS day,
          ROUND(AVG(quality_score), 2)::float AS avg_score,
          COUNT(*)::int AS count
        FROM reviews
        WHERE created_at >= now() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY day ASC
      `),
      query<{ severity: string; count: number }>(`
        SELECT
          bug->>'severity' AS severity,
          COUNT(*)::int AS count
        FROM reviews,
             jsonb_array_elements(bugs) AS bug
        GROUP BY severity
        ORDER BY count DESC
      `),
    ]);

    res.json({
      totals: totals.rows[0],
      daily: daily.rows,
      topBugs: topBugs.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
