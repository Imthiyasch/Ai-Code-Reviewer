import express, { Response, Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { reviewRateLimiter } from '../middleware/rateLimiter';
import { query } from '../db/client';
import { analyzeCode } from '../services/llm';
import { generateMarkdown } from '../services/export';

const router: Router = express.Router();
router.use(authenticate);

// POST /api/reviews — submit code for analysis
router.post('/', reviewRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  const { code, language = 'auto', source_type = 'paste', github_url } = req.body;

  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'code is required' });
    return;
  }
  if (code.length > 500000) {
    res.status(400).json({ error: 'Code exceeds maximum length (500,000 chars)' });
    return;
  }
  if (source_type === 'github' && github_url) {
    try { new URL(github_url); } catch {
      res.status(400).json({ error: 'Invalid GitHub URL' });
      return;
    }
  }

  try {
    const result = await analyzeCode(code, language);
    const snippet = code.slice(0, 500);

    const saved = await query<{ id: string }>(
      `INSERT INTO reviews
         (user_id, source_type, github_url, language, code_snippet, full_code,
          quality_score, summary, bugs, improvements, documentation)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id`,
      [
        req.user!.id,
        source_type,
        github_url ?? null,
        language,
        snippet,
        code,
        result.quality_score,
        result.summary,
        JSON.stringify(result.bugs),
        JSON.stringify(result.improvements),
        JSON.stringify(result.documentation),
      ]
    );

    const reviewId = saved.rows[0].id;
    const full = await query(
      'SELECT * FROM reviews WHERE id = $1',
      [reviewId]
    );
    res.status(201).json({ review: full.rows[0] });
  } catch (err: any) {
    console.error('Review error:', err);
    res.status(500).json({ error: err.message || String(err) || 'Analysis failed' });
  }
});

// GET /api/reviews — paginated history
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = 10;
  const offset = (page - 1) * limit;
  const language = req.query.language as string | undefined;
  const minScore = req.query.minScore ? parseInt(req.query.minScore as string) : undefined;
  const maxScore = req.query.maxScore ? parseInt(req.query.maxScore as string) : undefined;

  const conditions: string[] = ['user_id = $1'];
  const params: unknown[] = [req.user!.id];
  let pIdx = 2;

  if (language) { conditions.push(`language = $${pIdx++}`); params.push(language); }
  if (minScore !== undefined) { conditions.push(`quality_score >= $${pIdx++}`); params.push(minScore); }
  if (maxScore !== undefined) { conditions.push(`quality_score <= $${pIdx++}`); params.push(maxScore); }

  const where = conditions.join(' AND ');

  try {
    const [dataRes, countRes] = await Promise.all([
      query(
        `SELECT id, source_type, github_url, language, code_snippet, quality_score, created_at
         FROM reviews WHERE ${where}
         ORDER BY created_at DESC
         LIMIT $${pIdx} OFFSET $${pIdx + 1}`,
        [...params, limit, offset]
      ),
      query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM reviews WHERE ${where}`, params),
    ]);

    res.json({
      reviews: dataRes.rows,
      total: countRes.rows[0].count,
      page,
      totalPages: Math.ceil(countRes.rows[0].count / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// GET /api/reviews/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      'SELECT * FROM reviews WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }
    res.json({ review: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

// DELETE /api/reviews/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      'DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user!.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }
    res.json({ message: 'Review deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// GET /api/reviews/:id/export
router.get('/:id/export', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query<any>(
      'SELECT * FROM reviews WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }
    const markdown = generateMarkdown(result.rows[0]);
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="review-${req.params.id}.md"`);
    res.send(markdown);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Export failed' });
  }
});

export default router;
