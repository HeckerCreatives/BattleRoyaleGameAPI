const activeUsers = new Map();          // userId -> socket.id
const socketHeartbeats = new Map();     // socket.id -> { interval, timeout, missedPings }

const HEARTBEAT_INTERVAL = 5000; // Send ping every 10 seconds
const TIMEOUT = 10000;            // Wait 10 seconds for pong
const MAX_MISSED_PINGS = 3;

const asiastate = {
  asiacount: 0,
  get totalasiacount() { return this.asiacount},
  asiacountsetter(value){
    this.asiacount = value;
  }
}

const uaestate = {
  uaecount: 0,
  get totaluaecount() { return this.uaecount},
  uaecountsetter(value){
    this.uaecount = value
  }
}

const americastate = {
  americacount: 0,
  get totalamericacount() { return this.americacount },
  americacountsetter(value){
    this.americacount = value
  }
}

const africastate = {
  africacount: 0,
  get totalafricacount() { return this.africacount },
  africacountsetter(value){
    this.africacount = value
  }
}

const totalplayerstate = {
  totalplayers: 0,
  get totalplayerscount() { return this.totalplayers},
  addPlayer(){
    this.totalplayers += 1;
  },
  removePlayer(){
    this.totalplayers -= 1;

    if (this.totalplayers <= 0){
      this.totalplayers = 0
    }
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