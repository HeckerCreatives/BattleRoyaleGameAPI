const activeUsers = new Map();          // userId -> socket.id
const socketHeartbeats = new Map();     // socket.id -> { interval, timeout, missedPings }

const HEARTBEAT_INTERVAL = 5000; // Send ping every 10 seconds
const TIMEOUT = 10000;            // Wait 10 seconds for pong
const MAX_MISSED_PINGS = 3;

const asiastate = {
  asiacount: 0,
  get totalasiacount() { return this.asiacount},
  asiacountsetter(value, socket){
    this.asiacount = value;
    socket.emit("asiacount", this.totalasiacount)
  }
}

const uaestate = {
  uaecount: 0,
  get totaluaecount() { return this.uaecount},
  uaecountsetter(value, socket){
    this.uaecount = value
    socket.emit("uaecount", this.totaluaecount)
  }
}

const americastate = {
  americacount: 0,
  get totalamericacount() { return this.americacount },
  americacountsetter(value, socket){
    this.americacount = value
    socket.emit("americacount", this.totalamericacount)
  }
}

const africastate = {
  africacount: 0,
  get totalafricacount() { return this.africacount },
  africacountsetter(value, socket){
    this.africacount = value
    socket.emit("africacount", this.totalafricacount)
  }
}

const totalplayerstate = {
  totalplayers: 0,
  get totalplayerscount() { return this.totalplayers},
  addPlayer(io){
    this.totalplayers += 1;
    io.emit("playercount", this.totalplayerscount)
  },
  removePlayer(io){
    this.totalplayers -= 1;

    if (this.totalplayers <= 0){
      this.totalplayers = 0
    }

    io.emit("playercount", this.totalplayers)
  }
}

module.exports = {
  activeUsers,
  socketHeartbeats,
  asiastate,
  uaestate,
  americastate,
  africastate,
  totalplayerstate,
  HEARTBEAT_INTERVAL,
  TIMEOUT,
  MAX_MISSED_PINGS,
};