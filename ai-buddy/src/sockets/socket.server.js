const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const agent = require('../agents/agent')
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
    console.log(socket.user,socket.token);
    
    console.log("A user connected");

    socket.on("message",async(data)=>{
      const agentResponse = await agent.invoke({
        messages : [
            {
                role : "user",
                content : data
            }
        ]
      },{
        metadata : {
            token : socket.token
        }
      })
      console.log("Agent Response",agentResponse);
      
        
    })
  });
}

module.exports = { initSocketServer };