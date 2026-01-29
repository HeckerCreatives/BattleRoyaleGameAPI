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
        console.log(`SENDING MATCH FOUND to ${data.socketid}. MATCH DATA: ${data.roomname}`)
        const playerSocket = socket.sockets.sockets.get(data.socketid)
        playerSocket.emit("matchfound", data.roomname)
    })
    asiaserver.on("waitingroomupdate", data => {
        console.log(`SENDING WAITING ROOM UPDATE. MATCH DATA: ${JSON.stringify(data)}`)

        data.playerSocket.forEach(tempdata => {
            console.log(`SENDING TO ${tempdata}. MATCH DATA: ${data}`)

            const playerSocket = socket.sockets.sockets.get(tempdata)

            if (playerSocket){
                playerSocket.emit("matchstatuschanged", {
                    roomName: data.roomName,
                    players: data.players,
                    maxPlayers: data.maxPlayers,
                    status: data.status,
                    countdown: data.countdown
                })
            }
        })
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
    asiaserver.on("reconnectexist", (data) => {
        console.log(`SENDING RECON TO PLAYERS. MATCH DATA: ${data.roomName}  ${data.status}  ${data.maxPlayers}`)

        data.playersocket.forEach(tempdata => {
            console.log(`SENDING TO ${tempdata}. MATCH DATA: ${data.roomName}  ${data.status}  ${data.maxPlayers}`)
            const playerSocket = socket.sockets.sockets.get(tempdata)

            if (playerSocket){
                playerSocket.emit("reconnectexist", {
                    roomName: data.roomName
                })
            }
        })
    })
    asiaserver.on("reconnectfail", (data) => {
        console.log(`SENDING NO RECON TO PLAYERS.`)

        const {socketid} = data;

        console.log(`SENDING TO ${socketid}.`)
        const playerSocket = socket.sockets.sockets.get(socketid)
        
        if (playerSocket){
            playerSocket.emit("reconnectfail")
        }
    })
    asiaserver.on("doneremovereconnect", (data) => {
        console.log(`SENDING DONE REMOVE RECON TO PLAYERS.`)

        const {socketid} = data;
        const playerSocket = socket.sockets.sockets.get(socketid)
        
        if (playerSocket){
            playerSocket.emit("doneremovereconnect")
        }
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
    uaeserver.on("reconnectexist", (data) => {
        console.log(`SENDING RECON TO PLAYERS. MATCH DATA: ${data.roomName}  ${data.status}  ${data.maxPlayers}`)

        data.playersocket.forEach(tempdata => {
            console.log(`SENDING TO ${tempdata}. MATCH DATA: ${data.roomName}  ${data.status}  ${data.maxPlayers}`)
            const playerSocket = socket.sockets.sockets.get(tempdata)

            if (playerSocket){
                playerSocket.emit("reconnectexist", {
                    roomName: data.roomName
                })
            }
        })
    })
    uaeserver.on("reconnectfail", (data) => {
        console.log(`SENDING NO RECON TO PLAYERS.`)

        const {socketid} = data;

        console.log(`SENDING TO ${socketid}.`)
        const playerSocket = socket.sockets.sockets.get(socketid)
        
        if (playerSocket){
            playerSocket.emit("reconnectfail")
        }
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
    americaserver.on("reconnectexist", (data) => {
        console.log(`SENDING RECON TO PLAYERS. MATCH DATA: ${data.roomName}  ${data.status}  ${data.maxPlayers}`)

        data.playersocket.forEach(tempdata => {
            console.log(`SENDING TO ${tempdata}. MATCH DATA: ${data.roomName}  ${data.status}  ${data.maxPlayers}`)
            const playerSocket = socket.sockets.sockets.get(tempdata)

            if (playerSocket){
                playerSocket.emit("reconnectexist", {
                    roomName: data.roomName
                })
            }
        })
    })
    americaserver.on("reconnectfail", (data) => {
        console.log(`SENDING NO RECON TO PLAYERS.`)

        const {socketid} = data;

        console.log(`SENDING TO ${socketid}.`)
        const playerSocket = socket.sockets.sockets.get(socketid)
        
        if (playerSocket){
            playerSocket.emit("reconnectfail")
        }
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
    africaserver.on("reconnectexist", (data) => {
        console.log(`SENDING RECON TO PLAYERS. MATCH DATA: ${data.roomName}  ${data.status}  ${data.maxPlayers}`)

        data.playersocket.forEach(tempdata => {
            console.log(`SENDING TO ${tempdata}. MATCH DATA: ${data.roomName}  ${data.status}  ${data.maxPlayers}`)
            const playerSocket = socket.sockets.sockets.get(tempdata)

            if (playerSocket){
                playerSocket.emit("reconnectexist", {
                    roomName: data.roomName
                })
            }
        })
    })
    africaserver.on("reconnectfail", (data) => {
        console.log(`SENDING NO RECON TO PLAYERS.`)

        const {socketid} = data;

        console.log(`SENDING TO ${socketid}.`)
        const playerSocket = socket.sockets.sockets.get(socketid)
        
        if (playerSocket){
            playerSocket.emit("reconnectfail")
        }
    })
}

module.exports = { asiaServer, uaeServer, amerciaServer, africaServer, asiaserver, uaeserver, americaserver, africaserver };