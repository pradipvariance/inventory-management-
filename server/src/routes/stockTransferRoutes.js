import express from 'express';
import { createTransfer, getTransfers, approveTransfer, rejectTransfer, getPendingTransfersCount } from '../controllers/stockTransferController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('SUPER_ADMIN', 'WAREHOUSE_ADMIN', 'INVENTORY_MANAGER'), createTransfer);
router.get('/pending-count', protect, getPendingTransfersCount);
router.get('/', protect, getTransfers);
router.put('/:id/approve', protect, authorize('WAREHOUSE_ADMIN', 'SUPER_ADMIN'), approveTransfer);
router.put('/:id/reject', protect, authorize('WAREHOUSE_ADMIN', 'SUPER_ADMIN'), rejectTransfer);

export default router;
