const { MongoMemoryServer } = require("mongodb-memory-server");

module.exports = async () => {
  const mongoServer = await MongoMemoryServer.create();

  global.__MONGOSERVER__ = mongoServer;

  process.env.MONGO_URI = mongoServer.getUri();
};