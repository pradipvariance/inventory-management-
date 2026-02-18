import express from 'express';
import { getDashboardStats, getSalesChart, getLowStockItems } from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', protect, getDashboardStats);
router.get('/sales', protect, getSalesChart);
router.get('/low-stock', protect, getLowStockItems);

export default router;
