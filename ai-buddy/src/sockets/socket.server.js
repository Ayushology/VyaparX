const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const agent = require('../agents/agent')
const {HumanMessage,AIMessage} = require('@langchain/core/messages')
const {saveMessage,getMessages} = require('../memory')
async function initSocketServer(httpServer) {
  const io = new Server(httpServer, {});

  io.use((socket, next) => {
    const cookies = socket.handshake.headers?.cookie;
    const { token } = cookies ? cookie.parseCookie(cookies) : {};

    if (!token) {
      return next(new Error("Token not found"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.user = decoded;
      socket.token = token;

      next();
    } catch (err) {
      next(new Error("Invalid Credentials"));
    }
  });
io.on("connection", (socket) => {
    console.log(socket.user, socket.token);
    console.log("A user connected");

    socket.on("message", async (data) => {
        try {
            const userId = socket.user.id;

            saveMessage(userId, new HumanMessage(data));

            const history = getMessages(userId);

            const agentResponse = await agent.invoke(
                {
                    messages: history,
                },
                {
                    metadata: {
                        token: socket.token,
                    },
                }
            );

            const lastMessage =
                agentResponse.messages[
                    agentResponse.messages.length - 1
                ];

            saveMessage(userId, new AIMessage(lastMessage.content));

            socket.emit("message", lastMessage.content);
        } catch (err) {
            console.error(err);

            socket.emit(
                "message",
                "Something went wrong while processing your request."
            );
        }
    });
});
}

module.exports = { initSocketServer };