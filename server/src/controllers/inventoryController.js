import prisma from '../prisma.js';

export const getAllInventory = async (req, res) => {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (page - 1) * limit;

    try {
        const { warehouseId } = req.query;
        const where = {};

        if ((req.user.role === 'WAREHOUSE_ADMIN' || req.user.role === 'INVENTORY_MANAGER') && req.user.warehouseId) {
            where.warehouseId = req.user.warehouseId;
        } else if (warehouseId) {
            where.warehouseId = warehouseId;
        }

        if (search) {
            where.product = {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { sku: { contains: search, mode: 'insensitive' } },
                ],
            };
        }

        if (req.query.category) {
            // If product search exists, merge category filter into it
            where.product = {
                ...where.product,
                category: req.query.category
            };
        }

        const [inventory, total] = await prisma.$transaction([
            prisma.inventory.findMany({
                where,
                include: {
                    product: true,
                    warehouse: true,
                },
                skip: parseInt(skip),
                take: parseInt(limit),
                orderBy: { updatedAt: 'desc' },
            }),
            prisma.inventory.count({ where }),
        ]);

        res.json({
            inventory,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            totalInventory: total,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
