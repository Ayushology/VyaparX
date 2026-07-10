require("dotenv").config();

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongod;

beforeAll(async () => {
  process.env.NODE_ENV = process.env.NODE_ENV || "test";
  process.env.JWT_SECRET = "test-secret";

  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();

  await require("../src/db/db")();
});

afterEach(async () => {
  const collections = await mongoose.connection.db.collections();

  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();

  if (mongod) {
    await mongod.stop();
  }
});
