import prisma from '../src/prisma.js';
import 'dotenv/config';

async function seed() {
    console.log('🚀 Starting bulk data seeding (500 products)...');

    try {
        // 1. Fetch existing warehouses
        const warehouses = await prisma.warehouse.findMany();
        if (warehouses.length === 0) {
            console.error('❌ No warehouses found. Please create at least one warehouse first.');
            return;
        }

        const categories = ['Electronics', 'Home & Garden', 'Clothing', 'Sports', 'Food & Beverage', 'Health', 'Automotive', 'Toys'];
        const unitTypes = ['ITEM', 'BOX'];

        const productsToCreate = [];
        const batchSize = 50;

        for (let i = 1; i <= 500; i++) {
            const randomCategory = categories[Math.floor(Math.random() * categories.length)];
            const randomUnitType = unitTypes[Math.floor(Math.random() * unitTypes.length)];
            const timestamp = Date.now();

            // Generate unique SKU and Barcode
            const sku = `PROD-${timestamp}-${i}`;
            const barcode = `BAR-${timestamp}-${i}`;

            productsToCreate.push({
                name: `Bulk Product ${i}`,
                sku: sku,
                barcode: barcode,
                category: randomCategory,
                unitType: randomUnitType,
                boxSize: randomUnitType === 'BOX' ? Math.floor(Math.random() * 20) + 1 : null,
                minStockLevel: Math.floor(Math.random() * 20) + 5,
                amount: (Math.random() * 1000 + 10).toFixed(2),
            });

            if (productsToCreate.length === batchSize || i === 500) {
                console.log(`📦 Creating batch of ${productsToCreate.length} products... (${i}/500)`);

                for (const productData of productsToCreate) {
                    const product = await prisma.product.create({
                        data: productData
                    });

                    // Randomly assign to a warehouse
                    const warehouse = warehouses[Math.floor(Math.random() * warehouses.length)];

                    await prisma.inventory.create({
                        data: {
                            productId: product.id,
                            warehouseId: warehouse.id,
                            itemQuantity: Math.floor(Math.random() * 900) + 100, // 100 to 1000
                            boxQuantity: product.unitType === 'BOX' ? Math.floor(Math.random() * 50) + 5 : 0
                        }
                    });
                }

                productsToCreate.length = 0; // Clear array
            }
        }

        console.log('✅ Successfully seeded 500 products and linked them to inventory!');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
