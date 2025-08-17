const { io } = require("socket.io-client");
const { asiastate, uaestate, americastate, africastate } = require("../../socket-server/config/socketstates")


let asiaserver = io(process.env.ASIA_SERVER, {
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

        asiastate.asiacountsetter(data, socket)
    })
    asiaserver.on("matchfound", (data) => {
        const playerSocket = socket.sockets.sockets.get(data.socketid)
        playerSocket.emit("matchfound", data.roomname)
    })
    asiaserver.on("matchstatuschanged", (data) => {
        console.log(`SENDING STATUS CHANGED TO PLAYERS. MATCH DATA: ${data.roomName}  ${data.status}  ${data.maxPlayers}`)

        data.playersocket.forEach(tempdata => {
            console.log(`SENDING TO ${tempdata}. MATCH DATA: ${data.roomName}  ${data.status}  ${data.maxPlayers}`)
            const playerSocket = socket.sockets.sockets.get(tempdata)

            if (playerSocket){
                playerSocket.emit("matchstatuschanged", {
                    roomName: data.roomName,
                    status: data.status
                })
            }
        })
    })
}

let uaeserver = io(process.env.UAE_SERVER, {
    reconnection: true,
    transports: ['websocket'],
    query: {
        "token": "WEB"
    }
});

function uaeServer() {
    const socketConfig = require("../../socket-server/config/socketconfig");
    const socket = socketConfig.getIo(); // reuse the same io instance
    
    uaeserver.on("connect", () => {
        console.log("Main Server connected to uae server")
    });
    uaeserver.on("sendusercount", (data) => {
        console.log("received user count for uae", data)

        uaestate.uaecountsetter(data, socket)

    })
    uaeserver.on("matchfound", (data) => {
        const playerSocket = socket.sockets.sockets.get(data.socketid)
        playerSocket.emit("matchfound", data.roomname)
    })
    uaeserver.on("matchstatuschanged", (data) => {
        console.log(`SENDING STATUS CHANGED TO PLAYERS. MATCH DATA: ${data.roomName}  ${data.status}  ${data.maxPlayers}`)

        data.playersocket.forEach(tempdata => {
            console.log(`SENDING TO ${tempdata}. MATCH DATA: ${data.roomName}  ${data.status}  ${data.maxPlayers}`)
            const playerSocket = socket.sockets.sockets.get(tempdata)

            if (playerSocket){
                playerSocket.emit("matchstatuschanged", {
                    roomName: data.roomName,
                    status: data.status
                })
            }
        })
    })
}

let americaserver = io(process.env.AMERICA_SERVER, {
    reconnection: true,
    transports: ['websocket'],
    query: {
        "token": "WEB"
    }
});

function amerciaServer() {
    const socketConfig = require("../../socket-server/config/socketconfig");
    const socket = socketConfig.getIo(); // reuse the same io instance
    
    americaserver.on("connect", () => {
        console.log("Main Server connected to america server")
    });
    americaserver.on("sendusercount", (data) => {
        console.log("received user count for america", data)

        americastate.americacountsetter(data, socket)
    })
    americaserver.on("matchfound", (data) => {
        const playerSocket = socket.sockets.sockets.get(data.socketid)
        playerSocket.emit("matchfound", data.roomname)
    })
    americaserver.on("matchstatuschanged", (data) => {
        console.log(`SENDING STATUS CHANGED TO PLAYERS. MATCH DATA: ${data.roomName}  ${data.status}  ${data.maxPlayers}`)

        data.playersocket.forEach(tempdata => {
            console.log(`SENDING TO ${tempdata}. MATCH DATA: ${data.roomName}  ${data.status}  ${data.maxPlayers}`)
            const playerSocket = socket.sockets.sockets.get(tempdata)

            if (playerSocket){
                playerSocket.emit("matchstatuschanged", {
                    roomName: data.roomName,
                    status: data.status
                })
            }
        })
    })
}

let africaserver = io(process.env.AFRICA_SERVER, {
    reconnection: true,
    transports: ['websocket'],
    query: {
        "token": "WEB"
    }
});

function africaServer() {
    const socketConfig = require("../../socket-server/config/socketconfig");
    const socket = socketConfig.getIo(); // reuse the same io instance
    
    africaserver.on("connect", () => {
        console.log("Main Server connected to africa server")
    });
    africaserver.on("sendusercount", (data) => {
        console.log("received user count for africa", data)

        africastate.africacountsetter(data, socket)
    })
    africaserver.on("matchfound", (data) => {
        const playerSocket = socket.sockets.sockets.get(data.socketid)
        playerSocket.emit("matchfound", data.roomname)
    })
    africaserver.on("matchstatuschanged", (data) => {
        console.log(`SENDING STATUS CHANGED TO PLAYERS. MATCH DATA: ${data.roomName}  ${data.status}  ${data.maxPlayers}`)

        data.playersocket.forEach(tempdata => {
            console.log(`SENDING TO ${tempdata}. MATCH DATA: ${data.roomName}  ${data.status}  ${data.maxPlayers}`)
            const playerSocket = socket.sockets.sockets.get(tempdata)

            if (playerSocket){
                playerSocket.emit("matchstatuschanged", {
                    roomName: data.roomName,
                    status: data.status
                })
            }
        })
    })
}

module.exports = { asiaServer, uaeServer, amerciaServer, africaServer, asiaserver, uaeserver, americaserver, africaserver };