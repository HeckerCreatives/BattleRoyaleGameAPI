const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const http = require("http");
const cors = require("cors");
const socketIo = require("socket.io");
require("dotenv").config();

const {gameserverinit} = require("./Initialize/init")

const app = express();

const corsConfig = {
    origin: [""],
    methods: ["GET", "POST", "PUT", "DELETE"], // List only` available methods
    credentials: true, // Must be set to true
    allowedHeaders: ["Origin", "Content-Type", "X-Requested-With", "Accept", "Authorization"],
    credentials: true, // Allowed Headers to be received
};

app.use(cors(corsConfig));
const server = http.createServer(app);

mongoose
  .connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB Connected");
    gameserverinit()
  })
  .catch((err) => console.log(err));
  

app.use(bodyParser.json({ limit: "50mb" }))
app.use(bodyParser.urlencoded({ limit: "50mb", extended: false, parameterLimit: 50000 }))


const {userlogout} = require("./utils/auth")

const io = socketIo(server, {
  cors: corsConfig,
  pingInterval: 10000,
  pingTimeout: 20000,
});

// Token-based authentication middleware
io.use((socket, next) => {
  if (socket.handshake.query.token === "UNITY") {
    console.log("UNITY AUTHENTICATION");
    next();
  } else {
    next(new Error("Authentication error"));
  }
});

const activeUsers = new Map(); // userId -> socket.id
const socketHeartbeats = new Map(); // socket.id -> timeout

const TIMEOUT = 20000; // 10 seconds

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Store userId for cleanup later
  let currentUserId = null;

  const sendPing = () => {
    if (!socket.connected) return;
    console.log('Sending ping to:', socket.id);
    socket.emit('ping', Date.now());

    // Set timeout for pong response
    const timer = setTimeout(() => {
      console.log(`No pong from ${socket.id}, disconnecting...`);
      forceLogout(socket);
    }, TIMEOUT);

    socketHeartbeats.set(socket.id, timer);
  };

  const forceLogout = (socketToKick) => {
    const timer = socketHeartbeats.get(socketToKick.id);
    if (timer) clearTimeout(timer);
    socketHeartbeats.delete(socketToKick.id);

    for (const [userId, socketId] of activeUsers.entries()) {
      if (socketId === socketToKick.id) {
        activeUsers.delete(userId);
        console.log(`Force-logged out user ${userId}`);
        break;
      }
    }

    socketToKick.disconnect(true);
  };

  socket.on("pong", (timestamp) => {
    const timer = socketHeartbeats.get(socket.id);
    if (timer) clearTimeout(timer);

    const latency = Date.now() - timestamp;
    console.log(`Pong from ${socket.id}, latency: ${latency}ms`);

    // Schedule next ping
    setTimeout(sendPing, TIMEOUT);
  });

  socket.on("login", (id) => {
    const userId = id.toLowerCase();
    currentUserId = userId;

    console.log(`User ${userId} attempting to log in`);

    // If user already has a socket, disconnect it
    const existingSocketId = activeUsers.get(userId);
    if (existingSocketId && existingSocketId !== socket.id) {
      console.log(`User ${userId} already logged in, disconnecting old socket: ${existingSocketId}`);
      const oldSocket = io.sockets.sockets.get(existingSocketId);
      if (oldSocket) forceLogout(oldSocket);
    }

    activeUsers.set(userId, socket.id);
    socket.join(userId);
    sendPing();

    console.log(`User ${userId} logged in with socket ${socket.id}`);
  });

  // Cleanup before socket leaves rooms
  socket.on("disconnecting", (reason) => {
    console.log(`Disconnecting socket ${socket.id} (reason: ${reason})`);
    const timer = socketHeartbeats.get(socket.id);
    if (timer) clearTimeout(timer);
    socketHeartbeats.delete(socket.id);

    if (currentUserId && activeUsers.get(currentUserId) === socket.id) {
      activeUsers.delete(currentUserId);
      console.log(`User ${currentUserId} removed from active users`);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`Socket ${socket.id} fully disconnected. Reason: ${reason}`);
  });
});
// Routes
require("./routes")(app);

const port = process.env.PORT || 5000; // Dynamic port for deployment
server.listen(port, () => console.log(`Server is running on port: ${port}`));