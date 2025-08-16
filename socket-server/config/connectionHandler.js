const { activeUsers, totalplayers, asiacount, africacount, uaecount, americacount, addtotalplayers } = require("./socketstates")
const { asiaserver } = require("../../socket-client/config/socketconfig")

exports.eventconnection = (io, socket) => {
    //  #region SOCKET MAIN EVENTS
    let currentUserId = null;

    socket.on("login", (data) => {
        const playerdata = JSON.parse(data)

        const userregion = playerdata.region

        currentUserId = playerdata.userid;
        
        const existing = activeUsers.get(currentUserId);

        if (existing && existing !== socket.id) {
            const oldSocket = io.sockets.sockets.get(existing);
            if (oldSocket) forceLogout(oldSocket);
        }

        activeUsers.set(currentUserId, socket.id);
        socket.join(currentUserId);
        // startHeartbeat();

        addtotalplayers(1);
        console.log("total players: ", totalplayers)
        io.emit("playercount", totalplayers)

        asiaserver.emit("receiveusers", JSON.stringify({
            username: currentUserId,
            region: userregion
        }))
        
        // socket.emit("selectedservercount", JSON.stringify({
        //     asia: asiacount,
        //     za: africacount,
        //     uae: uaecount,
        //     us: americacount,
        // }))

        console.log(`User ${currentUserId} logged in on ${socket.id}`);
    });

    //  #endregion
}