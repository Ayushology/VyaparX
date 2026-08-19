require("dotenv").config();

const { Redis } = require("ioredis");

class MemoryRedisClient {
  constructor() {
    this.store = new Map();
  }

  async set(key, value) {
    this.store.set(key, value);
    return "OK";
  }

  async get(key) {
    return this.store.get(key) ?? null;
  }

  async del(key) {
    return this.store.delete(key) ? 1 : 0;
  }

  async flushdb() {
    this.store.clear();
    return "OK";
  }

  on() {
    return this;
  }

  quit() {
    return Promise.resolve("OK");
  }
}

const isTestEnvironment =
  process.env.NODE_ENV === "test" || Boolean(process.env.JEST_WORKER_ID);

const redis = isTestEnvironment
  ? new MemoryRedisClient()
  : new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
    });

if (!isTestEnvironment) {
  redis.on("connect", () => {
    console.log("Connected to Redis");
  });
}

module.exports = redis;
