import { Router } from 'express';
import { getPublicSettings } from '../services/settings';

const router = Router();

/**
 * GET /api/settings/public
 * Returns public-safe settings (Zalo phone, URL).
 * No auth required — safe for frontend public pages.
 */
router.get('/public', async (_req, res, next) => {
  try {
    const settings = await getPublicSettings();
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

export default router;
