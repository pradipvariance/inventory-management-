
import { PrismaClient, UnitType } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const generateRandomString = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

const categories = ['Electronics', 'Clothing', 'Home', 'Toys', 'Books', 'Sports', 'Beauty', 'Furniture'];

async function main() {
    console.log('Start seeding products...');

    // 1. Get or Create a Warehouse
    let warehouse = await prisma.warehouse.findFirst();
    if (!warehouse) {
        console.log("No warehouse found. Creating one...");
        warehouse = await prisma.warehouse.create({
            data: {
                name: "Main Warehouse",
                location: "Headquarters",
                capacity: 10000
            }
        });
    }
    console.log(`Using Warehouse: ${warehouse.name} (${warehouse.id})`);

    // 2. Clear existing products (Optional - commented out for safety)
    // await prisma.inventory.deleteMany({});
    // await prisma.product.deleteMany({});

    // 3. Create 100 Dummy Products
    const products = [];
    for (let i = 0; i < 100; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const name = `${category} Item ${generateRandomString(4).toUpperCase()}`;
        const sku = `SKU-${generateRandomString(6).toUpperCase()}`;
        const barcode = `BAR-${generateRandomString(8).toUpperCase()}`;
        const price = parseFloat((Math.random() * 500 + 10).toFixed(2)); // Price between 10 and 510

        products.push({
            name,
            sku,
            barcode,
            category,
            unitType: UnitType.ITEM,
            minStockLevel: 10,
            amount: price,
            // image: null // No image for dummy data
        });
    }

    console.log(`Prepared ${products.length} products to insert.`);

    let count = 0;
    for (const p of products) {
        try {
            const createdProduct = await prisma.product.create({
                data: {
                    ...p,
                    inventory: {
                        create: {
                            warehouseId: warehouse.id,
                            itemQuantity: Math.floor(Math.random() * 100), // Random stock 0-99
                            boxQuantity: 0
                        }
                    }
                }
            });
            count++;
            if (count % 10 === 0) console.log(`Created ${count} products...`);
        } catch (e) {
            console.error(`Failed to create product ${p.sku}: ${e.message}`);
        }
    }

    console.log(`Seeding finished. Added ${count} products.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
