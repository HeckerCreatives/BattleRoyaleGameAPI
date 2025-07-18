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

let asiacount = 0
let uaecount = 0
let americacount = 0
let americawestcount = 0
let africacount = 0
let totalplayers = 0

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
    
    next();
  } else {
    next(new Error("Authentication error"));
  }
});

const HEARTBEAT_INTERVAL = 5000; // Send ping every 10 seconds
const TIMEOUT = 10000;            // Wait 10 seconds for pong
const MAX_MISSED_PINGS = 3;

const activeUsers = new Map();          // userId -> socket.id
const socketHeartbeats = new Map();     // socket.id -> { interval, timeout, missedPings }

io.on("connection", (socket) => {
  let currentUserId = null;
  let currentregion = null;

  const startHeartbeat = () => {
    const heartbeatData = {
      missedPings: 0,
      interval: null,
      timeout: null,
    };

    const sendPing = () => {
      if (!socket.connected) return;

      console.log(`Sending ping to ${socket.id}`);
      socket.emit("ping", Date.now());

      heartbeatData.timeout = setTimeout(() => {
        heartbeatData.missedPings++;
        console.warn(`Missed pong from ${socket.id} (${heartbeatData.missedPings}/${MAX_MISSED_PINGS})`);

        if (heartbeatData.missedPings >= MAX_MISSED_PINGS) {
          console.log(`Too many missed pings. Disconnecting ${socket.id}`);
          forceLogout(socket);
        }
      }, TIMEOUT);
    };

    // Start ping loop
    sendPing();
    heartbeatData.interval = setInterval(sendPing, HEARTBEAT_INTERVAL);

    socketHeartbeats.set(socket.id, heartbeatData);
  };

  const stopHeartbeat = () => {
    const hb = socketHeartbeats.get(socket.id);
    if (!hb) return;
    clearInterval(hb.interval);
    clearTimeout(hb.timeout);
    socketHeartbeats.delete(socket.id);
  };

  const forceLogout = (sock) => {
    stopHeartbeat();

    for (const [userId, sockId] of activeUsers.entries()) {
      if (sockId === sock.id) {
        activeUsers.delete(userId);
        userlogout(userId);

        if (sock.data.region == "asia"){
          asiacount -= 1;
        }
        else if (sock.data.region == "uae"){
          uaecount -= 1;
        }
        else if (sock.data.region == "america"){
          americacount -= 1;
        }
        else if (sock.data.region == "africa"){
          africacount -= 1;
        }

        console.log(`Force-logged out ${userId}`);
        break;
      }
    }

    sock.disconnect(true);
  };

  socket.on("pong", (timestamp) => {
    const hb = socketHeartbeats.get(socket.id);
    if (hb) {
      clearTimeout(hb.timeout);
      hb.missedPings = 0; // Reset on success
    }

    const latency = Date.now() - timestamp;
    console.log(`Pong from ${socket.id}, latency: ${latency}ms`);
  });

  socket.on("login", (id) => {

    currentUserId = id.toLowerCase();
    const existing = activeUsers.get(currentUserId);

    if (existing && existing !== socket.id) {
      const oldSocket = io.sockets.sockets.get(existing);
      if (oldSocket) forceLogout(oldSocket);
    }

    activeUsers.set(currentUserId, socket.id);
    socket.join(currentUserId);
    startHeartbeat();

    totalplayers += 1;
    console.log("total players: ", totalplayers)
    io.emit("playercount", totalplayers)
    socket.emit("selectedservercount", JSON.stringify({
      asia: asiacount,
      za: africacount,
      uae: uaecount,
      us: americacount,
      usw: americawestcount
    }))

    console.log(`User ${currentUserId} logged in on ${socket.id}`);
  });

  socket.on("selectregion", (region) => {
    currentregion = region.toLowerCase();
    addregion(currentregion)
  })

  socket.on("changeregion", (regiondata) => {
    const tempregion = JSON.parse(regiondata)

    console.log(tempregion)

    if (tempregion.oldregion != tempregion.newregion){
    console.log(tempregion.oldregion != tempregion.newregion)
      removeregionwithoutplayercount(tempregion.oldregion)
      addregionwithoutplayercount(tempregion.newregion)
    }
  })

  socket.on("disconnecting", (reason) => {
    console.log(`Disconnecting ${socket.id}, reason: ${reason}`);
    stopHeartbeat();
    removeregion(currentregion)

    if (currentUserId && activeUsers.get(currentUserId) === socket.id) {
      activeUsers.delete(currentUserId);
      userlogout(currentUserId);
    }
  });

  const addregion = (region) => {
    if (region== "asia"){
      asiacount += 1;
      console.log("asia count: ", asiacount)
      io.emit("asiacount", asiacount)
    }
    else if (region == "uae"){
      uaecount += 1;
      console.log("uae count: ", uaecount)
      io.emit("uaecount", uaecount)
    }
    else if (region == "us"){
      americacount += 1;
      console.log("us east count: ", americacount)
      io.emit("americaeastcount", americacount)
    }
    else if (region == "usw"){
      americacount += 1;
      console.log("us west count: ", americawestcount)
      io.emit("americawestcount", americawestcount)
    }
    else if (region == "za"){
      africacount += 1;
      console.log("africa count: ", africacount)
      io.emit("africacount", africacount)
    }

    io.emit("playercount", totalplayers)
  }

  const addregionwithoutplayercount = (region) => {
    if (region== "asia"){
      asiacount += 1;
      console.log("asia count: ", asiacount)
      io.emit("asiacount", asiacount)
    }
    else if (region == "uae"){
      uaecount += 1;
      console.log("uae count: ", uaecount)
      io.emit("uaecount", uaecount)
    }
    else if (region == "us"){
      americacount += 1;
      console.log("us east count: ", americacount)
      io.emit("americaeastcount", americacount)
    }
    else if (region == "usw"){
      americacount += 1;
      console.log("us west count: ", americawestcount)
      io.emit("americawestcount", americawestcount)
    }
    else if (region == "za"){
      africacount += 1;
      console.log("africa count: ", africacount)
      io.emit("africacount", africacount)
    }
  }

  socket.on("disconnect", (reason) => {
    console.log(`Socket ${socket.id} disconnected. Reason: ${reason}`);
  });

  const removeregion = (region) => {
    if (region== "asia"){
      asiacount -= 1;
      console.log("asia count: ", asiacount)
      io.emit("asiacount", asiacount)
    }
    else if (region == "uae"){
      uaecount -= 1;
      console.log("uae count: ", uaecount)
      io.emit("uaecount", uaecount)
    }
    else if (region == "us"){
      americacount -= 1;
      console.log("us east count: ", americacount)
      io.emit("americaeastcount", americacount)
    }
    else if (region == "usw"){
      americacount -= 1;
      console.log("us west count: ", americawestcount)
      io.emit("americawestcount", americawestcount)
    }
    else if (region == "za"){
      africacount -= 1;
      console.log("africa count: ", africacount)
      io.emit("africacount", africacount)
    }

    totalplayers -= 1

    if (totalplayers <= 0){
      totalplayers = 0;
    }
    io.emit("playercount", totalplayers)
  }

  const removeregionwithoutplayercount = (region) => {
    if (region== "asia"){
      asiacount -= 1;
      console.log("asia count: ", asiacount)
      io.emit("asiacount", asiacount)
    }
    else if (region == "uae"){
      uaecount -= 1;
      console.log("uae count: ", uaecount)
      io.emit("uaecount", uaecount)
    }
    else if (region == "us"){
      americacount -= 1;
      console.log("us east count: ", americacount)
      io.emit("americaeastcount", americacount)
    }
    else if (region == "usw"){
      americacount -= 1;
      console.log("us west count: ", americawestcount)
      io.emit("americawestcount", americawestcount)
    }
    else if (region == "za"){
      africacount -= 1;
      console.log("africa count: ", africacount)
      io.emit("africacount", africacount)
    }
  }
});

// Routes
require("./routes")(app);


const port = process.env.PORT || 5007; // Dynamic port for deployment
server.listen(port, () => console.log(`Server is running on port: ${port}`));