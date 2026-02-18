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
