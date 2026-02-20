import prisma from '../prisma.js';

/**
 * Checks if a warehouse has enough capacity for additional items.
 * @param {string} warehouseId - The ID of the warehouse to check.
 * @param {number} additionalItems - The number of new items to add.
 * @returns {Promise<boolean>} - Returns true if capacity is sufficient, throws error if not.
 */
export const checkWarehouseCapacity = async (warehouseId, additionalItems) => {
    const warehouse = await prisma.warehouse.findUnique({
        where: { id: warehouseId },
        include: { inventory: { include: { product: true } } }
    });

    if (!warehouse) {
        throw new Error('Warehouse not found');
    }

    // specific logic: capacity is generally total items count?
    // User said: "capacity is measuired by items count"
    // We need to sum up all items in the warehouse.
    // Inventory has itemQuantity and boxQuantity.
    // Total items = itemQuantity + (boxQuantity * product.boxSize)

    let currentTotalItems = 0;

    for (const item of warehouse.inventory) {
        const productBoxSize = item.product.boxSize || 1; // Default to 1 if not set? Or 0? Usually boxSize implies quantity per box.
        // If boxSize is missing, boxQuantity might not make sense or implies 1-to-1?
        // Let's assume boxSize 1 if null for safety, or 0 if we want to ignore boxes without size.
        // However, existing logic uses boxSize for calc.
        const boxSize = item.product.boxSize || 0;
        currentTotalItems += item.itemQuantity + (item.boxQuantity * boxSize);
    }

    if (currentTotalItems + additionalItems > warehouse.capacity) {
        throw new Error(`Warehouse capacity exceeded. Capacity: ${warehouse.capacity}, Current: ${currentTotalItems}, Adding: ${additionalItems}`);
    }

    return true;
};

/**
 * Calculates the current usage of a warehouse.
 * @param {object} warehouse - The warehouse object with inventory included.
 * @returns {object} - { used, capacity, available }
 */
export const calculateWarehouseUsage = (warehouse) => {
    let currentTotalItems = 0;
    if (warehouse.inventory) {
        for (const item of warehouse.inventory) {
            const boxSize = item.product?.boxSize || 0;
            currentTotalItems += item.itemQuantity + (item.boxQuantity * boxSize);
        }
    }
    return {
        used: currentTotalItems,
        capacity: warehouse.capacity,
        available: Math.max(0, warehouse.capacity - currentTotalItems)
    };
};
