import prisma from '../prisma.js';
import { z } from 'zod';

const supplierSchema = z.object({
    name: z.string().min(2),
    contactInfo: z.string().min(5),
});

export const createSupplier = async (req, res) => {
    try {
        const { name, contactInfo } = supplierSchema.parse(req.body);
        const supplier = await prisma.supplier.create({
            data: { name, contactInfo },
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
        const suppliers = await prisma.supplier.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
