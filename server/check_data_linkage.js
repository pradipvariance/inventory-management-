
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("=== STARTING DATA LINKAGE CHECK ===");

    try {
        // 1. Get Inventory Managers and their Warehouses
        const managers = await prisma.user.findMany({
            where: { role: 'INVENTORY_MANAGER' },
            include: { warehouse: true }
        });

        console.log(`\nFound ${managers.length} Inventory Managers.`);

        for (const manager of managers) {
            console.log(`\n------------------------------------------------`);
            console.log(`Checking Manager: ${manager.name} (ID: ${manager.id})`);
            console.log(`Assigned Warehouse: ${manager.warehouse?.name} (ID: ${manager.warehouseId})`);

            if (!manager.warehouseId) {
                console.log("!!! WARNING: No Warehouse Assigned to this Manager !!!");
                continue;
            }

            const wid = manager.warehouseId;

            // 2. Check Products & Inventory in this Warehouse
            // We want to know: How many products exist? How many have stock > 0?
            const allInventory = await prisma.inventory.findMany({
                where: { warehouseId: wid },
                include: { product: true }
            });

            const activeStock = allInventory.filter(i => i.itemQuantity > 0);

            console.log(`\n[INVENTORY STATUS]`);
            console.log(`Total Inventory Records for Warehouse: ${allInventory.length}`);
            console.log(`Active Stock (Qty > 0): ${activeStock.length}`);

            if (activeStock.length === 0 && allInventory.length > 0) {
                console.log("-> All inventory items have 0 quantity. This matches 'Product Count: 0' in strict mode.");
            }

            activeStock.forEach(i => {
                console.log(`   - Product: "${i.product.name}" | Qty: ${i.itemQuantity} | LowStockThreshold: ${i.product.minStockLevel}`);
            });


            // 3. Check Orders Linked to this Warehouse
            // We look for OrderItems with this warehouseId
            const linkedOrderItems = await prisma.orderItem.findMany({
                where: { warehouseId: wid },
                select: { id: true, orderId: true, price: true, quantity: true }
            });

            console.log(`\n[ORDER STATUS]`);
            console.log(`Order Items Linked to Warehouse: ${linkedOrderItems.length}`);

            if (linkedOrderItems.length > 0) {
                // Get unique order IDs
                const orderIds = [...new Set(linkedOrderItems.map(i => i.orderId))];
                console.log(`Unique Orders Linked: ${orderIds.length}`);

                // Calculate Revenue from these items
                const revenue = linkedOrderItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
                console.log(`Calculated Revenue from Linked Items: ${revenue}`);
            } else {
                console.log("-> No Order Items are linked to this Warehouse ID.");
                console.log("   (Old orders created before the update will NOT appear here)");
            }

            // 4. Check Low Stock Logic
            // Raw query to simulate exactly what the controller does
            const lowStockRaw = await prisma.$queryRaw`
                SELECT i.id, i."itemQuantity", p."minStockLevel", p.name
                FROM "Inventory" i
                JOIN "Product" p ON i."productId" = p.id
                WHERE i."itemQuantity" <= p."minStockLevel"
                AND i."warehouseId" = ${wid}
            `;

            console.log(`\n[LOW STOCK STATUS]`);
            console.log(`Low Stock Items Found (via RAW query): ${lowStockRaw.length}`);
            lowStockRaw.forEach(i => {
                console.log(`   - ${i.name}: Qty ${i.itemQuantity} <= Min ${i.minStockLevel}`);
            });

        }

    } catch (e) {
        console.error("DATA CHECK ERROR:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
