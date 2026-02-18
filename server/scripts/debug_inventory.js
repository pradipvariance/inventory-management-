
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Start Debug Script");
    try {
        await prisma.$connect();
        console.log("Connected to DB");

        console.log("\n--- USERS ---");
        const users = await prisma.user.findMany({
            select: { name: true, email: true, role: true, warehouseId: true }
        });
        users.forEach(u => console.log(`- ${u.name} (${u.email}) | Role: ${u.role} | Warehouse: ${u.warehouseId}`));

        console.log("\n--- WAREHOUSES & INVENTORY ---");
        const warehouses = await prisma.warehouse.findMany();
        console.log(`Warehouses count: ${warehouses.length}`);

        for (const w of warehouses) {
            console.log(`Warehouse: ${w.name} (${w.id})`);
            const inv = await prisma.inventory.findMany({
                where: { warehouseId: w.id, itemQuantity: { gt: 0 } },
                include: { product: true }
            });
            console.log(`  > Items with qty > 0: ${inv.length}`);
            inv.forEach(i => console.log(`    - ${i.product.name}: ${i.itemQuantity}`));
        }

    } catch (e) {
        console.error("ERROR:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
