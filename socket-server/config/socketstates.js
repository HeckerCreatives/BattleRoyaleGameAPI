const activeUsers = new Map();          // userId -> socket.id
const socketHeartbeats = new Map();     // socket.id -> { interval, timeout, missedPings }
let totalplayers = 0
let asiacount = 0
let africacount = 0
let uaecount = 0
let americacount = 0

function addtotalplayers(value) {
  totalplayers += value
}

function setasiacount(value){
  asiacount = value
}

module.exports = {
  activeUsers,
  socketHeartbeats,
  totalplayers,
  asiacount,
  africacount,
  uaecount,
  americacount,
  addtotalplayers,
  setasiacount
};