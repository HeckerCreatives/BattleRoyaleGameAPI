// Ambient presence counters. Live updates are intentionally BEST-EFFORT: a
// throttled plain io.emit per event. socket.io fans out one serialized payload
// across connections with NO per-socket retry timer or pending-map entry, so
// the cost is a bounded O(sockets) network write once per window and never
// grows unbounded with concurrency (the old per-socket reliable broadcast was
// up to maxRetries × sockets live timers — that was the cliff).
//
// Correctness where it actually matters is guaranteed separately, NOT here:
// a reliable per-socket authoritative snapshot (incl. the global total) is
// sent on login / reconnect / selectregion in connectionHandler.js. So a
// dropped delta only means an ambient HUD number is briefly stale until the
// next change or the next snapshot — never a wrong number on screen entry.
const BROADCAST_THROTTLE_MS = 1000;

// eventName -> { io, payloadFn, timer }. One armed flush per event; repeated
// changes within the window just refresh the payload (latest wins) instead of
// arming more timers, so continuous churn can't starve or stack flushes.
const _pendingBroadcast = new Map();

function scheduleCountBroadcast(io, eventName, payloadFn) {
  const existing = _pendingBroadcast.get(eventName);
  if (existing) {
    existing.io = io;
    existing.payloadFn = payloadFn;
    return;
  }
  const entry = { io, payloadFn, timer: null };
  entry.timer = setTimeout(() => {
    _pendingBroadcast.delete(eventName);
    if (entry.io) entry.io.emit(eventName, entry.payloadFn());
  }, BROADCAST_THROTTLE_MS);
  _pendingBroadcast.set(eventName, entry);
}

const activeUsers = new Map();          // userId -> socket.id
const socketHeartbeats = new Map();     // socket.id -> { interval, timeout, missedPings }

const HEARTBEAT_INTERVAL = 5000; // Send ping every 10 seconds
const TIMEOUT = 10000;            // Wait 10 seconds for pong
const MAX_MISSED_PINGS = 3;

const asiastate = {
  asiacount: 0,
  get totalasiacount() { return this.asiacount},
  asiacountsetter(value, io){
    this.asiacount = value;
    scheduleCountBroadcast(io, "asiacount", () => ({ count: this.totalasiacount }))
  }
}

const uaestate = {
  uaecount: 0,
  get totaluaecount() { return this.uaecount},
  uaecountsetter(value, io){
    this.uaecount = value
    scheduleCountBroadcast(io, "uaecount", () => ({ count: this.totaluaecount }))
  }
}

const americastate = {
  americacount: 0,
  get totalamericacount() { return this.americacount },
  americacountsetter(value, io){
    this.americacount = value
    scheduleCountBroadcast(io, "americacount", () => ({ count: this.totalamericacount }))
  }
}

const africastate = {
  africacount: 0,
  get totalafricacount() { return this.africacount },
  africacountsetter(value, io){
    this.africacount = value
    scheduleCountBroadcast(io, "africacount", () => ({ count: this.totalafricacount }))
  }
}

const totalplayerstate = {
  totalplayers: 0,
  get totalplayerscount() { return this.totalplayers},
  addPlayer(io){
    this.totalplayers += 1;
    scheduleCountBroadcast(io, "playercount", () => ({ count: this.totalplayerscount }))
  },
  removePlayer(io){
    this.totalplayers -= 1;

    if (this.totalplayers <= 0){
      this.totalplayers = 0
    }

    scheduleCountBroadcast(io, "playercount", () => ({ count: this.totalplayerscount }))
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