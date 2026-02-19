import prisma from '../prisma.js';

export const getDashboardStats = async (req, res) => {
    try {
        const { role, warehouseId } = req.user;
        console.log(`[DEBUG DASHBOARD] Role: ${role}, WarehouseId: ${warehouseId}`);

        let productCount = 0;
        let orderCount = 0;
        let totalRevenue = 0;
        let warehouseCount = 0;
        let supplierCount = 0;
        let lowStockCount = 0;
        let inventoryCount = 0;

        if ((role === 'WAREHOUSE_ADMIN' || role === 'INVENTORY_MANAGER') && warehouseId) {
            // --- WAREHOUSE SPECIFIC LOGIC ---

            // 1. Product Count (Strict: active stock > 0 in this warehouse)
            const validInventory = await prisma.inventory.findMany({
                where: { warehouseId: warehouseId, itemQuantity: { gt: 0 } },
                select: { productId: true }
            });
            const validProductIds = validInventory.map(i => i.productId);
            productCount = await prisma.product.count({
                where: { id: { in: validProductIds } }
            });
            console.log(`[DEBUG DASHBOARD] Warehouse Products: ${productCount}`);

            // 2. Order Count (Orders linked to this warehouse via items)
            orderCount = await prisma.order.count({
                where: {
                    orderItems: { some: { warehouseId: warehouseId } }
                }
            });

            // 3. Revenue (Sum of items fulfilled by this warehouse)
            const revenueItems = await prisma.orderItem.findMany({
                where: { warehouseId: warehouseId },
                select: { price: true, quantity: true }
            });
            totalRevenue = revenueItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
            console.log(`[DEBUG DASHBOARD] Warehouse Orders: ${orderCount}, Revenue: ${totalRevenue}`);

            // 4. Low Stock Count
            const lowStockResult = await prisma.$queryRaw`
                SELECT COUNT(*)::int as count FROM "Inventory" i
                JOIN "Product" p ON i."productId" = p.id
                WHERE i."itemQuantity" <= p."minStockLevel"
                AND i."warehouseId" = ${warehouseId}
            `;
            lowStockCount = Number(lowStockResult[0]?.count || 0);

            // 5. Inventory Count
            inventoryCount = await prisma.inventory.count({
                where: { warehouseId: warehouseId }
            });

            warehouseCount = 1;
            supplierCount = 0; // Not relevant for warehouse level

        } else {
            // --- GLOBAL LOGIC ---

            productCount = await prisma.product.count();

            [orderCount, warehouseCount, supplierCount] = await Promise.all([
                prisma.order.count(),
                prisma.warehouse.count(),
                prisma.supplier.count()
            ]);

            const orders = await prisma.order.findMany({ select: { totalAmount: true } });
            totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);

            const lowStockResult = await prisma.$queryRaw`
                SELECT COUNT(*)::int as count FROM "Inventory" i
                JOIN "Product" p ON i."productId" = p.id
                WHERE i."itemQuantity" <= p."minStockLevel"
            `;
            lowStockCount = Number(lowStockResult[0]?.count || 0);

            inventoryCount = await prisma.inventory.count();
        }

        res.json({
            productCount,
            orderCount,
            warehouseCount,
            supplierCount,
            totalRevenue,
            lowStockCount,
            inventoryCount
        });

    } catch (error) {
        console.error("ERROR in getDashboardStats:", error);
        // Ensure we send a JSON response even on error to prevent frontend crashes
        res.status(500).json({
            message: error.message,
            productCount: 0,
            orderCount: 0,
            totalRevenue: 0,
            lowStockCount: 0
        });
    }
};

export const getSalesChart = async (req, res) => {
    try {
        const { role, warehouseId } = req.user;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        let salesByDate = {}; // { 'YYYY-MM-DD': amount }

        if ((role === 'WAREHOUSE_ADMIN' || role === 'INVENTORY_MANAGER') && warehouseId) {

            // Warehouse Specific Sales (based on OrderItems)
            const items = await prisma.orderItem.findMany({
                where: {
                    warehouseId: warehouseId,
                    order: { createdAt: { gte: sevenDaysAgo } }
                },
                select: {
                    price: true,
                    quantity: true,
                    order: { select: { createdAt: true } }
                }
            });

            items.forEach(item => {
                if (item.order && item.order.createdAt) {
                    const date = item.order.createdAt.toISOString().split('T')[0];
                    const amount = Number(item.price) * item.quantity;
                    salesByDate[date] = (salesByDate[date] || 0) + amount;
                }
            });

        } else {
            // Global Sales
            const orders = await prisma.order.findMany({
                where: {
                    createdAt: { gte: sevenDaysAgo }
                },
                select: {
                    createdAt: true,
                    totalAmount: true
                }
            });

            orders.forEach(order => {
                const date = order.createdAt.toISOString().split('T')[0];
                salesByDate[date] = (salesByDate[date] || 0) + Number(order.totalAmount);
            });
        }

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
        console.error("ERROR in getSalesChart:", error);
        res.status(500).json({ message: error.message, data: [] });
    }
};

export const getLowStockItems = async (req, res) => {
    try {
        const { role, warehouseId } = req.user;

        // Use raw query to compare inventory quantity with product minStockLevel
        // We only start with a basic query and append warehouse condition if needed
        let lowStockIds;

        if ((role === 'WAREHOUSE_ADMIN' || role === 'INVENTORY_MANAGER') && warehouseId) {
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

export const getDebugData = async (req, res) => {
    try {
        const managers = await prisma.user.findMany({
            where: { role: 'INVENTORY_MANAGER' },
            include: { warehouse: true }
        });

        const debugResults = [];

        for (const manager of managers) {
            const wid = manager.warehouseId;
            let data = {
                user: manager.name,
                warehouseId: wid,
                warehouseName: manager.warehouse?.name,
                hasWarehouseId: !!wid
            };

            if (wid) {
                const allInv = await prisma.inventory.count({ where: { warehouseId: wid } });
                const activeInv = await prisma.inventory.count({ where: { warehouseId: wid, itemQuantity: { gt: 0 } } });
                const orderItems = await prisma.orderItem.count({ where: { warehouseId: wid } });

                const lowStockRaw = await prisma.$queryRaw`
                    SELECT COUNT(*)::int as count FROM "Inventory" i
                    JOIN "Product" p ON i."productId" = p.id
                    WHERE i."itemQuantity" <= p."minStockLevel"
                    AND i."warehouseId" = ${wid}
                `;

                data.stats = {
                    totalInventoryRows: allInv,
                    activeInventoryRows: activeInv,
                    linkedOrderItems: orderItems,
                    lowStockCountRaw: Number(lowStockRaw[0]?.count || 0)
                };
            }
            debugResults.push(data);
        }

        res.json(debugResults);
    } catch (error) {
        res.status(200).json({ error: "DEBUG ERROR: " + error.message, stack: error.stack });
    }
};
