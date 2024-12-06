const { Server } = require("socket.io");
const { ErrorHandler } = require("../Util/utility");
const { socketAuthenticator } = require("../Middleware/verifyJWTToken");
const { NEW_MESSAGE, NEW_MESSAGE_ALERT } = require("./event");
const { Chat } = require("../Model/Chat/chatModel");
const { User } = require("../Model/User/userModel");
const { Message } = require("../Model/Chat/messageModel");
const uuid = require("uuid").v4;

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
    const user = socket.user;

    const existingSocket = userSocketIDs.get(user.id.toString());
    if (existingSocket && existingSocket !== socket.id) {
      io.to(existingSocket).disconnectSockets(); // Disconnect previous socket
    }
    userSocketIDs.set(user.id.toString(), socket.id);

    // New Message
    socket.on(NEW_MESSAGE, async ({ chatId, members, content }) => {
      const [chat, me] = await Promise.all([
        Chat.findById(chatId),
        User.findById(user._id, "name"),
      ]);

      if (!chat) {
        throw new Error("Chat not found");
      }
      if (!chat.members.includes(user._id.toString())) {
        throw new Error("You are not allowed to send attachments");
      }

      if (!chat.groupChat && !chat.privateConnection) {
        const messageCount = await Message.countDocuments({ chat: chatId });
        if (messageCount === 1) {
          const message = await Message.find({ chat: chatId });

          if (message[0].sender.toString() == user._id.toString()) {
            throw new Error("Wait for response!");
          } else {
            chat.privateConnection = true;
            await Chat.save();
          }
        }
      }

      const messageForRealTime = {
        content,
        _id: uuid(),
        sender: {
          _id: user._id,
          name: user.fullName,
          profilePic: user.profilePic ? user.profilePic.url : null,
        },
        chat: chatId,
        createdAt: new Date().toISOString(),
      };

      const messageForDB = {
        content,
        sender: user._id,
        chat: chatId,
      };

      const membersSocket = getSockets(members);
      io.to(membersSocket).emit(NEW_MESSAGE, {
        chatId,
        message: messageForRealTime,
      });

      // New Message Alert
      io.to(membersSocket).emit(NEW_MESSAGE_ALERT, { chatId });

      try {
        await Message.create(messageForDB);
      } catch (error) {
        throw new Error(error);
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      userSocketIDs.delete(user.id.toString());
    });
  });

  return io;
};
