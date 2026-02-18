import prisma from '../prisma.js';

export const getDashboardStats = async (req, res) => {
    try {
        const { role, warehouseId } = req.user;
        let whereInventory = { itemQuantity: { lt: 10 } };
        let whereOrder = {};

        if (role === 'WAREHOUSE_ADMIN' && warehouseId) {
            // For stats, we might want to only show inventory in their warehouse
            whereInventory.warehouseId = warehouseId;
            // Orders: maybe only orders that have items from this warehouse? 
            // Or if orders are not warehouse-specific yet, maybe show 0 or hide?
            // Since orders are linked to customers, and we hidden customers, maybe we hide order stats too.
            // But for now let's just show global orders or maybe filtered if we had warehouseId on orders (we don't for sales orders yet, only purchase orders).
            // Let's keep orders global or 0? 0 is safer to avoid confusion.
            // Actually, let's filter Inventory count and Low Stock count.
            // Revenue: if we can't filter by warehouse, maybe show 0 or "N/A"?
            // Let's allow them to see total product count (global) but only their inventory specific low stock.
        }

        const [productCount, orderCount, warehouseCount, supplierCount] = await Promise.all([
            prisma.product.count(), // Global products
            prisma.order.count(),   // Global orders (or 0 if we want to strict)
            prisma.warehouse.count(),
            prisma.supplier.count()
        ]);

        // Calculate total revenue from Orders
        // If Warehouse Admin, maybe we shouldn't show total company revenue?
        let totalRevenue = 0;
        if (role !== 'WAREHOUSE_ADMIN') {
            const orders = await prisma.order.findMany({ select: { totalAmount: true } });
            totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
        }

        const lowStockCount = await prisma.inventory.count({
            where: whereInventory
        });

        res.json({
            productCount,
            orderCount: role === 'WAREHOUSE_ADMIN' ? 0 : orderCount, // Hide global orders count?
            warehouseCount,
            supplierCount,
            totalRevenue,
            lowStockCount
        });
    } catch (error) {
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
        let where = { itemQuantity: { lt: 10 } };

        if (role === 'WAREHOUSE_ADMIN' && warehouseId) {
            where.warehouseId = warehouseId;
        }

        const lowStockItems = await prisma.inventory.findMany({
            where,
            include: {
                product: true,
                warehouse: true
            },
            take: 5 // Top 5 urgent
        });
        res.json(lowStockItems);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
