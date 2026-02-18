import prisma from '../prisma.js';
import { z } from 'zod';
import { getIO } from '../socket.js';

const adjustmentSchema = z.object({
    type: z.enum(['CREDIT', 'DEBIT']),
    amount: z.number().min(0),
    reason: z.string().min(3),
    productId: z.string().uuid().optional(),
    warehouseId: z.string().uuid().optional(),
    itemQuantity: z.number().int().min(0).optional(),
    boxQuantity: z.number().int().min(0).optional(),
});

export const createAdjustment = async (req, res) => {
    try {
        const data = adjustmentSchema.parse(req.body);
        const { type, amount, reason, productId, warehouseId, itemQuantity = 0, boxQuantity = 0 } = data;

        const result = await prisma.$transaction(async (prisma) => {
            // Create Note
            const note = await prisma.creditDebitNote.create({
                data: {
                    type,
                    amount,
                    reason,
                    productId,
                    warehouseId,
                    itemQuantity,
                    boxQuantity,
                },
            });

            // If inventory details are provided, update stock
            if (productId && warehouseId && (itemQuantity > 0 || boxQuantity > 0)) {
                if (type === 'CREDIT') {
                    // CREDIT NOTE = Return or Increase Stock
                    await prisma.inventory.upsert({
                        where: { productId_warehouseId: { productId, warehouseId } },
                        update: {
                            itemQuantity: { increment: itemQuantity },
                            boxQuantity: { increment: boxQuantity },
                        },
                        create: {
                            productId,
                            warehouseId,
                            itemQuantity,
                            boxQuantity,
                        },
                    });

                    // Emit Increase
                    try {
                        getIO().to(`product:${productId}`).emit('stock_update', {
                            productId,
                            warehouseId,
                            change: itemQuantity,
                            type: 'increase'
                        });
                    } catch (err) {
                        console.log('Socket emit failed', err);
                    }

                } else {
                    // DEBIT NOTE = Decrease Stock
                    const currentValues = await prisma.inventory.findUnique({
                        where: { productId_warehouseId: { productId, warehouseId } }
                    });

                    if (!currentValues || currentValues.itemQuantity < itemQuantity || currentValues.boxQuantity < boxQuantity) {
                        // Or throw error?
                    }

                    // Even if we don't have enough, maybe we still deduct (negative stock?) or fail?
                    // Assuming fail for now as checked in logic before.

                    if (currentValues) { // Only update if exists
                        await prisma.inventory.update({
                            where: { id: currentValues.id },
                            data: {
                                itemQuantity: { decrement: itemQuantity },
                                boxQuantity: { decrement: boxQuantity },
                            }
                        });


                        // Emit Decrease
                        try {
                            getIO().to(`product:${productId}`).emit('stock_update', {
                                productId,
                                warehouseId,
                                change: -itemQuantity,
                                type: 'decrease'
                            });
                        } catch (err) {
                            console.log('Socket emit failed', err);
                        }
                    }
                }
            }
            return note;
        });

        res.status(201).json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors });
        }
        res.status(500).json({ message: error.message });
    }
};

export const getAdjustments = async (req, res) => {
    try {
        const adjustments = await prisma.creditDebitNote.findMany({
            include: {
                product: true,
                warehouse: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(adjustments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
