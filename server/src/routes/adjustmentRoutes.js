import express from 'express';
import { createAdjustment, getAdjustments } from '../controllers/adjustmentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, authorize('SUPER_ADMIN', 'INVENTORY_MANAGER'), createAdjustment)
    .get(protect, getAdjustments);

export default router;
