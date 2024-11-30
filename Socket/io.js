const { Server } = require("socket.io");
const { ErrorHandler } = require("../Util/utility");
const { socketAuthenticator } = require("../Middleware/verifyJWTToken");

const userSocketIDs = new Map();
const onlineUsers = new Set();
const getSockets = (users = []) => {
  const sockets = users.map((user) => userSocketIDs.get(user.toString()));
  return sockets;
};

exports.emitEvent = (req, event, users, data) => {
  const io = req.app.get("io");
  if (!io) {
    return next(new ErrorHandler("io instance not found in app", 401));
  }
  const usersSocket = getSockets(users);
  io.to(usersSocket).emit(event, data);
};

exports.socketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*", // Update with your allowed origins
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    },
  });

  // Middleware for Socket.io
  io.use(async (socket, next) => {
    await socketAuthenticator(socket, next);
  });

  // Connection event
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    const user = socket.user;

    const existingSocket = userSocketIDs.get(user.id.toString());
    if (existingSocket && existingSocket !== socket.id) {
      io.to(existingSocket).disconnectSockets(); // Disconnect previous socket
    }
    userSocketIDs.set(user.id.toString(), socket.id);

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
      userSocketIDs.delete(user.id.toString());
    });
  });

  return io;
};
