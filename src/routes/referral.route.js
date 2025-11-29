// routes/referralRoutes.js
import { Router } from 'express';
import { getReferralInfo, getReferralAnalytics } from '../controller/referral.controller.js';
import authMiddleware from '../middlewares/auth.middlware.js';

const router = Router();

router.get('/info', authMiddleware, getReferralInfo);
router.get('/analytics', authMiddleware, getReferralAnalytics);

export default router;