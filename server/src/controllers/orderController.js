import prisma from '../prisma.js';
import { z } from 'zod';
import { getIO } from '../socket.js';

const orderItemSchema = z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1),
    price: z.number().min(0),
});

const createOrderSchema = z.object({
    items: z.array(orderItemSchema).min(1),
    totalAmount: z.number().min(0),
});

export const createOrder = async (req, res) => {
    try {
        const { items, totalAmount } = createOrderSchema.parse(req.body);

        const result = await prisma.$transaction(async (prisma) => {
            // 1. Get Customer
            let customer = await prisma.customer.findFirst({
                where: { name: req.user.name }
            });

            if (!customer) {
                customer = await prisma.customer.create({
                    data: {
                        name: req.user.name,
                        type: 'REGULAR',
                    }
                });
            }

            // 2. Create Order
            const order = await prisma.order.create({
                data: {
                    customerId: customer.id,
                    totalAmount,
                    status: 'PENDING',
                    orderItems: {
                        create: items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price
                        }))
                    }
                }
            });

            // 3. Deduct Stock & Lock for Concurrency
            for (const item of items) {
                const stock = await prisma.inventory.findMany({
                    where: { productId: item.productId, itemQuantity: { gte: item.quantity } },
                    orderBy: { itemQuantity: 'desc' },
                    take: 1
                });

                if (stock.length === 0) {
                    throw new Error(`Insufficient stock for product ${item.productId}`);
                }

                await prisma.inventory.update({
                    where: { id: stock[0].id },
                    data: { itemQuantity: { decrement: item.quantity } }
                });

                // Socket Emit
                try {
                    getIO().to(`product:${item.productId}`).emit('stock_update', {
                        productId: item.productId,
                        warehouseId: stock[0].warehouseId,
                        change: -item.quantity,
                        type: 'decrease'
                    });
                } catch (err) {
                    console.log('Socket emit failed', err);
                }
            }

            return order;
        });

        res.status(201).json(result);

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors });
        }
        res.status(500).json({ message: error.message });
    }
};

export const getOrders = async (req, res) => {
    try {
        let where = {};
        if (req.user.role === 'CUSTOMER') {
            const customer = await prisma.customer.findFirst({
                where: { name: req.user.name }
            });
            if (customer) {
                where.customerId = customer.id;
            } else {
                return res.json([]);
            }
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                customer: true,
                orderItems: {
                    include: { product: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const order = await prisma.order.update({
            where: { id },
            data: { status },
            include: { customer: true }
        });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
