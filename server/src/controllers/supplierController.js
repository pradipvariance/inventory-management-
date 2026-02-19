import prisma from '../prisma.js';
import { z } from 'zod';

import bcrypt from 'bcrypt';

const supplierSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
});

export const createSupplier = async (req, res) => {
    try {
        const { name, email } = supplierSchema.parse(req.body);

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt); // Default password for new suppliers

        const supplier = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'SUPPLIER',
                status: true
            },
        });
        res.status(201).json(supplier);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors });
        }
        res.status(500).json({ message: error.message });
    }
};

export const getSuppliers = async (req, res) => {
    try {
        const suppliers = await prisma.user.findMany({
            where: { role: 'SUPPLIER' },
            orderBy: { createdAt: 'desc' },
        });
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
