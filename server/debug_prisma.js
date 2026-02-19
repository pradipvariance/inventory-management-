import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Testing Prisma connection...');
    try {
        const count = await prisma.stockTransfer.count({
            where: { status: 'PENDING' }
        });
        console.log('Count success:', count);

        const transfers = await prisma.stockTransfer.findMany({
            where: { status: 'PENDING' },
            include: {
                product: true,
                fromWarehouse: true,
                toWarehouse: true,
                createdBy: {
                    select: {
                        name: true,
                        role: true
                    }
                }
            },
            take: 1
        });
        console.log('FindMany success:', transfers);

    } catch (error) {
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        if (error.meta) console.error('Error Meta:', error.meta);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
