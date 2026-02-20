import prisma from '../prisma.js';
import { getIO } from '../socket.js';
import { calculateWarehouseUsage } from '../utils/inventoryUtils.js';

export const getAllInventory = async (req, res) => {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (page - 1) * limit;

    try {
        const { warehouseId } = req.query;
        const where = {};

        if ((req.user.role === 'WAREHOUSE_ADMIN' || req.user.role === 'INVENTORY_MANAGER') && req.user.warehouseId) {
            where.warehouseId = req.user.warehouseId;
        } else if (warehouseId) {
            where.warehouseId = warehouseId;
        }

        if (search) {
            where.product = {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { sku: { contains: search, mode: 'insensitive' } },
                ],
            };
        }

        if (req.query.category) {
            // If product search exists, merge category filter into it
            where.product = {
                ...where.product,
                category: req.query.category
            };
        }

        const [inventory, total] = await prisma.$transaction([
            prisma.inventory.findMany({
                where,
                include: {
                    product: true,
                    warehouse: true,
                },
                skip: parseInt(skip),
                take: parseInt(limit),
                orderBy: { updatedAt: 'desc' },
            }),
            prisma.inventory.count({ where }),
        ]);

        res.json({
            inventory,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            totalInventory: total,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const adjustInventory = async (req, res) => {
    const { productId, warehouseId, type, quantity, reason } = req.body;

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get current inventory
            const inventory = await tx.inventory.findUnique({
                where: { productId_warehouseId: { productId, warehouseId } },
                include: { product: true }
            });

            if (!inventory) throw new Error('Inventory record not found');

            const boxSize = inventory.product.boxSize || 1;
            const currentTotalUnits = inventory.itemQuantity + (inventory.boxQuantity * boxSize);

            let unitsToRemove = 0;
            let itemsRemovedForNote = 0;
            let boxesRemovedForNote = 0;

            if (type === 'DELETE_ALL') {
                unitsToRemove = currentTotalUnits;
                itemsRemovedForNote = inventory.itemQuantity;
                boxesRemovedForNote = inventory.boxQuantity;
            } else if (type === 'DELETE_SPECIFIC') {
                unitsToRemove = parseInt(quantity);
                if (isNaN(unitsToRemove) || unitsToRemove <= 0) {
                    throw new Error('Invalid quantity');
                }
                if (unitsToRemove > currentTotalUnits) {
                    throw new Error('Cannot remove more than available quantity');
                }
                // For simplicity in the report, we record the total requested units
                itemsRemovedForNote = unitsToRemove;
                boxesRemovedForNote = 0;
            } else {
                throw new Error('Invalid adjustment type');
            }

            // 2. Calculate New State
            const newTotalUnits = currentTotalUnits - unitsToRemove;
            const newBoxQuantity = Math.floor(newTotalUnits / boxSize);
            const newItemQuantity = newTotalUnits % boxSize;

            // 3. Update Inventory
            const updatedInventory = await tx.inventory.update({
                where: { id: inventory.id },
                data: {
                    itemQuantity: newItemQuantity,
                    boxQuantity: newBoxQuantity
                }
            });

            // 4. Create CreditDebitNote
            await tx.creditDebitNote.create({
                data: {
                    type: 'DEBIT',
                    amount: inventory.product.amount.mul(unitsToRemove), // Accurate financial value
                    reason: reason || 'Manual adjustment by Super Admin',
                    productId,
                    warehouseId,
                    itemQuantity: itemsRemovedForNote,
                    boxQuantity: boxesRemovedForNote
                }
            });

            // 5. Fetch full warehouse for socket emission
            const fullWarehouse = await tx.warehouse.findUnique({
                where: { id: warehouseId },
                include: { inventory: { include: { product: true } } }
            });

            const warehouseWithUsage = {
                ...fullWarehouse,
                usage: calculateWarehouseUsage(fullWarehouse)
            };

            try {
                getIO().to('management').emit('warehouse_updated', warehouseWithUsage);
            } catch (err) { }

            return updatedInventory;
        });

        res.json({ message: 'Inventory adjusted successfully', inventory: result });
    } catch (error) {
        console.error("Adjust Inventory Error:", error.message || error);
        res.status(400).json({ message: error.message });
    }
};
