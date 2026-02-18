import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import { createServer } from 'http';
import { initSocket } from './socket.js';

const app = express();
const httpServer = createServer(app);
const io = initSocket(httpServer);
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

import authRoutes from './routes/authRoutes.js';
import warehouseRoutes from './routes/warehouseRoutes.js';
import productRoutes from './routes/productRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import stockTransferRoutes from './routes/stockTransferRoutes.js';
import adjustmentRoutes from './routes/adjustmentRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import purchaseOrderRoutes from './routes/purchaseOrderRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/transfers', stockTransferRoutes);
app.use('/api/adjustments', adjustmentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/reports', reportRoutes);

app.get('/', (req, res) => {
  res.send('Inventory Management System API is running');
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
