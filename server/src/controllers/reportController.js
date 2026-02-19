import prisma from '../prisma.js';

export const getDashboardStats = async (req, res) => {
    try {
        const { role, warehouseId } = req.user;
        let whereOrder = {};

        if (role === 'WAREHOUSE_ADMIN' && warehouseId) {
            // For stats, we might want to only show inventory in their warehouse
            // Orders: maybe only orders that have items from this warehouse? 
            // Or if orders are not warehouse-specific yet, maybe show 0 or hide?
            // Since orders are linked to customers, and we hidden customers, maybe we hide order stats too.
            // But for now let's just show global orders or maybe filtered if we had warehouseId on orders (we don't for sales orders yet, only purchase orders).
            // Let's keep orders global or 0? 0 is safer to avoid confusion.
            // Actually, let's filter Inventory count and Low Stock count.
            // Revenue: if we can't filter by warehouse, maybe show 0 or "N/A"?
            // Let's allow them to see total product count (global) but only their inventory specific low stock.
        }


        let productCount;
        if (role === 'WAREHOUSE_ADMIN' && warehouseId) {
            // Strict filtering: Count products available in THIS warehouse
            const validInventory = await prisma.inventory.findMany({
                where: {
                    warehouseId: warehouseId,
                    itemQuantity: { gt: 0 }
                },
                select: { productId: true }
            });
            const validProductIds = validInventory.map(i => i.productId);
            productCount = await prisma.product.count({
                where: { id: { in: validProductIds } }
            });
        } else {
            productCount = await prisma.product.count();
        }

        const [orderCount, warehouseCount, supplierCount] = await Promise.all([
            prisma.order.count(),
            prisma.warehouse.count(),
            prisma.user.count({ where: { role: 'SUPPLIER' } })
        ]);

        // Calculate total revenue from Orders
        let totalRevenue = 0;
        if (role !== 'WAREHOUSE_ADMIN') {
            const orders = await prisma.order.findMany({ select: { totalAmount: true } });
            totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
        }

        // Calculate low stock count using raw query for accuracy vs product.minStockLevel
        let lowStockCountResult;
        if (role === 'WAREHOUSE_ADMIN' && warehouseId) {
            lowStockCountResult = await prisma.$queryRaw`
                SELECT COUNT(*)::int as count FROM "Inventory" i
                JOIN "Product" p ON i."productId" = p.id
                WHERE i."itemQuantity" <= p."minStockLevel"
                AND i."warehouseId" = ${warehouseId}
            `;
        } else {
            lowStockCountResult = await prisma.$queryRaw`
                SELECT COUNT(*)::int as count FROM "Inventory" i
                JOIN "Product" p ON i."productId" = p.id
                WHERE i."itemQuantity" <= p."minStockLevel"
            `;
        }
        const lowStockCount = lowStockCountResult[0]?.count || 0;

        // Inventory Count (Specific to warehouse or global)
        const inventoryCount = await prisma.inventory.count({
            where: role === 'WAREHOUSE_ADMIN' ? { warehouseId } : {}
        });

        res.json({
            productCount, // They can see total products available in system
            orderCount: role === 'WAREHOUSE_ADMIN' ? 0 : orderCount,
            warehouseCount: role === 'WAREHOUSE_ADMIN' ? 1 : warehouseCount,
            supplierCount: role === 'WAREHOUSE_ADMIN' ? 0 : supplierCount,
            totalRevenue,
            lowStockCount,
            inventoryCount
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ message: error.message });
    }
};

export const getSalesChart = async (req, res) => {
    try {
        const { role } = req.user;

        if (role === 'WAREHOUSE_ADMIN') {
            return res.json([]); // No sales access for now
        }

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const orders = await prisma.order.findMany({
            where: {
                createdAt: { gte: sevenDaysAgo }
            },
            select: {
                createdAt: true,
                totalAmount: true
            }
        });

        // Group by date
        const salesByDate = {};
        orders.forEach(order => {
            const date = order.createdAt.toISOString().split('T')[0];
            salesByDate[date] = (salesByDate[date] || 0) + Number(order.totalAmount);
        });

        // Format for Recharts (Array of objects)
        const chartData = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            chartData.unshift({
                date: dateStr,
                sales: salesByDate[dateStr] || 0
            });
        }

        res.json(chartData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getLowStockItems = async (req, res) => {
    try {
        const { role, warehouseId } = req.user;

        // Use raw query to compare inventory quantity with product minStockLevel
        // We only start with a basic query and append warehouse condition if needed
        let lowStockIds;

        if (role === 'WAREHOUSE_ADMIN' && warehouseId) {
            lowStockIds = await prisma.$queryRaw`
                SELECT i.id FROM "Inventory" i
                JOIN "Product" p ON i."productId" = p.id
                WHERE i."itemQuantity" <= p."minStockLevel"
                AND i."warehouseId" = ${warehouseId}
                LIMIT 5
            `;
        } else {
            lowStockIds = await prisma.$queryRaw`
                SELECT i.id FROM "Inventory" i
                JOIN "Product" p ON i."productId" = p.id
                WHERE i."itemQuantity" <= p."minStockLevel"
                LIMIT 5
            `;
        }

        const ids = lowStockIds.map(item => item.id);

        const lowStockItems = await prisma.inventory.findMany({
            where: {
                id: { in: ids }
            },
            include: {
                product: true,
                warehouse: true
            }
        });

        res.json(lowStockItems);
    } catch (error) {
        console.error("Error fetching low stock items:", error);
        res.status(500).json({ message: error.message });
    }
};
