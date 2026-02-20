import express from 'express';
import { getAllInventory, adjustInventory } from '../controllers/inventoryController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getAllInventory);
router.post('/adjust', protect, authorize('SUPER_ADMIN'), adjustInventory);

export default router;
