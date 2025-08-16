const { Server } = require('socket.io');
const { eventconnection } = require("./connectionHandler")
const socketIo = require("socket.io");

const socketserver = async (server, corsconfig) => {
    const io = socketIo(server, {
        cors: corsconfig,
        pingInterval: 10000,
        pingTimeout: 20000,
    });

    io.use((socket, next) => {
        if (socket.handshake.query.token === "UNITY" || socket.handshake.query.token == "WEB" || socket.handshake.query.token === "SERVER") {
            next();
        }
        else{
            next(new Error("Authentication failed"));
        }
    });

    io.on('connection', (socket) => {
        console.log(`New client connected: ${socket.id}`);
        eventconnection(io, socket);
    });
}

module.exports = {
  socketserver
};