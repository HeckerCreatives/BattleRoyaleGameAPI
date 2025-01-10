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
  cors: corsConfig
});

io.use((socket, next) => {
  if (socket.handshake.query.token === "UNITY") {
      console.log("UNITY AUTHENTICATION")
      next();
  } else {
      next(new Error("Authentication error"));
  }
});


const activeUsers = new Map();
const HEARTBEAT_INTERVAL = 10000; // 5 seconds interval to send the ping
const TIMEOUT = 10000; // Timeout of 5 seconds for client to respond with pong

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // This will hold the timer reference for each socket
  let heartbeatTimer;

  // Function to send the ping to the client
  const sendPing = () => {
    console.log('Sending ping to:', socket.id);
    socket.emit('ping', Date.now()); // Send the ping message with timestamp

    // If no pong received within TIMEOUT ms, disconnect the player
    heartbeatTimer = setTimeout(() => {
        console.log('No pong received from', socket.id, '. Disconnecting...');
        socket.disconnect(); // Disconnect the player after timeout
    }, TIMEOUT);
  };

  socket.on('pong', (timestamp) => {
    clearTimeout(heartbeatTimer); // Clear the timeout if pong received
    const latency = Date.now() - timestamp;
    console.log('Pong received from', socket.id, '. Latency:', latency, 'ms');

    // Send another ping after the interval
    sendPing();
  });

  socket.on("login", (id) => {
    let userId = id.toLowerCase()

    console.log(`User ${userId} attempting to log in`);

    // Store the user in the active users map
    activeUsers.set(userId, socket.id);

    // Join the socket to a room named after the user ID
    socket.join(userId);

    sendPing();

    console.log(`User ${userId} added to active users with socket ID ${socket.id}`);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`user disconnecting ${socket.id}`)
    // Remove the user from active users if they disconnect
    for (const [userid, socketid] of activeUsers.entries()) {
        if (socketid === socket.id) {
            clearTimeout(heartbeatTimer);
            activeUsers.delete(userid);
            userlogout(userid);
            console.log(`User ${userid} removed from active users due to disconnection`);
            break;
        }
    }
  });
});

// Routes
require("./routes")(app);

const port = process.env.PORT || 5000; // Dynamic port for deployment
server.listen(port, () => console.log(`Server is running on port: ${port}`));