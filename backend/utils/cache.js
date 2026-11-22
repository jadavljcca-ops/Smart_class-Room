// Fast in-memory caching layer for instant responses across Admin, Faculty, and Student panels
const memoryCache = new Map();

const getCache = (key) => {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    memoryCache.delete(key);
    return null;
  }
  return item.data;
};

const setCache = (key, data, ttlMs = 20000) => {
  memoryCache.set(key, {
    data,
    expiry: Date.now() + ttlMs
  });
};

const invalidateCache = (prefix = '') => {
  if (!prefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.includes(prefix)) {
      memoryCache.delete(key);
    }
  }
};

module.exports = {
  getCache,
  setCache,
  invalidateCache
};
