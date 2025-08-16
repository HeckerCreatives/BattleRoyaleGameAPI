const { io } = require("socket.io-client");
const { activeUsers, socketHeartbeats, totalplayers, asiacount, africacount, uaecount, americacount, setasiacount } = require("../../socket-server/config/socketstates")

let asiaserver = io("http://localhost:5008/", {
    reconnection: true,
    transports: ['websocket'],
    query: {
        "token": "WEB"
    }
});

function asiaServer() {
    asiaserver.on("connect", () => {
        console.log("Main Server connected to asia server")
    });
    asiaserver.on("sendusercount", (data) => {
        console.log("received user count for asia", data)

        setasiacount(asiacount)

        socket.emit("selectedservercount", JSON.stringify({
            asia: asiacount,
            za: africacount,
            uae: uaecount,
            us: americacount,
        }))
    })
}

module.exports = { asiaServer, asiaserver };