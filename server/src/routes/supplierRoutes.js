import express from 'express';
import { createSupplier, getSuppliers } from '../controllers/supplierController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, authorize('SUPER_ADMIN', 'WAREHOUSE_ADMIN'), createSupplier)
    .get(protect, getSuppliers);

export default router;
