import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prisma.js';
import { z } from 'zod';

const generateTokens = (id) => {
    const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '2d',
    });
    const refreshToken = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: '7d',
    });
    return { accessToken, refreshToken };
};

const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['SUPER_ADMIN', 'WAREHOUSE_ADMIN', 'INVENTORY_MANAGER', 'CUSTOMER', 'SUPPLIER']).optional(),
});

export const register = async (req, res) => {
    try {
        const { name, email, password, role } = registerSchema.parse(req.body);

        const userExists = await prisma.user.findUnique({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'CUSTOMER',
                warehouseId: req.body.warehouseId || null,
            },
            select: { id: true, name: true, email: true, role: true, warehouseId: true },
        });

        const tokens = generateTokens(user.id);

        res.status(201).json({ user, ...tokens });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors });
        }
        res.status(500).json({ message: error.message });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { warehouse: { select: { name: true } } }
        });

        if (user && (await bcrypt.compare(password, user.password))) {
            if (!user.status) return res.status(403).json({ message: 'Account disabled' });

            const tokens = generateTokens(user.id);
            res.json({
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    warehouseId: user.warehouseId,
                    warehouse: user.warehouse
                },
                ...tokens,
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getProfile = async (req, res) => {
    // User is already attached to req by protect middleware
    res.json(req.user);
};

export const refreshToken = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'No refresh token provided' });

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });

        if (!user) return res.status(401).json({ message: 'User not found' });
        if (!user.status) return res.status(403).json({ message: 'Account disabled' });

        const tokens = generateTokens(user.id);
        res.json(tokens);
    } catch (error) {
        res.status(403).json({ message: 'Invalid refresh token' });
    }
}
