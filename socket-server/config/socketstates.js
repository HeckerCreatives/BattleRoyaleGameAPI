const activeUsers = new Map();          // userId -> socket.id
const socketHeartbeats = new Map();     // socket.id -> { interval, timeout, missedPings }

let africacount = 0
let uaecount = 0
let americacount = 0
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

const totalplayerstate = {
  totalplayers: 0,
  get totalplayerscount() { return this.totalplayers},
  addPlayer(){
    this.totalplayers += 1;
  },
  removePlayer(){
    this.totalplayers -= 1;
  }
}

function setasiacount(value){
  asiacount = value
}

module.exports = {
  activeUsers,
  socketHeartbeats,
  africacount,
  uaecount,
  americacount,
  HEARTBEAT_INTERVAL,
  TIMEOUT,
  MAX_MISSED_PINGS,
  asiastate,
  totalplayerstate,
  setasiacount,
};