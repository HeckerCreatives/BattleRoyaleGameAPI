const { activeUsers, totalplayerstate, asiacount, africacount, uaecount, americacount, socketHeartbeats, HEARTBEAT_INTERVAL, TIMEOUT, MAX_MISSED_PINGS } = require("./socketstates")
const { asiaserver } = require("../../socket-client/config/socketconfig")

exports.eventconnection = (io, socket) => {
    //  #region SOCKET MAIN EVENTS
    let currentUserId = null;
    let userregion = null;


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
                console.log(`Force-logged out ${userId}`);
                break;
            }
        }

        sock.disconnect(true);
    };

    const removeregion = (removeplayer) => {
        if (userregion== "asia"){
            asiaserver.emit("removeusers", JSON.stringify({
                username: currentUserId,
                region: userregion
            }))
        }
        else if (userregion == "uae"){
            uaecount -= 1;
            console.log("uae count: ", uaecount)
            io.emit("uaecount", uaecount)
        }
        else if (userregion == "us"){
            americacount -= 1;
            console.log("us east count: ", americacount)
            io.emit("americaeastcount", americacount)
        }
        else if (userregion == "usw"){
            americacount -= 1;
            console.log("us west count: ", americawestcount)
            io.emit("americawestcount", americawestcount)
        }
        else if (userregion == "za"){
            africacount -= 1;
            console.log("africa count: ", africacount)
            io.emit("africacount", africacount)
        }

        if (removeplayer){
            totalplayerstate.removePlayer()
            io.emit("playercount", totalplayerstate.totalplayerscount)
        }
        
    }

    const addregion = (addplayer) => {
        if (userregion== "asia"){
            asiaserver.emit("receiveusers", JSON.stringify({
                username: currentUserId,
                region: userregion
            }))
        }
        else if (userregion == "uae"){
            uaecount -= 1;
            console.log("uae count: ", uaecount)
            io.emit("uaecount", uaecount)
        }
        else if (userregion == "us"){
            americacount -= 1;
            console.log("us east count: ", americacount)
            io.emit("americaeastcount", americacount)
        }
        else if (userregion == "usw"){
            americacount -= 1;
            console.log("us west count: ", americawestcount)
            io.emit("americawestcount", americawestcount)
        }
        else if (userregion == "za"){
            africacount -= 1;
            console.log("africa count: ", africacount)
            io.emit("africacount", africacount)
        }

        if (addplayer){
            totalplayerstate.addPlayer();
            console.log(`player added ${totalplayerstate.totalplayerscount}`)
            io.emit("playercount", totalplayerstate.totalplayerscount)
        }
        
    }

    const quitplayer = () => {
        if (userregion== "asia"){
            asiaserver.emit("playerquit", JSON.stringify({
                username: currentUserId,
                region: userregion
            }))
        }
        else if (userregion == "uae"){
            uaecount -= 1;
            console.log("uae count: ", uaecount)
            io.emit("uaecount", uaecount)
        }
        else if (userregion == "us"){
            americacount -= 1;
            console.log("us east count: ", americacount)
            io.emit("americaeastcount", americacount)
        }
        else if (userregion == "usw"){
            americacount -= 1;
            console.log("us west count: ", americawestcount)
            io.emit("americawestcount", americawestcount)
        }
        else if (userregion == "za"){
            africacount -= 1;
            console.log("africa count: ", africacount)
            io.emit("africacount", africacount)
        }

        totalplayerstate.addPlayer(1);
        io.emit("playercount", totalplayerstate.totalplayerscount)
        
    }

    socket.on("login", (data) => {
        const playerdata = JSON.parse(data)

        userregion = playerdata.region

        currentUserId = playerdata.userid;
        
        const existing = activeUsers.get(currentUserId);

        if (existing && existing !== socket.id) {
            const oldSocket = io.sockets.sockets.get(existing);
            if (oldSocket) forceLogout(oldSocket);
        }

        activeUsers.set(currentUserId, socket.id);
        socket.join(currentUserId);
        startHeartbeat();

        console.log("total players: ", totalplayerstate.totalplayerscount)
        addregion(true)
        
        // socket.emit("selectedservercount", JSON.stringify({
        //     asia: asiacount,
        //     za: africacount,
        //     uae: uaecount,
        //     us: americacount,
        // }))

        console.log(`User ${currentUserId} logged in on ${socket.id}`);
    });

    socket.on("pong", (timestamp) => {
        const hb = socketHeartbeats.get(socket.id);
        if (hb) {
            clearTimeout(hb.timeout);
            hb.missedPings = 0; // Reset on success
        }

        const latency = Date.now() - timestamp;
        console.log(`Pong from ${socket.id}, latency: ${latency}ms`);
    });

    socket.on("selectregion", () => {
        addregion(false)
    })

    socket.on("changeregion", (regiondata) => {
        const tempregion = JSON.parse(regiondata)

        if (userregion != tempregion.newregion){
            console.log(tempregion.oldregion != tempregion.newregion)
            removeregion(false)
            addregionwithoutplayercount(tempregion.newregion)
        }
    })

    socket.on("findmatch", async () => {
        if (userregion == "asia"){
            console.log(`find match by ${currentUserId}  region ${userregion}  socketid ${socket.id}`)
            asiaserver.emit("findmatchreceive", {
                username: currentUserId,
                region: userregion,
                socketid: socket.id
            })
        }
    })
    
    socket.on("disconnecting", (reason) => {
        console.log(`Disconnecting ${socket.id}, reason: ${reason}`);
        stopHeartbeat();
        removeregion(true)

        if (currentUserId && activeUsers.get(currentUserId) === socket.id) {
            quitplayer()
            activeUsers.delete(currentUserId);
        }
    });

    //  #endregion
}