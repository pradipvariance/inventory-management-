import prisma from '../prisma.js';
import { z } from 'zod';

const warehouseSchema = z.object({
    name: z.string().min(2),
    location: z.string().min(3),
});

export const createWarehouse = async (req, res) => {
    try {
        const { name, location } = warehouseSchema.parse(req.body);
        const warehouse = await prisma.warehouse.create({
            data: { name, location },
        });
        res.status(201).json(warehouse);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors });
        }
        res.status(500).json({ message: error.message });
    }
};

export const getWarehouses = async (req, res) => {
    try {
        const warehouses = await prisma.warehouse.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                inventory: true,
            }
        });
        res.json(warehouses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getWarehouse = async (req, res) => {
    try {
        const warehouse = await prisma.warehouse.findUnique({
            where: { id: req.params.id },
            include: { inventory: true },
        });
        if (!warehouse) return res.status(404).json({ message: 'Warehouse not found' });
        res.json(warehouse);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateWarehouse = async (req, res) => {
    try {
        const { name, location } = warehouseSchema.parse(req.body);
        const warehouse = await prisma.warehouse.update({
            where: { id: req.params.id },
            data: { name, location },
        });
        res.json(warehouse);
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'Warehouse not found' });
        if (error instanceof z.ZodError) return res.status(400).json({ message: error.errors });
        res.status(500).json({ message: error.message });
    }
};

export const deleteWarehouse = async (req, res) => {
    try {
        await prisma.warehouse.delete({ where: { id: req.params.id } });
        res.json({ message: 'Warehouse deleted' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'Warehouse not found' });
        res.status(500).json({ message: error.message });
    }
};
