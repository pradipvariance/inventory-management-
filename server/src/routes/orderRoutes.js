import express from 'express';
import { createOrder, getOrders, updateOrderStatus } from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, createOrder)
    .get(protect, getOrders);

router.route('/:id/status')
    .put(protect, authorize('SUPER_ADMIN', 'WAREHOUSE_ADMIN'), updateOrderStatus);

export default router;
