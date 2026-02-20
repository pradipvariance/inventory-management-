import prisma from '../prisma.js';
import { z } from 'zod';
import { getIO } from '../socket.js';
import { checkWarehouseCapacity } from '../utils/inventoryUtils.js';

const poItemSchema = z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1),
    unitCost: z.number().min(0),
});

const createPOSchema = z.object({
    supplierId: z.string().uuid(),
    warehouseId: z.string().uuid(),
    items: z.array(poItemSchema).min(1),
    deliveryDate: z.string().optional(), // ISO Date string
});

export const createPO = async (req, res) => {
    try {
        const { supplierId, warehouseId, items, deliveryDate } = createPOSchema.parse(req.body);

        // Calculate total amount
        const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

        const po = await prisma.purchaseOrder.create({
            data: {
                supplierId,
                warehouseId,
                totalAmount,
                status: 'PENDING',
                deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
                items: {
                    create: items
                }
            },
            include: { items: true }
        });

        res.status(201).json(po);
    } catch (error) {
        // Safer logging to avoid TypeError in node:internal/util/inspect
        console.error("Create PO Error:", error.message || "Unknown error");

        if (error instanceof z.ZodError) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: error.errors
            });
        }
        res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
};

export const getPOs = async (req, res) => {
    try {
        let where = {};
        // If supplier, restrict to own POs
        if (req.user.role === 'SUPPLIER') {
            where.supplierId = req.user.id;
        }

        const pos = await prisma.purchaseOrder.findMany({
            where,
            include: {
                supplier: true,
                warehouse: true,
                items: { include: { product: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(pos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updatePOStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // PENDING, CONFIRMED, DELIVERED, RECEIVED, CANCELLED

    try {
        // Start transaction if receiving
        const result = await prisma.$transaction(async (prisma) => {
            const po = await prisma.purchaseOrder.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!po) throw new Error('PO not found');

            // If marking as RECEIVED, update inventory
            if (status === 'RECEIVED' && po.status !== 'RECEIVED') {
                if (!po.warehouseId) throw new Error('PO has no warehouse assigned');

                // ENFORCE CAPACITY CHECK
                const totalAdditionalItems = po.items.reduce((sum, item) => sum + item.quantity, 0);
                await checkWarehouseCapacity(po.warehouseId, totalAdditionalItems);

                for (const item of po.items) {
                    await prisma.inventory.upsert({
                        where: { productId_warehouseId: { productId: item.productId, warehouseId: po.warehouseId } },
                        update: {
                            itemQuantity: { increment: item.quantity }
                        },
                        create: {
                            productId: item.productId,
                            warehouseId: po.warehouseId,
                            itemQuantity: item.quantity,
                            boxQuantity: 0
                        }
                    });

                    // Emit socket event for stock update
                    try {
                        getIO().to(`product:${item.productId}`).emit('stock_update', {
                            productId: item.productId,
                            warehouseId: po.warehouseId,
                            change: item.quantity,
                            type: 'increase'
                        });
                    } catch (err) {
                        console.log('Socket emit failed', err);
                    }
                }
            }

            const updatedPO = await prisma.purchaseOrder.update({
                where: { id },
                data: { status },
                include: { supplier: true, warehouse: true, items: { include: { product: true } } }
            });

            return updatedPO;
        });

        res.json(result);
    } catch (error) {
        console.error("Update PO Status Error:", error.message || "Unknown error");

        // Handle specific inventory/capacity errors
        if (error.message && error.message.includes('Warehouse capacity exceeded')) {
            return res.status(400).json({ message: error.message });
        }

        res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
};
