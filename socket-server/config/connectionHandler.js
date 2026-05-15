const { activeUsers, totalplayerstate, socketHeartbeats, HEARTBEAT_INTERVAL, TIMEOUT, MAX_MISSED_PINGS, asiastate, uaestate, americastate, africastate } = require("./socketstates")
const { asiaserver, uaeserver, americaserver, africaserver } = require("../../socket-client/config/socketconfig")
const {latestPending, stopPending, reliableEmitLatest} = require("../../utils/matchmaking")


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

            // Re-arm a single timeout. Without this clear, since HEARTBEAT_INTERVAL
            // (5s) < TIMEOUT (10s), every ping leaked a new timer while old ones
            // kept firing — inflating missedPings and force-disconnecting players
            // on brief latency spikes.
            clearTimeout(heartbeatData.timeout);
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
            uaeserver.emit("removeusers", JSON.stringify({
                username: currentUserId,
                region: userregion
            }))
        }
        else if (userregion == "us"){
            americaserver.emit("removeusers", JSON.stringify({
                username: currentUserId,
                region: userregion
            }))
        }
        else if (userregion == "tr"){ //    TURKEY BUT THIS IS AFRICA
            africaserver.emit("removeusers", JSON.stringify({
                username: currentUserId,
                region: userregion
            }))
        }

        if (removeplayer){
            totalplayerstate.removePlayer(io)
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
            uaeserver.emit("receiveusers", JSON.stringify({
                username: currentUserId,
                region: userregion
            }))
        }
        else if (userregion == "us"){
            americaserver.emit("receiveusers", JSON.stringify({
                username: currentUserId,
                region: userregion
            }))
        }
        else if (userregion == "tr"){ //    TURKEY BUT THIS IS AFRICA
            africaserver.emit("receiveusers", JSON.stringify({
                username: currentUserId,
                region: userregion
            }))
        }

        if (addplayer){
            totalplayerstate.addPlayer(io);
            console.log(`player added ${totalplayerstate.totalplayerscount}`)
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
            uaeserver.emit("playerquit", JSON.stringify({
                username: currentUserId,
                region: userregion
            }))
        }
        else if (userregion == "us"){
            americaserver.emit("playerquit", JSON.stringify({
                username: currentUserId,
                region: userregion
            }))
        }
        else if (userregion == "tr"){ //    TURKEY BUT THIS IS AFRICA
            africaserver.emit("playerquit", JSON.stringify({
                username: currentUserId,
                region: userregion
            }))
        }

        totalplayerstate.removePlayer(io);
        
    }

    const changeregion = (region) => {
        if (userregion== "asia"){
            asiaserver.emit("removeusers", JSON.stringify({
                username: currentUserId,
                region: userregion
            }))
        }
        else if (userregion == "uae"){
            uaeserver.emit("removeusers", JSON.stringify({
                username: currentUserId,
                region: userregion
            }))
        }
        else if (userregion == "us"){
            americaserver.emit("removeusers", JSON.stringify({
                username: currentUserId,
                region: userregion
            }))
        }
        else if (userregion == "tr"){ //    TURKEY BUT THIS IS AFRICA
            africaserver.emit("removeusers", JSON.stringify({
                username: currentUserId,
                region: userregion
            }))
        }

        userregion = region

        if (userregion== "asia"){
            asiaserver.emit("receiveusers", JSON.stringify({
                username: currentUserId,
                region: userregion
            }))
        }
        else if (userregion == "uae"){
            uaeserver.emit("receiveusers", JSON.stringify({
                username: currentUserId,
                region: userregion
            }))
        }
        else if (userregion == "us"){
            americaserver.emit("receiveusers", JSON.stringify({
                username: currentUserId,
                region: userregion
            }))
        }
        else if (userregion == "tr"){ //    TURKEY BUT THIS IS AFRICA
            africaserver.emit("receiveusers", JSON.stringify({
                username: currentUserId,
                region: userregion
            }))
        }
    }

    socket.on("needtoreconnect", () => {
        console.log(`need to reconnect ${currentUserId}   ${socket.id}`)
        if (userregion== "asia"){
            asiaserver.emit("needtoreconnect", {
                username: currentUserId,
                socketid: socket.id
            })
        }
        else if (userregion == "uae"){
            uaeserver.emit("needtoreconnect", {
                username: currentUserId,
                socketid: socket.id
            })
        }
        else if (userregion == "us"){
            americaserver.emit("needtoreconnect", {
                username: currentUserId,
                socketid: socket.id
            })
        }
        else if (userregion == "tr"){ //    TURKEY BUT THIS IS AFRICA
            africaserver.emit("needtoreconnect", {
                username: currentUserId,
                socketid: socket.id
            })
        }
    })

    socket.on("removereconnect", () => {
        console.log(`remove reconnect ${currentUserId}   ${socket.id}   ${userregion}`)
        if (userregion== "asia"){
            asiaserver.emit("removereconnect", {
                username: currentUserId,
                socketid: socket.id
            })
        }
        else if (userregion == "uae"){
            uaeserver.emit("removereconnect", {
                username: currentUserId,
                socketid: socket.id
            })
        }
        else if (userregion == "us"){
            americaserver.emit("removereconnect", {
                username: currentUserId,
                socketid: socket.id
            })
        }
        else if (userregion == "tr"){ //    TURKEY BUT THIS IS AFRICA
            africaserver.emit("removereconnect", {
                username: currentUserId,
                socketid: socket.id
            })
        }
    })

    socket.on("login", (data, callback) => {
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

        reliableEmitLatest(socket, "selectedservercount", {
            total: totalplayerstate.totalplayerscount,
            asia: asiastate.totalasiacount,
            za: africastate.totalafricacount,
            uae: uaestate.totaluaecount,
            us: americastate.totalamericacount
        }, { retryMs: 1000, maxRetries: 6 })

        if (typeof callback === 'function') callback({ ok: true });

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

        // Safety net: client emits selectregion when confirming a server on
        // the way to the lobby. Push a fresh authoritative snapshot so any
        // count delta missed on the selection screen is corrected before the
        // player moves on. (The selection screen itself self-corrects via the
        // reliable selectedservercount sent on login/reconnect.)
        reliableEmitLatest(socket, "selectedservercount", {
            total: totalplayerstate.totalplayerscount,
            asia: asiastate.totalasiacount,
            za: africastate.totalafricacount,
            uae: uaestate.totaluaecount,
            us: americastate.totalamericacount
        }, { retryMs: 1000, maxRetries: 6 })
    })

    // Client-pull refresh (e.g. a Refresh button on server selection). Costs
    // nothing until pressed; answers with the same authoritative reliable
    // snapshot. latest-wins per socket+event means button-spam just replaces
    // the pending entry instead of stacking work.
    socket.on("refreshservercount", () => {
        reliableEmitLatest(socket, "selectedservercount", {
            total: totalplayerstate.totalplayerscount,
            asia: asiastate.totalasiacount,
            za: africastate.totalafricacount,
            uae: uaestate.totaluaecount,
            us: americastate.totalamericacount
        }, { retryMs: 1000, maxRetries: 6 })
    })

    socket.on("changeregion", (regiondata) => {

        const tempregion = JSON.parse(regiondata)

        if (userregion != tempregion.newregion){
            changeregion(tempregion.newregion)
        }
    })

    socket.on("findmatch", async (userdata, callback) => {
        console.log(`find match by ${currentUserId}  region ${userregion}  socketid ${socket.id}  userdata ${userdata}`)

        const tempuserdata = JSON.parse(userdata)

        if (userregion == "asia"){
            asiaserver.emit("findmatchreceive", {
                username: currentUserId,
                region: userregion,
                socketid: socket.id,
                avatarid: tempuserdata.avatarid
            })
        }
        else if (userregion == "uae"){
            uaeserver.emit("findmatchreceive", {
                username: currentUserId,
                region: userregion,
                socketid: socket.id,
                avatarid: tempuserdata.avatarid
            })
        }
        else if (userregion == "us"){
            americaserver.emit("findmatchreceive", {
                username: currentUserId,
                region: userregion,
                socketid: socket.id,
                avatarid: tempuserdata.avatarid
            })
        }
        else if (userregion == "tr"){ //    TURKEY BUT THIS IS AFRICA
            africaserver.emit("findmatchreceive", {
                username: currentUserId,
                region: userregion,
                socketid: socket.id,
                avatarid: tempuserdata.avatarid
            })
        }

        if (typeof callback === 'function') callback({ ok: true });
    })

    socket.on("quitonmatch", data => {
        console.log(`quit match by ${currentUserId}  region: ${userregion}  socketid: ${socket.id}    roomname: ${
        data.roomname}`)
        if (userregion == "asia"){
            asiaserver.emit("quitonmatch", {
                username: currentUserId,
                region: userregion,
                socketid: socket.id,
                roomname: data.roomname
            })
        }
        else if (userregion == "uae"){
            uaeserver.emit("quitonmatch", {
                username: currentUserId,
                region: userregion,
                socketid: socket.id,
                roomname: data.roomname
            })
        }
        else if (userregion == "us"){
            americaserver.emit("quitonmatch", {
                username: currentUserId,
                region: userregion,
                socketid: socket.id,
                roomname: data.roomname
            })
        }
        else if (userregion == "tr"){ //    TURKEY BUT THIS IS AFRICA
            africaserver.emit("quitonmatch", {
                username: currentUserId,
                region: userregion,
                socketid: socket.id,
                roomname: data.roomname
            })
        }

        // Player left the room — stop any in-flight reliable retries for this
        // socket. Otherwise matchstatuschanged/enteringmatch/waitingroomupdate
        // that were pending an ACK keep firing at them for up to maxRetries,
        // re-triggering lobby UI after they already cancelled.
        for (const key of latestPending.keys()) {
            if (key.startsWith(`${socket.id}:`)) {
                stopPending(key);
            }
        }
    })

    socket.on("cancelfindmatch", () => {
        console.log(`cancel find match by ${currentUserId}  region: ${userregion}  socketid: ${socket.id}`)
        if (userregion == "asia"){
            asiaserver.emit("cancelfindmatch", {
                username: currentUserId,
                region: userregion,
                socketid: socket.id
            })
        }
        else if (userregion == "uae"){
            uaeserver.emit("cancelfindmatch", {
                username: currentUserId,
                region: userregion,
                socketid: socket.id
            })
        }
        else if (userregion == "us"){
            americaserver.emit("cancelfindmatch", {
                username: currentUserId,
                region: userregion,
                socketid: socket.id
            })
        }
        else if (userregion == "tr"){ //    TURKEY BUT THIS IS AFRICA
            africaserver.emit("cancelfindmatch", {
                username: currentUserId,
                region: userregion,
                socketid: socket.id
            })
        }

        // Same rationale as quitonmatch: kill in-flight reliable retries so a
        // just-queued enteringmatch/matchstatuschanged can't reach a player who
        // already cancelled finding a match.
        for (const key of latestPending.keys()) {
            if (key.startsWith(`${socket.id}:`)) {
                stopPending(key);
            }
        }
    })

    socket.on("ack", (data) => {
        const messageId = data?.messageId;
        const eventName = data?.eventName;

        if (!messageId || !eventName) return;

        const key = `${socket.id}:${eventName}`;
        const cur = latestPending.get(key);

        // Only clear if ACK matches the latest messageId
        if (cur && cur.messageId === messageId) {
            stopPending(key);
        }
    });
    
    socket.on("disconnecting", (reason) => {
        console.log(`Disconnecting ${socket.id}, reason: ${reason}`);
        stopHeartbeat();
        removeregion(true)

        if (currentUserId && activeUsers.get(currentUserId) === socket.id) {
            // quitplayer()
            activeUsers.delete(currentUserId);
            for (const key of latestPending.keys()) {
                if (key.startsWith(`${socket.id}:`)) {
                    stopPending(key);
                }
            }
        }
    });

    //  #endregion
}