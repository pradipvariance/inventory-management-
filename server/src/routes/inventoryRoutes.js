import express from 'express';
import { getAllInventory } from '../controllers/inventoryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getAllInventory);

export default router;
