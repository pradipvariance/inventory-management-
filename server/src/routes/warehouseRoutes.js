import express from 'express';
import {
    createWarehouse,
    getWarehouses,
    getWarehouse,
    updateWarehouse,
    deleteWarehouse,
} from '../controllers/warehouseController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, authorize('SUPER_ADMIN', 'WAREHOUSE_ADMIN'), createWarehouse)
    .get(protect, getWarehouses);

router.route('/:id')
    .get(protect, getWarehouse)
    .put(protect, authorize('SUPER_ADMIN', 'WAREHOUSE_ADMIN'), updateWarehouse)
    .delete(protect, authorize('SUPER_ADMIN'), deleteWarehouse);

export default router;
