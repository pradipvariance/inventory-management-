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

        // Create Inventory record if Warehouse is specified (either by Admin or Form)
        let targetWarehouseId = null;
        if (req.user.role === 'WAREHOUSE_ADMIN' && req.user.warehouseId) {
            targetWarehouseId = req.user.warehouseId;
        } else if (req.body.warehouseId) {
            targetWarehouseId = req.body.warehouseId;
        }

        if (targetWarehouseId) {
            const initialStock = req.body.initialStock ? parseInt(req.body.initialStock) : 0;
            let itemData = {
                productId: product.id,
                warehouseId: targetWarehouseId,
                itemQuantity: 0,
                boxQuantity: 0
            };

            if (data.unitType === 'BOX') {
                itemData.boxQuantity = initialStock;
            } else {
                itemData.itemQuantity = initialStock;
            }

            await prisma.inventory.create({
                data: itemData
            });
        }

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


    console.log("--- DEBUG getProducts ---");
    console.log("User:", req.user.email, "| ID:", req.user.id);
    console.log("Role:", req.user.role);
    console.log("WarehouseID:", req.user.warehouseId);

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


        // --- STRICT WAREHOUSE FILTERING START ---
        // Sanitize role to avoid whitespace issues
        const userRole = req.user.role ? req.user.role.trim() : '';
        console.log(`Processing filter for Role: '${userRole}'`);

        if (userRole === 'WAREHOUSE_ADMIN') {
            if (!req.user.warehouseId) {
                return res.json({ products: [], totalPages: 0, currentPage: parseInt(page), totalProducts: 0 });
            }

            // Step 1: Find all Product IDs that have STOCK > 0 in this warehouse
            const validInventory = await prisma.inventory.findMany({
                where: {
                    warehouseId: req.user.warehouseId,
                    itemQuantity: { gt: 0 }
                },
                select: { productId: true }
            });

            const validProductIds = validInventory.map(i => i.productId);

            // Step 2: Add this ID constraint to the product query
            where.id = { in: validProductIds };
        }
        // --- STRICT WAREHOUSE FILTERING END ---

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
            let totalStock = 0;
            // Use sanitized role for check
            if (userRole === 'WAREHOUSE_ADMIN' && req.user.warehouseId) {
                // Only count stock for this warehouse (Frontend display)
                totalStock = product.inventory
                    .filter(item => item.warehouseId === req.user.warehouseId)
                    .reduce((sum, item) => sum + item.itemQuantity, 0);
            } else {
                // Count all stock
                totalStock = product.inventory.reduce((sum, item) => sum + item.itemQuantity, 0);
            }
            return { ...product, totalStock };
        });

        res.json({
            products,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            totalProducts: total,
        });

    } catch (error) {
        console.error("getProducts Error:", error);
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

export const debugInventory = async (req, res) => {
    try {
        const warehouses = await prisma.warehouse.findMany({
            include: {
                inventory: {
                    where: {
                        OR: [
                            { itemQuantity: { gt: 0 } },
                            { boxQuantity: { gt: 0 } }
                        ]
                    },
                    include: { product: true }
                }
            }
        });

        const result = warehouses.map(w => ({
            warehouse: w.name,
            id: w.id,
            activeItemsCount: w.inventory.length,
            items: w.inventory.map(i => ({
                product: i.product.name,
                sku: i.product.sku,
                itemQty: i.itemQuantity,
                boxQty: i.boxQuantity
            }))
        }));

        const users = await prisma.user.findMany({ select: { name: true, email: true, role: true, warehouseId: true } });
        res.json({ warehouses: result, users });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
