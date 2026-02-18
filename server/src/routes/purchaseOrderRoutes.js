import express from 'express';
import { createPO, getPOs, updatePOStatus } from '../controllers/purchaseOrderController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('SUPER_ADMIN', 'WAREHOUSE_ADMIN', 'INVENTORY_MANAGER'), createPO);
router.get('/', protect, authorize('SUPER_ADMIN', 'WAREHOUSE_ADMIN', 'INVENTORY_MANAGER', 'SUPPLIER'), getPOs);
router.put('/:id/status', protect, authorize('SUPER_ADMIN', 'WAREHOUSE_ADMIN', 'SUPPLIER'), updatePOStatus);

export default router;
