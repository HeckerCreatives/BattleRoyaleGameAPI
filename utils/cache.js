const store = new Map();

function get(key) {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
    }
    return entry.data;
}

function set(key, data, ttlMs) {
    store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

function delByPrefix(prefix) {
    for (const key of store.keys()) {
        if (key.startsWith(prefix)) store.delete(key);
    }
}

module.exports = { get, set, delByPrefix };
