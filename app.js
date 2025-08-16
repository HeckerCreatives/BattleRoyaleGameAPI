const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const http = require("http");
const cors = require("cors");
const socketIo = require("socket.io");
var en = require("nanoid-good/locale/en")
var customAlphabet = require("nanoid-good").customAlphabet(en);
require("dotenv").config();
const generatedname = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 12);
const { spawn, execSync } = require("child_process");
const AWS = require('aws-sdk');

const {gameserverinit} = require("./Initialize/init")

const fleetIdsByRegion = {
  'ap-southeast-1': 'fleet-92e24bef-c59d-4614-bed3-6d614ebebd8f'
};


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

//  #region SOCKET ROOM GENERATION

function generateRoomName() {
  return "room_" + generatedname();
}
let asiacount = 0
let uaecount = 0
let americacount = 0
let americawestcount = 0
let africacount = 0
let totalplayers = 0


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

let matches = []
const activeMatches = {};

io.on("connection", (socket) => {
  let currentUserId = null;
  let currentregion = null;

//  #region LOGIN AND LOGOUT

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
    for (const match of matches) {
      const index = match.players.indexOf(socket.id);
      if (index !== -1) match.players.splice(index, 1);
    }
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

//  #endregion

//  #region MATCHES

  // --- FIND MATCH ---
  socket.on("findmatch", async (data) => {
    const matchdata = JSON.parse(data);
    const selectedRegion = matchdata.region;

    console.log(`PLAYER SELECTED SERVER ${selectedRegion}`)

    socket.selectedRegion = selectedRegion;

    // Find match in the same region
    let match = matches.find(m =>
      (m.status === "WAITING" || m.status === "SETTINGUP") &&
      m.players.length < m.maxPlayers &&
      m.region === selectedRegion
    );

    if (!match) {
      const roomName = generateRoomName();

      console.log("IS GAME LIFT SERVER: ", process.env.GAMELIFT_SERVER)

      if (process.env.GAMELIFT_SERVER) {
        await launchGameLiftServer(roomName, selectedRegion);
      } else {
        launchGameServer(roomName);
      }

      match = {
        roomName,
        status: "SETTINGUP",
        players: [],
        maxPlayers: 50,
        region: selectedRegion
      };

      matches.push(match);
    }

    match.players.push(socket.id);

    if (match.status === "WAITING") {
      socket.emit("matchfound", match.roomName);
    }
  });

  // --- CHANGE MATCH STATE ---
  socket.on("changematchstate", async (data) => {
    const matchdata = JSON.parse(data);
    const matchname = matchdata.sessioname;
    const matchstatus = matchdata.status;

    const match = matches.find(m => m.roomName === matchname);

    if (!match) {
      console.warn(`No match found with roomName: ${matchname}`);
      return;
    }

    match.status = matchstatus;
    console.log(`Match "${matchname}" status changed to "${matchstatus}"`);

    if (matchstatus === "WAITING") {
      notifyplayersformatchstatus(match);
    }
  });

  
  const notifyplayersformatchstatus = (match) => {
    match.players.forEach(playerSocketId => {
        const playerSocket = io.sockets.sockets.get(playerSocketId);
        console.log(`have player ${playerSocket}`)
        if (playerSocket && playerSocket.selectedRegion === match.region) {
          playerSocket.emit("matchstatuschanged", {
            roomName: match.roomName,
            status: match.status
          });
        }
    });
  }

  // --- QUIT MATCH ---
  socket.on("quitonmatch", async () => {
    const match = matches.find(m => m.players.includes(socket.id));

    if (!match) return;

    match.players = match.players.filter(id => id !== socket.id);

    // Optional: delete match if empty
    if (match.players.length === 0) {
      console.log(`Match "${match.roomName}" is now empty, removing.`);
      matches = matches.filter(m => m.roomName !== match.roomName);

      if (activeMatches[match.roomName]) {
        // TODO: terminate GameLift session if needed
        delete activeMatches[match.roomName];
      }
    }
  });

//  #endregion

});

//  #region GAME LIFT SERVER INSTANCE

function getGameLiftClient(region) {
  return new AWS.GameLift({
    region: region,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  });
}

async function launchGameLiftServer(roomName, region) {
  const gamelift = getGameLiftClient(region);

  try {
    const createSessionRes = await gamelift.createGameSession({
      FleetId: fleetIdsByRegion[region], // map region to fleet
      MaximumPlayerSessionCount: 50,
      GameProperties: [
        { Key: 'roomname', Value: roomName },
        { Key: 'mapname', Value: 'PrototypeMultiplayer' },
      ]
    }).promise();

    const gameSession = createSessionRes.GameSession;
    console.log(`[${region}] Game session created: ${gameSession.GameSessionId}`);

    activeMatches[roomName] = {
      roomName,
      gameSessionId: gameSession.GameSessionId,
      region,
      createdAt: Date.now()
    };

  } catch (err) {
    console.error(`[${region}] Error creating game session:`, err);
  }
}

//  #endregion

//  #region DIGITALOCEAN DROPLET SERVER

function launchGameServer(roomName) {
  const logPath = `/ROF/logs/${roomName}.log`;

  const args = [
    "-a",
    "./Rof_Server.x86_64",
    "-batchmode",
    "-nographics",
    "-logfile", logPath,
    "-region", "asia",
    "-server", "yes",
    "-mapname", "PrototypeMultiplayer",
    "-roomname", roomName
  ];

  const child = spawn("xvfb-run", args, {
    cwd: "/ROF",
    detached: true,
    stdio: "ignore"
  });

  child.unref(); // <-- Call this separately
  
  activeMatches[roomName] = {
    pid: child.pid,
    roomName,
    logPath,
    launchedAt: Date.now()
  };

  console.log(`Launched Fusion server with room: ${roomName}`);

  // 🧼 Cleanup on exit
  child.on("exit", (code, signal) => {
    console.log(`Server for room "${roomName}" exited (code: ${code}, signal: ${signal})`);
    delete activeMatches[roomName];
    const index = matches.findIndex(m => m.roomName === roomName);
    if (index !== -1) matches.splice(index, 1);
  });

  // Optional: listen for errors
  child.on("error", (err) => {
    console.error(`Error launching server for room "${roomName}":`, err);
    delete activeMatches[roomName];
    const index = matches.findIndex(m => m.roomName === roomName);
    if (index !== -1) matches.splice(index, 1);
  });
}

//  #endregion



//  #endregion

// Routes
require("./routes")(app);


const port = process.env.PORT || 5007; // Dynamic port for deployment
server.listen(port, () => console.log(`Server is running on port: ${port}`));