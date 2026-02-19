import express from 'express';
import { createOrder, getOrders, updateOrderStatus, getPendingOrdersCount } from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, createOrder)
    .get(protect, getOrders);

router.route('/pending-count')
    .get(protect, getPendingOrdersCount);

router.route('/:id/status')
    .put(protect, authorize('SUPER_ADMIN', 'WAREHOUSE_ADMIN', 'INVENTORY_MANAGER'), updateOrderStatus);

export default router;
