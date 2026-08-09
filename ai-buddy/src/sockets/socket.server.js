const { createServer } = require("http");

async function initSocketServer(httpServer) {
  const io = new Server(httpServer, {});

  io.on("connection", (socket) => {
    console.log("A user connected");
  });
}

httpServer.listen(3000);

module.exports = {};