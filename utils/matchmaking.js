const crypto = require("crypto");

// Keyed by: `${socketId}:${eventName}`
const latestPending = new Map();
// value = { messageId, eventName, payload, tries, timer }

function makeId() {
  return crypto.randomBytes(12).toString("hex");
}

function stopPending(key) {
  const cur = latestPending.get(key);
  if (!cur) return;
  if (cur.timer) clearTimeout(cur.timer);
  latestPending.delete(key);
}

/**
 * Latest-only reliable emit:
 * - Only keeps 1 pending message per (socket,event)
 * - If a new update comes in, it replaces the old one immediately
 * - Retries until client ACKs messageId (or maxRetries)
 */
function reliableEmitLatest(playerSocket, eventName, payload, opts = {}) {
  const retryMs = opts.retryMs ?? 800;
  const maxRetries = opts.maxRetries ?? 12;

  if (!playerSocket || !playerSocket.connected) return null;

  const key = `${playerSocket.id}:${eventName}`;

  // Replace any previous pending message for this socket+event
  stopPending(key);

  const messageId = makeId();
  const state = {
    messageId,
    eventName,
    payload,
    tries: 0,
    timer: null,
  };

  latestPending.set(key, state);

  const send = () => {
    const cur = latestPending.get(key);

    // If replaced/cleared, stop
    if (!cur || cur.messageId !== messageId) return;

    // socket might have disconnected
    if (!playerSocket.connected) {
      stopPending(key);
      return;
    }

    cur.tries += 1;

    playerSocket.emit(eventName, {
      ...cur.payload,
      messageId: cur.messageId,
      attempt: cur.tries,
    });

    if (cur.tries >= maxRetries) {
      // give up (optional: log)
      stopPending(key);
      return;
    }

    cur.timer = setTimeout(send, retryMs);
  };

  // send immediately
  send();
  return messageId;
}

module.exports = {
    latestPending,
    makeId,
    stopPending,
    reliableEmitLatest
}