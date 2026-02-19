import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password123', salt);

    console.log('--- Reseting Database ---');
    // Note: Reset happens via CLI, but let's clear main data to avoid conflicts if running multiple times
    await prisma.purchaseOrderItem.deleteMany({});
    await prisma.purchaseOrder.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.inventory.deleteMany({});
    await prisma.stockTransfer.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.warehouse.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.user.deleteMany({});

    console.log('--- Seeding Comprehensive Data ---');

    // 1. Users
    const superAdmin = await prisma.user.create({
        data: { email: 'admin@test.com', name: 'Super Admin', password, role: 'SUPER_ADMIN' }
    });
    const warehouseAdmin1 = await prisma.user.create({
        data: { email: 'warehouse1@test.com', name: 'John Warehouse', password, role: 'WAREHOUSE_ADMIN' }
    });
    const warehouseAdmin2 = await prisma.user.create({
        data: { email: 'warehouse2@test.com', name: 'Jane Warehouse', password, role: 'WAREHOUSE_ADMIN' }
    });
    const inventoryManager = await prisma.user.create({
        data: { email: 'manager@test.com', name: 'Bob Manager', password, role: 'INVENTORY_MANAGER' }
    });
    const supplier1 = await prisma.user.create({
        data: { email: 'supplier1@test.com', name: 'Global Tech Supplies', password, role: 'SUPPLIER' }
    });
    const supplier2 = await prisma.user.create({
        data: { email: 'supplier2@test.com', name: 'Office Essentials Ltd', password, role: 'SUPPLIER' }
    });

    console.log('✅ Users created');

    // 2. Warehouses
    const wh1 = await prisma.warehouse.create({
        data: { name: 'East Coast Hub', location: 'New York, NY', capacity: 10000 }
    });
    const wh2 = await prisma.warehouse.create({
        data: { name: 'West Coast Distribution', location: 'Los Angeles, CA', capacity: 8000 }
    });

    await prisma.user.update({ where: { id: warehouseAdmin1.id }, data: { warehouseId: wh1.id } });
    await prisma.user.update({ where: { id: warehouseAdmin2.id }, data: { warehouseId: wh2.id } });

    console.log('✅ Warehouses created');

    // 3. Products
    const products = await Promise.all([
        prisma.product.create({ data: { name: 'MacBook Pro 14', sku: 'LAP-001', barcode: '888001', category: 'Electronics', unitType: 'ITEM', amount: 1999.99, minStockLevel: 10 } }),
        prisma.product.create({ data: { name: 'iPhone 15 Pro', sku: 'PHN-001', barcode: '888002', category: 'Electronics', unitType: 'ITEM', amount: 999.00, minStockLevel: 20 } }),
        prisma.product.create({ data: { name: 'Ergonomic Desk Chair', sku: 'FUR-001', barcode: '888003', category: 'Furniture', unitType: 'BOX', boxSize: 1, amount: 249.50, minStockLevel: 5 } }),
        prisma.product.create({ data: { name: 'Wireless Mouse', sku: 'ACC-001', barcode: '888004', category: 'Electronics', unitType: 'ITEM', amount: 49.99, minStockLevel: 50 } }),
        prisma.product.create({ data: { name: 'Printer Paper A4', sku: 'OFF-001', barcode: '888005', category: 'Office', unitType: 'BOX', boxSize: 5, amount: 25.00, minStockLevel: 100 } }),
    ]);

    console.log('✅ Products created');

    // 4. Inventory (Populate some stock)
    await Promise.all([
        prisma.inventory.create({ data: { productId: products[0].id, warehouseId: wh1.id, itemQuantity: 15 } }),
        prisma.inventory.create({ data: { productId: products[1].id, warehouseId: wh1.id, itemQuantity: 5 } }), // Low stock!
        prisma.inventory.create({ data: { productId: products[2].id, warehouseId: wh2.id, itemQuantity: 20 } }),
        prisma.inventory.create({ data: { productId: products[3].id, warehouseId: wh2.id, itemQuantity: 120 } }),
        prisma.inventory.create({ data: { productId: products[4].id, warehouseId: wh1.id, itemQuantity: 300, boxQuantity: 60 } }),
    ]);

    console.log('✅ Inventory populated');

    // 5. Customers
    const customers = await Promise.all([
        prisma.customer.create({ data: { name: 'Alice Smith', type: 'REGULAR', creditLimit: 1000 } }),
        prisma.customer.create({ data: { name: 'Bob Johnson', type: 'REGULAR', creditLimit: 2000 } }),
        prisma.customer.create({ data: { name: 'Central Gas Station', type: 'GAS', creditLimit: 5000 } }),
    ]);

    console.log('✅ Customers created');

    // 6. Orders
    const order1 = await prisma.order.create({
        data: {
            customerId: customers[0].id,
            totalAmount: 2049.98,
            status: 'DELIVERED',
            orderItems: {
                create: [
                    { productId: products[0].id, quantity: 1, price: 1999.99 },
                    { productId: products[3].id, quantity: 1, price: 49.99 },
                ]
            }
        }
    });

    const order2 = await prisma.order.create({
        data: {
            customerId: customers[2].id,
            totalAmount: 250.00,
            status: 'PENDING',
            orderItems: {
                create: [
                    { productId: products[4].id, quantity: 10, price: 25.00 },
                ]
            }
        }
    });

    console.log('✅ Orders and OrderItems created');

    // 7. Purchase Orders
    const po1 = await prisma.purchaseOrder.create({
        data: {
            supplierId: supplier1.id,
            warehouseId: wh1.id,
            status: 'RECEIVED',
            totalAmount: 15000,
            items: {
                create: [
                    { productId: products[1].id, quantity: 15, unitCost: 1000 }
                ]
            }
        }
    });

    const po2 = await prisma.purchaseOrder.create({
        data: {
            supplierId: supplier2.id,
            warehouseId: wh2.id,
            status: 'PENDING',
            totalAmount: 500,
            items: {
                create: [
                    { productId: products[2].id, quantity: 2, unitCost: 250 }
                ]
            }
        }
    });

    console.log('✅ Purchase Orders created');

    // 8. Stock Transfers
    await prisma.stockTransfer.create({
        data: {
            productId: products[3].id,
            fromWarehouseId: wh2.id,
            toWarehouseId: wh1.id,
            itemQuantity: 50,
            boxQuantity: 0,
            status: 'COMPLETED'
        }
    });

    console.log('✅ Stock Transfers created');

    // 9. Credit/Debit Notes
    await prisma.creditDebitNote.create({
        data: {
            type: 'DEBIT',
            amount: 50.00,
            reason: 'Damaged packaging during shipment',
            productId: products[3].id,
            warehouseId: wh1.id
        }
    });

    console.log('✅ Credit/Debit Notes created');

    console.log('\n--- Seeding Complete! ---');
    console.log('Super Admin: admin@test.com / password123');
    console.log('Warehouse 1 Admin: warehouse1@test.com / password123');
    console.log('Supplier 1: supplier1@test.com / password123');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
