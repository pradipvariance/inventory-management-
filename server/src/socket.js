import { Server } from "socket.io";

let io;

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*", // Adjust for production
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log("New client connected", socket.id);

        socket.on("join", (userData) => {
            if (userData.id) {
                socket.join(`user:${userData.id}`);
                console.log(`User ${userData.id} joined their private room`);
            }
            if (['SUPER_ADMIN', 'WAREHOUSE_ADMIN', 'INVENTORY_MANAGER'].includes(userData.role)) {
                socket.join('management');
                console.log(`User joined management room`);
            }
        });

        socket.on("subscribe_product", (productId) => {
            socket.join(`product:${productId}`);
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected", socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};
