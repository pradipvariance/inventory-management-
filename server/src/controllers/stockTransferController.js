import prisma from '../prisma.js';
import { z } from 'zod';
import { getIO } from '../socket.js';

const transferSchema = z.object({
    productId: z.string().uuid(),
    fromWarehouseId: z.string().uuid(),
    toWarehouseId: z.string().uuid(),
    itemQuantity: z.number().int().min(0).optional(),
    boxQuantity: z.number().int().min(0).optional(),
});

export const createTransfer = async (req, res) => {
    try {
        const { productId, fromWarehouseId, toWarehouseId, itemQuantity = 0, boxQuantity = 0 } = transferSchema.parse(req.body);

        if (itemQuantity === 0 && boxQuantity === 0) {
            return res.status(400).json({ message: 'Quantity must be greater than 0' });
        }

        if (fromWarehouseId === toWarehouseId) {
            return res.status(400).json({ message: 'Source and destination warehouses must be different' });
        }

        // Just check if stock exists (Validation) but don't deduct yet?
        // Or deduct and hold in "In Transit"?
        // Requirement: "Warehouse Admin... Approve internal stock transfers."
        // Usually, creation is a Request.
        // So we just create the record with status PENDING.
        // Validation: Check if source HAS enough stock to request?

        const sourceInventory = await prisma.inventory.findUnique({
            where: { productId_warehouseId: { productId, warehouseId: fromWarehouseId } },
        });

        if (!sourceInventory || sourceInventory.itemQuantity < itemQuantity || sourceInventory.boxQuantity < boxQuantity) {
            return res.status(400).json({ message: 'Insufficient stock in source warehouse' });
        }

        const transfer = await prisma.stockTransfer.create({
            data: {
                productId,
                fromWarehouseId,
                toWarehouseId,
                itemQuantity,
                boxQuantity,
                status: 'PENDING',
                createdById: req.user.id
            },
        });

        res.status(201).json(transfer);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors });
        }
        res.status(500).json({ message: error.message });
    }
};

export const approveTransfer = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await prisma.$transaction(async (prisma) => {
            const transfer = await prisma.stockTransfer.findUnique({ where: { id } });
            if (!transfer) throw new Error('Transfer not found');
            if (transfer.status !== 'PENDING') throw new Error('Transfer is not pending');

            if (req.user.role === 'WAREHOUSE_ADMIN' && req.user.warehouseId) {
                if (transfer.toWarehouseId !== req.user.warehouseId) {
                    throw new Error('Not authorized to approve transfers for this warehouse');
                }
            }

            // 1. Deduct from Source
            const sourceInventory = await prisma.inventory.findUnique({
                where: { productId_warehouseId: { productId: transfer.productId, warehouseId: transfer.fromWarehouseId } },
            });

            if (!sourceInventory || sourceInventory.itemQuantity < transfer.itemQuantity || sourceInventory.boxQuantity < transfer.boxQuantity) {
                throw new Error('Insufficient stock in source warehouse');
            }

            await prisma.inventory.update({
                where: { id: sourceInventory.id },
                data: {
                    itemQuantity: { decrement: transfer.itemQuantity },
                    boxQuantity: { decrement: transfer.boxQuantity },
                },
            });

            // Emit Source Update
            try {
                getIO().to(`product:${transfer.productId}`).emit('stock_update', {
                    productId: transfer.productId,
                    warehouseId: transfer.fromWarehouseId,
                    change: -transfer.itemQuantity,
                    type: 'decrease'
                });
            } catch (err) {
                console.log('Socket emit failed', err);
            }

            // 2. Add to Destination
            await prisma.inventory.upsert({
                where: { productId_warehouseId: { productId: transfer.productId, warehouseId: transfer.toWarehouseId } },
                update: {
                    itemQuantity: { increment: transfer.itemQuantity },
                    boxQuantity: { increment: transfer.boxQuantity },
                },
                create: {
                    productId: transfer.productId,
                    warehouseId: transfer.toWarehouseId,
                    itemQuantity: transfer.itemQuantity,
                    boxQuantity: transfer.boxQuantity,
                },
            });

            // Emit Destination Update
            try {
                getIO().to(`product:${transfer.productId}`).emit('stock_update', {
                    productId: transfer.productId,
                    warehouseId: transfer.toWarehouseId,
                    change: transfer.itemQuantity,
                    type: 'increase'
                });
            } catch (err) {
                console.log('Socket emit failed', err);
            }

            const updatedTransfer = await prisma.stockTransfer.update({
                where: { id },
                data: { status: 'COMPLETED' } // Or APPROVED? Let's go straight to completed for simplicity unless "In Transit" is needed.
            });

            return updatedTransfer;
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const rejectTransfer = async (req, res) => {
    const { id } = req.params;
    try {
        const transfer = await prisma.stockTransfer.update({
            where: { id },
            data: { status: 'REJECTED' }
        });
        res.json(transfer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getTransfers = async (req, res) => {
    try {
        const { status } = req.query;
        let where = {};

        if (req.user.role === 'WAREHOUSE_ADMIN' && req.user.warehouseId) {
            // Warehouse Admin sees transfers related to their warehouse
            where = {
                OR: [
                    { fromWarehouseId: req.user.warehouseId },
                    { toWarehouseId: req.user.warehouseId }
                ]
            };
        }

        if (status) {
            where.status = status;
        }

        const transfers = await prisma.stockTransfer.findMany({
            where,
            include: {
                product: true,
                fromWarehouse: true,
                toWarehouse: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(transfers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getPendingTransfersCount = async (req, res) => {
    try {
        const { warehouseId, role } = req.user;
        let where = { status: 'PENDING' };

        if (role === 'WAREHOUSE_ADMIN' && warehouseId) {
            // Only show incoming transfers that need approval
            where.toWarehouseId = warehouseId;
        } else if (role === 'SUPER_ADMIN') {
            // Super Admin sees all pending? Or maybe none specifically for "My Actions"
            // For now let's return all pending for Super Admin
        }

        const count = await prisma.stockTransfer.count({ where });
        const transfers = await prisma.stockTransfer.findMany({
            where,
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
            orderBy: { createdAt: 'desc' }
        });

        res.json({ count, transfers });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
