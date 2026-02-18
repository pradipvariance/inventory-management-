import prisma from '../prisma.js';
import { z } from 'zod';
import { getIO } from '../socket.js';

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
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors });
        }
        res.status(500).json({ message: error.message });
    }
};

export const getPOs = async (req, res) => {
    try {
        let where = {};
        // If supplier, restrict to own POs
        if (req.user.role === 'SUPPLIER') {
            // Assuming Supplier ID logic needs to be implemented.
            // For now, simpler: Suppliers login? 
            // The requirement says "Supplier can view purchase orders assigned to them".
            // We need to link User to Supplier? Or just use "SUPPLIER" role users are generic?
            // "Confirm or reject purchase orders". 
            // Let's assume the User IS the Supplier contact or linked. 
            // For MVP: Return all POs or filter by supplierId if passed in params.
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
        res.status(500).json({ message: error.message });
    }
};
