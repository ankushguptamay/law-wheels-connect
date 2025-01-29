const { Server } = require("socket.io");
const { ErrorHandler } = require("../Util/utility");
const { socketAuthenticator } = require("../Middleware/verifyJWTToken");
const {
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
  START_TYPING,
  STOP_TYPING,
  CHAT_JOINED,
  CHAT_LEAVED,
  ERROR,
} = require("./event");
const { Chat } = require("../Model/Chat/chatModel");
const { User } = require("../Model/User/userModel");
const { Message } = require("../Model/Chat/messageModel");
const uuid = require("uuid").v4;

const userSocketIDs = new Map();
const onlineUsers = new Set();
const chatOnlineUsers = new Map();
const getSockets = (users = []) => {
  const sockets = users.map((user) => userSocketIDs.get(user.toString()));
  return sockets;
};

const emitEvent = (req, event, users, data) => {
  const io = req.app.get("io");
  if (!io) {
    return next(new ErrorHandler("io instance not found in app", 401));
  }
  const usersSocket = getSockets(users);
  io.to(usersSocket).emit(event, data);
};

const socketIO = (server) => {
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

    const existingSocket = userSocketIDs.get(user._id.toString());
    if (existingSocket && existingSocket !== socket.id) {
      io.to(existingSocket).disconnectSockets(); // Disconnect previous socket
    }
    userSocketIDs.set(user._id.toString(), socket.id);

    // New Message
    socket.on(NEW_MESSAGE, async ({ chatId, members, content }) => {
      const chat = await Chat.findById(chatId);

      if (!chat) {
        socket.emit(ERROR, {
          success: false,
          message: "Chat not found!",
        });
        return;
      }
      if (!chat.members.includes(user._id.toString())) {
        socket.emit(ERROR, {
          success: false,
          message: "You are not allowed to send attachments!",
        });
        return;
      }

      if (!chat.groupChat && !chat.privateConnection) {
        const messageCount = await Message.countDocuments({ chat: chatId });
        if (messageCount === 1) {
          const message = await Message.find({ chat: chatId });

          if (message[0].sender.toString() == user._id.toString()) {
            socket.emit(ERROR, {
              success: false,
              message: "Wait for response!",
            });
            return;
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
          name: user.name,
          profilePic: user.profilePic ? user.profilePic.url : null,
        },
        chat: chatId,
        createdAt: new Date(),
        isView: false,
      };

      const messageForDB = {
        content,
        sender: user._id,
        chat: chatId,
        isView: false,
      };

      // View message condition
      if (!chat.groupChat) {
        if (
          chatOnlineUsers.has(chatId) &&
          chatOnlineUsers.get(chatId).has(chat.members[0]?.toString()) &&
          chatOnlineUsers.get(chatId).has(chat.members[1]?.toString())
        ) {
          messageForRealTime.isView = true;
          messageForDB.isView = true;
        }
      }

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
        socket.emit(ERROR, {
          success: false,
          message: "An unexpected error occurred.",
          details: error.message,
        });
        return;
      }
    });

    // Chat Joined
    socket.on(CHAT_JOINED, ({ chatId }) => {
      if (!chatOnlineUsers.has(chatId)) {
        chatOnlineUsers.set(chatId, new Set());
      }
      chatOnlineUsers.get(chatId).add(user._id.toString());

      const membersSocket = getSockets([...chatOnlineUsers.get(chatId)]);
      socket
        .to(membersSocket)
        .emit(CHAT_JOINED, { chatId, userId: user._id.toString() });
    });

    // Chat Leaved
    socket.on(CHAT_LEAVED, ({ chatId }) => {
      if (chatOnlineUsers.has(chatId)) {
        chatOnlineUsers.get(chatId).delete(user._id.toString());

        // Clean up empty chat
        if (chatOnlineUsers.get(chatId).size === 0) {
          chatOnlineUsers.delete(chatId);
        }

        const members = chatOnlineUsers.get(chatId) || new Set();
        const membersSocket = getSockets([...members]);
        socket
          .to(membersSocket)
          .emit(CHAT_LEAVED, { chatId, userId: user._id.toString() });
      }
    });

    // Start Typing
    socket.on(START_TYPING, ({ chatId }) => {
      if (chatOnlineUsers.has(chatId)) {
        const membersSockets = getSockets([...chatOnlineUsers.get(chatId)]);

        socket
          .to(membersSockets)
          .emit(START_TYPING, { chatId, userId: user._id.toString() });
      }
    });

    // Stop Typing
    socket.on(STOP_TYPING, ({ chatId }) => {
      if (chatOnlineUsers.has(chatId)) {
        const membersSockets = getSockets([...chatOnlineUsers.get(chatId)]);

        socket
          .to(membersSockets)
          .emit(STOP_TYPING, { chatId, userId: user._id.toString() });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      // Also disconnect user from chats
      for (const [chatId, members] of chatOnlineUsers) {
        if (members.has(user._id.toString())) {
          members.delete(user._id.toString());

          // Notify remaining members in the chat
          const membersSockets = getSockets([...members]);
          socket
            .to(membersSockets)
            .emit(CHAT_LEAVED, { chatId, userId: user._id.toString() });

          if (members.size === 0) {
            chatOnlineUsers.delete(chatId); // Clean up empty chat
          }
        }
      }
      userSocketIDs.delete(user.id.toString());
    });
  });

  return io;
};

module.exports = { chatOnlineUsers, emitEvent, socketIO };
