const { io } = require("socket.io-client");
const { activeUsers, socketHeartbeats, totalplayerstate, asiastate, africacount, uaecount, americacount } = require("../../socket-server/config/socketstates")


let asiaserver = io("http://localhost:5008/", {
    reconnection: true,
    transports: ['websocket'],
    query: {
        "token": "WEB"
    }
});

function asiaServer() {
    const socketConfig = require("../../socket-server/config/socketconfig");
    const socket = socketConfig.getIo(); // reuse the same io instance
    
    asiaserver.on("connect", () => {
        console.log("Main Server connected to asia server")
    });
    asiaserver.on("sendusercount", (data) => {
        console.log("received user count for asia", data)

        asiastate.asiacountsetter(data)

        socket.emit("selectedservercount", JSON.stringify({
            asia: asiastate.totalasiacount,
            za: africacount,
            uae: uaecount,
            us: americacount,
        }))
    })
}

module.exports = { asiaServer, asiaserver };