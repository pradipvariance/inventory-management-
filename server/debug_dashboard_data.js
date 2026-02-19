
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("--- Debugging Dashboard Data ---");

    // 1. Get Inventory Managers and their Warehouse IDs
    const managers = await prisma.user.findMany({
        where: { role: 'INVENTORY_MANAGER' },
        include: { warehouse: true }
    });
    console.log("\n1. Inventory Managers:", JSON.stringify(managers, null, 2));

    if (managers.length > 0) {
        const manager = managers[0];
        const warehouseId = manager.warehouseId;
        console.log(`\nUsing Manager: ${manager.name}, Warehouse ID: ${warehouseId}`);

        if (warehouseId) {
            // 2. Check Inventory for this Warehouse
            const inventory = await prisma.inventory.findMany({
                where: { warehouseId: warehouseId },
                include: { product: true }
            });
            console.log(`\n2. Inventory Found: ${inventory.length}`);
            inventory.forEach(i => {
                console.log(`   - Product: ${i.product.name}, Qty: ${i.itemQuantity}, Min: ${i.product.minStockLevel}, LowStock?: ${i.itemQuantity <= i.product.minStockLevel}`);
            });

            // 3. Check Orders linked to this Warehouse
            const orderCount = await prisma.order.count({
                where: {
                    orderItems: { some: { warehouseId: warehouseId } }
                }
            });
            console.log(`\n3. Orders Linked to Warehouse: ${orderCount}`);

            // 4. Check Order Items linked to this Warehouse
            const orderItems = await prisma.orderItem.findMany({
                where: { warehouseId: warehouseId },
                select: { id: true, price: true, quantity: true, orderId: true }
            });
            console.log(`\n4. Order Items Linked: ${orderItems.length}`);
            console.log(JSON.stringify(orderItems, null, 2));

        } else {
            console.log("\nManager has NO Warehouse Assigned!");
        }
    } else {
        console.log("\nNo Inventory Managers found.");
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
