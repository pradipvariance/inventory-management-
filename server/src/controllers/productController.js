import prisma from '../prisma.js';
import { z } from 'zod';
import csv from 'csv-parser';
import fs from 'fs';

const productSchema = z.object({
    name: z.string().min(2),
    sku: z.string().min(3),
    barcode: z.string().min(3),
    category: z.string().min(2),
    unitType: z.enum(['ITEM', 'BOX']),
    boxSize: z.number().optional(),
    minStockLevel: z.number().int().min(0).optional(),
    amount: z.number().min(0).optional().default(0),
    image: z.string().optional(),
});

export const createProduct = async (req, res) => {
    try {
        // Build data object from body + file
        const rawData = {
            ...req.body,
            boxSize: req.body.boxSize ? parseInt(req.body.boxSize) : undefined,
            minStockLevel: req.body.minStockLevel ? parseInt(req.body.minStockLevel) : undefined,
            amount: req.body.amount ? parseFloat(req.body.amount) : 0,
            image: req.file ? `assets/products/${req.file.filename}` : undefined
        };

        const data = productSchema.parse(rawData);

        // Check for unique SKU/Barcode manually if needed or rely on Prisma error
        const existingProduct = await prisma.product.findFirst({
            where: { OR: [{ sku: data.sku }, { barcode: data.barcode }] }
        });
        if (existingProduct) {
            // Clean up uploaded file if duplicate
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'Product with SKU or Barcode already exists' });
        }

        const product = await prisma.product.create({ data });
        res.status(201).json(product);
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        if (error instanceof z.ZodError) return res.status(400).json({ message: error.errors });
        res.status(500).json({ message: error.message });
    }
};

export const getProducts = async (req, res) => {
    const { page = 1, limit = 10, search, category } = req.query;
    const skip = (page - 1) * limit;

    try {
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
                { barcode: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (category) {
            where.category = category;
        }

        const [productsData, total] = await prisma.$transaction([
            prisma.product.findMany({
                where,
                skip: parseInt(skip),
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
                include: { inventory: true }
            }),
            prisma.product.count({ where }),
        ]);

        const products = productsData.map(product => {
            const totalStock = product.inventory.reduce((sum, item) => sum + item.itemQuantity, 0);
            return { ...product, totalStock };
        });

        res.json({
            products,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            totalProducts: total,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getProduct = async (req, res) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: req.params.id },
            include: { inventory: true },
        });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const rawData = {
            ...req.body,
            boxSize: req.body.boxSize ? parseInt(req.body.boxSize) : undefined,
            minStockLevel: req.body.minStockLevel ? parseInt(req.body.minStockLevel) : undefined,
            amount: req.body.amount ? parseFloat(req.body.amount) : 0,
            image: req.file ? `assets/products/${req.file.filename}` : undefined
        };

        const data = productSchema.partial().parse(rawData);
        const product = await prisma.product.update({
            where: { id: req.params.id },
            data,
        });
        res.json(product);
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        if (error.code === 'P2025') return res.status(404).json({ message: 'Product not found' });
        if (error instanceof z.ZodError) return res.status(400).json({ message: error.errors });
        res.status(500).json({ message: error.message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        await prisma.product.delete({ where: { id: req.params.id } });
        res.json({ message: 'Product deleted' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'Product not found' });
        res.status(500).json({ message: error.message });
    }
};

export const bulkImportProducts = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const result = [];
    const errors = [];

    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => result.push(data))
        .on('end', async () => {
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);

            let successCount = 0;
            for (const row of result) {
                try {
                    // Basic mapping - assume headers match schema or are mapped
                    const productData = {
                        name: row.name,
                        sku: row.sku,
                        barcode: row.barcode,
                        category: row.category,
                        unitType: row.unitType || 'ITEM',
                        boxSize: row.boxSize ? parseInt(row.boxSize) : null,
                        minStockLevel: row.minStockLevel ? parseInt(row.minStockLevel) : 0,
                    };

                    // Validate
                    const validated = productSchema.parse(productData);

                    await prisma.product.create({ data: validated });
                    successCount++;
                } catch (error) {
                    errors.push({ row, error: error.message });
                }
            }

            res.json({
                message: `Imported ${successCount} products`,
                errors: errors.length > 0 ? errors : undefined,
            });
        });
};
