import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function runDebug() {
    console.log("--- DEBUG TEST SCRIPT ---");

    // Simulate Warehouse Admin
    // I need the warehouse ID. From previous context, it was the 'Secondary Warehouse'.
    // I'll fetch it first.

    const warehouse = await prisma.warehouse.findFirst({
        where: { name: { contains: 'Secondary', mode: 'insensitive' } }
    });

    if (!warehouse) {
        console.log("Secondary Warehouse not found!");
        return;
    }

    console.log(`Testing for Warehouse: ${warehouse.name} (${warehouse.id})`);

    // Step 1: Find all Product IDs that have STOCK > 0 in this warehouse
    const validInventory = await prisma.inventory.findMany({
        where: {
            warehouseId: warehouse.id,
            itemQuantity: { gt: 0 }
        },
        select: { productId: true, itemQuantity: true }
    });

    console.log(`Found ${validInventory.length} inventory records with positive stock.`);
    console.log(JSON.stringify(validInventory, null, 2));

    const validProductIds = validInventory.map(i => i.productId);

    const where = {};
    where.id = { in: validProductIds };

    const productCount = await prisma.product.count({ where });
    console.log(`Product Count based on valid IDs: ${productCount}`);

    const products = await prisma.product.findMany({
        where,
        include: { inventory: true }
    });

    console.log(`Products Found: ${products.length}`);
    products.forEach(p => {
        console.log(`- ${p.name} (ID: ${p.id})`);
        const stockInWarehouse = p.inventory.find(i => i.warehouseId === warehouse.id);
        console.log(`  Stock in target warehouse: ${stockInWarehouse ? stockInWarehouse.itemQuantity : 'None'}`);
    });
}

runDebug()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
