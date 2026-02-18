import express from 'express';
import multer from 'multer';
import {
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    bulkImportProducts,
} from '../controllers/productController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '../client/public/assets/products');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`);
    }
});
const upload = multer({ storage });
const router = express.Router();

router.route('/')
    .post(protect, authorize('SUPER_ADMIN', 'INVENTORY_MANAGER'), upload.single('image'), createProduct)
    .get(protect, getProducts);

router.post('/import', protect, authorize('SUPER_ADMIN', 'INVENTORY_MANAGER'), upload.single('file'), bulkImportProducts);

router.route('/:id')
    .get(protect, getProduct)
    .put(protect, authorize('SUPER_ADMIN', 'INVENTORY_MANAGER'), upload.single('image'), updateProduct)
    .delete(protect, authorize('SUPER_ADMIN'), deleteProduct);

export default router;
