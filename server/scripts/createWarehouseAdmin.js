import prisma from '../src/prisma.js';
import bcrypt from 'bcrypt';

const createWarehouseAdmin = async () => {
    try {
        const email = 'warehouse@admin.com';
        const password = 'password123';
        const name = 'Warehouse Admin';
        const role = 'WAREHOUSE_ADMIN';

        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (existingUser) {
            console.log('User already exists:', email);

            // Optional: Update role if needed
            if (existingUser.role !== role) {
                await prisma.user.update({
                    where: { email },
                    data: { role }
                });
                console.log('Updated user role to:', role);
            }
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role,
                    status: true // Ensure active
                }
            });
            console.log('Created Warehouse Admin user:', email);
        }
    } catch (error) {
        console.error('Error creating user:', error);
    } finally {
        await prisma.$disconnect();
    }
};

createWarehouseAdmin();
