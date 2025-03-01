const {
  validateGroupChat,
  validateAddMembers,
  validateRemoveMembers,
  validateRenameGroup,
  validateSendAttachments,
  validatePrivateChat,
} = require("../../Middleware/Validation/chatValidation");
const { Chat } = require("../../Model/Chat/chatModel");
const { User } = require("../../Model/User/userModel");
const { deleteSingleFile } = require("../../Util/utility");
const { uploadFileToBunny, deleteFileToBunny } = require("../../Util/bunny");
const bunnyFolderName = "chat";
const fs = require("fs");
const { Message } = require("../../Model/Chat/messageModel");
const { Connection } = require("../../Model/User/Connection/connectionModel");
const {
  ALERT,
  REFETCH_CHATS,
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
  MESSAGE_VIEWED,
  RENAME_GROUP,
  CHANGE_GROUP_AVATAR,
  REMOVE_GROUP_AVATAR,
} = require("../../Socket/event");
const { emitEvent, chatOnlineUsers } = require("../../Socket/io");

// Helper Function
const getOtherMember = (members, userId) => {
  const otherMembers = [];
  for (let i = 0; i < members.length; i++) {
    if (members[i]._id.toString() !== userId.toString()) {
      otherMembers.push({
        _id: members[i]._id,
        name: members[i].name,
        avatar: members[i].profilePic.url ? members[i].profilePic.url : null,
      });
    }
  }

  return otherMembers;
};

// Main Controller
exports.newGroupChat = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateGroupChat(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { chatName, members } = req.body;
    const allMembers = [...members, req.user._id.toString()];

    if (allMembers.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Chose atleast two members!",
      });
    }

    // Create Chat
    const chat = await Chat.create({
      chatName,
      groupChat: true,
      creator: req.user._id,
      admins: [req.user._id],
      members: allMembers,
    });

    // Socket
    emitEvent(req, ALERT, allMembers, `Welcome to ${chatName} group`);
    emitEvent(req, REFETCH_CHATS, members);

    res.status(200).json({
      success: true,
      message: "Group Created",
      data: { ...chat, avatar: null },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getMyChats = async (req, res) => {
  try {
    const chats = await Chat.find({ members: req.user._id })
      .populate("members", "name profilePic")
      .populate("creator", "name profilePic");

    const transformedChats = chats.map(
      ({ _id, chatName, members, groupChat, creator, avatar, admins }) => {
        const otherMember = getOtherMember(members, req.user._id);

        return {
          _id,
          groupChat,
          avatar: groupChat ? avatar : otherMember[0].avatar,
          chatName: groupChat ? chatName : otherMember[0].name,
          members: otherMember,
          admins,
          creator,
        };
      }
    );

    return res.status(200).json({
      success: true,
      chats: transformedChats,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getMyGroups = async (req, res) => {
  try {
    const chats = await Chat.find({
      members: req.user._id,
      groupChat: true,
      creator: req.user._id,
    }).populate("members", "name profilePic");

    const groups = chats.map(
      ({ members, _id, groupChat, chatName, avatar }) => {
        const otherMember = getOtherMember(members, req.user._id);
        return { _id, groupChat, chatName, avatar, members: otherMember };
      }
    );

    return res.status(200).json({ success: true, groups });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.addMembers = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateAddMembers(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { chatId, members } = req.body;

    // Find Chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }
    // Check group chat
    if (!chat.groupChat) {
      return res.status(400).json({
        success: false,
        message: "This is not a group chat",
      });
    }
    // Check member length
    if (chat.members.length + members.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Group members limit reached",
      });
    }
    // Is user admin
    if (!chat.admins.includes(req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to add members",
      });
    }
    // Fetch all members name
    const allNewMembersPromise = members.map((i) => User.findById(i, "name"));
    const allNewMembers = await Promise.all(allNewMembersPromise);

    // Filter out unique member
    const uniqueMembers = allNewMembers
      .filter((i) => !chat.members.includes(i._id.toString()))
      .map((i) => i._id);
    const uniqueMembersName = allNewMembers
      .filter((i) => !chat.members.includes(i._id.toString()))
      .map((i) => i.name);

    // Push in members array
    chat.members.push(...uniqueMembers);
    // Save chat
    await chat.save();

    // Socket
    emitEvent(
      req,
      ALERT,
      chat.members,
      `${uniqueMembersName} has been added in the group`
    );
    emitEvent(req, REFETCH_CHATS, chat.members);

    return res.status(200).json({
      success: true,
      message: "Members added successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.removeMember = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateRemoveMembers(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { userId, chatId } = req.body;

    const [chat, userThatWillBeRemoved] = await Promise.all([
      Chat.findById(chatId),
      User.findById(userId, "name"),
    ]);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }
    if (!chat.groupChat) {
      return res.status(400).json({
        success: false,
        message: "This is not a group chat",
      });
    }

    if (chat.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to remove members",
      });
    }

    if (chat.members.length <= 3) {
      return res.status(400).json({
        success: false,
        message: "Group must have at least 3 members",
      });
    }

    chat.members = chat.members.filter(
      (member) => member.toString() !== userId.toString()
    );
    if (chat.admins.includes(userId.toString())) {
      chat.admins = chat.admins.filter(
        (admin) => admin.toString() !== userId.toString()
      );
    }

    await chat.save();

    // Socket
    emitEvent(req, ALERT, chat.members, {
      message: `${userThatWillBeRemoved.name} has been removed from the group`,
      chatId,
    });
    emitEvent(req, REFETCH_CHATS, chat.members);

    return res.status(200).json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.leaveGroup = async (req, res) => {
  try {
    const chatId = req.params.id;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    if (!chat.groupChat) {
      return res.status(400).json({
        success: false,
        message: "This is not a group chat",
      });
    }

    const remainingMembers = chat.members.filter(
      (member) => member.toString() !== req.user._id.toString()
    );

    if (remainingMembers.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Group must have at least 3 members",
      });
    }

    if (chat.creator.toString() === req.user._id.toString()) {
      const randomElement = Math.floor(Math.random() * remainingMembers.length);
      const newCreator = remainingMembers[randomElement];
      chat.creator = newCreator;
      chat.admins = newCreator;
    }
    if (chat.admins.includes(req.user._id.toString())) {
      chat.admins = chat.admins.filter(
        (admin) => admin.toString() !== req.user._id.toString()
      );
    }
    chat.members = remainingMembers;

    const [user] = await Promise.all([
      User.findById(req.user._id, "name"),
      chat.save(),
    ]);

    // Socket
    emitEvent(req, ALERT, chat.members, {
      chatId,
      message: `User ${user.name} has left the group`,
    });
    emitEvent(req, REFETCH_CHATS, chat.members);

    return res.status(200).json({
      success: true,
      message: "Leave Group Successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.sendAttachments = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateSendAttachments(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { chatId } = req.body;

    // File validation
    const files = req.files || [];
    if (files.length < 1) {
      return res.status(400).json({
        success: false,
        message: "Please Upload Attachments",
      });
    }
    if (files.length > 10) {
      for (let i = 0; i < files.length; i++) {
        deleteSingleFile(files[i].path);
      }
      return res.status(400).json({
        success: false,
        message: "Files Can't be more than 10",
      });
    }

    // Find Chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      for (let i = 0; i < files.length; i++) {
        deleteSingleFile(files[i].path);
      }
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // Check is user member of this chat or not
    if (!chat.members.includes(req.user._id.toString())) {
      for (let i = 0; i < files.length; i++) {
        deleteSingleFile(files[i].path);
      }
      return res.status(403).json({
        success: false,
        message: "You are not allowed to send attachments",
      });
    }

    // To prevent an user to send second message when he is not connected and user will wait for response
    if (!chat.groupChat && !chat.privateConnection) {
      const messageCount = await Message.countDocuments({ chat: chatId });
      if (messageCount === 1) {
        const message = await Message.find({ chat: chatId });

        if (message[0].sender.toString() == req.user._id.toString()) {
          for (let i = 0; i < files.length; i++) {
            deleteSingleFile(files[i].path);
          }
          return res.status(404).json({
            success: false,
            message:
              "You’ve already sent a message to this advocate. To continue the conversation, wait for their response. Once they reply, you can chat freely.",
          });
        } else {
          chat.privateConnection = true;
          await Chat.save();
        }
      }
    }
    // Upload files here
    const attachments = [];
    for (let i = 0; i < files.length; i++) {
      const fileStream = fs.createReadStream(files[i].path);
      await uploadFileToBunny(bunnyFolderName, fileStream, files[i].filename);
      attachments.push({
        fileName: files[i].filename,
        mimeType: files[i].mimetype,
        url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${files[i].filename}`,
      });
      deleteSingleFile(files[i].path);
    }

    // Message for socket
    const messageForRealTime = {
      isView: false,
      sender: {
        _id: req.user._id,
        name: req.user.name,
        profilePic: req.user.profilePic ? req.user.profilePic.url : null,
      },
    };
    const messageForDB = {
      sender: req.user._id,
      chat: chatId,
      attachments,
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

    // Create message
    const message = await Message.create(messageForDB);

    messageForRealTime = { ...message, ...messageForRealTime };
    // Socket
    emitEvent(req, NEW_MESSAGE, chat.members, {
      message: messageForRealTime,
      chatId,
    });
    emitEvent(req, NEW_MESSAGE_ALERT, chat.members, { chatId });

    return res.status(200).json({
      success: true,
      message,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getChatDetails = async (req, res) => {
  try {
    if (req.query.populate === "true") {
      const chat = await Chat.findById(req.params.id)
        .populate("members", "name profilePic")
        .lean();

      if (!chat) {
        return res.status(404).json({
          success: false,
          message: "Chat not found",
        });
      }

      chat.members = chat.members.map(({ _id, name, profilePic }) => ({
        _id,
        name,
        profilePic: profilePic ? profilePic.url : null,
      }));

      return res.status(200).json({
        success: true,
        chat,
      });
    } else {
      const chat = await Chat.findById(req.params.id);
      if (!chat) {
        return res.status(404).json({
          success: false,
          message: "Chat not found",
        });
      }

      return res.status(200).json({
        success: true,
        chat,
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.renameGroup = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateRenameGroup(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const chatId = req.params.id;
    const { chatName } = req.body;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    if (!chat.groupChat) {
      return res.status(400).json({
        success: false,
        message: "This is not a group chat",
      });
    }

    if (!chat.admins.includes(req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to rename the group",
      });
    }

    chat.chatName = chatName;

    await chat.save();

    // Socket
    emitEvent(req, RENAME_GROUP, chat.members, {
      chatId,
      message: `${req.user.name} changed the group name!`,
    });
    emitEvent(req, REFETCH_CHATS, chat.members);

    return res.status(200).json({
      success: true,
      message: "Group renamed successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const chatId = req.params.id;
    const { page = 1 } = req.query;

    const resultPerPage = 50;
    const skip = (page - 1) * resultPerPage;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    if (!chat.members.includes(req.user._id.toString())) {
      return res.status(404).json({
        success: false,
        message: "You are not allowed to access this chat",
      });
    }

    const [messages, totalMessagesCount] = await Promise.all([
      Message.find({ chat: chatId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .populate("sender", "name")
        .lean(),
      Message.countDocuments({ chat: chatId }),
    ]);

    const totalPages = Math.ceil(totalMessagesCount / resultPerPage) || 0;

    return res.status(200).json({
      success: true,
      messages: messages.reverse(),
      userId: req.user._id,
      totalPages,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.addUpdateGroupAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please Upload avatar",
      });
    }
    const chatId = req.params.id;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    if (!chat.groupChat) {
      return res.status(400).json({
        success: false,
        message: "This is not a group chat",
      });
    }

    if (!chat.admins.includes(req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to add group avatar",
      });
    }

    const fileStream = fs.createReadStream(req.file.path);
    await uploadFileToBunny(bunnyFolderName, fileStream, req.file.filename);
    const avatar = {
      fileName: req.file.filename,
      url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`,
    };
    deleteSingleFile(req.file.path);
    let message = "uploaded";
    if (chat.avatar) {
      if (chat.avatar.fileName) {
        message = "updated";
        await deleteFileToBunny(bunnyFolderName, chat.avatar.fileName);
      }
    }
    chat.avatar = avatar;
    await chat.save();

    // Socket
    emitEvent(req, CHANGE_GROUP_AVATAR, chat.members, {
      chatId,
      message: `${req.user.name} changed the group avatar!`,
    });
    emitEvent(req, REFETCH_CHATS, chat.members);

    return res.status(200).json({
      success: true,
      message: `Group avatar ${message} successfully`,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.removeGroupAvatar = async (req, res) => {
  try {
    const chatId = req.params.id;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    if (!chat.groupChat) {
      return res.status(400).json({
        success: false,
        message: "This is not a group chat",
      });
    }

    if (!chat.admins.includes(req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to add group avatar",
      });
    }

    if (chat.avatar) {
      if (chat.avatar.fileName) {
        await deleteFileToBunny(bunnyFolderName, chat.avatar.fileName);
      }
    }
    chat.avatar = { url: null, fileName: null };
    await chat.save();

    // Socket
    emitEvent(req, REMOVE_GROUP_AVATAR, chat.members, {
      chatId,
      message: `${req.user.name} removed the group avatar!`,
    });
    emitEvent(req, REFETCH_CHATS, chat.members);

    return res.status(200).json({
      success: true,
      message: `Group avatar removed successfully`,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.newPrivateChat = async (req, res) => {
  try {
    // Body Validation
    const { error } = validatePrivateChat(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { member } = req.body;
    const allMembers = [member, req.user._id];

    const user = await User.findById(member).select("name profilePic");
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "This user is not present",
      });
    }

    // Connection
    const connection = await Connection.findOne({
      $and: [
        { status: "accepted" },
        {
          $or: [
            { sender: req.user._id, receiver: member },
            { sender: member, receiver: req.user._id },
          ],
        },
      ],
    });

    let privateConnection = false;
    if (connection) {
      privateConnection = true;
    }
    // Is chat present
    let chat = await Chat.findOne({
      groupChat: false,
      members: { $all: allMembers },
    });
    if (!chat) {
      chat = await Chat.create({
        privateConnection,
        groupChat: false,
        members: allMembers,
      });
    } else {
      // Message viewed
      await Message.updateMany(
        { chat: chat._id, isView: false, sender: { $nin: [req.user._id] } },
        { $set: { isView: true } }
      );
    }

    const transformedChats = {
      _id: chat._id,
      chatName: user.name,
      groupChat: false,
      members: [member],
      privateConnection: chat.privateConnection,
      avatar: user.profilePic ? user.profilePic.url : null,
      createdAt: chat.createdAt,
    };
    res.status(200).json({
      success: true,
      transformedChats,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.addAdmin = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateRemoveMembers(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { userId, chatId } = req.body;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }
    if (!chat.groupChat) {
      return res.status(400).json({
        success: false,
        message: "This is not a group chat",
      });
    }

    if (chat.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to remove members",
      });
    }

    if (!chat.members.includes(userId.toString())) {
      return res.status(403).json({
        success: false,
        message: "Member is not present in this group!",
      });
    }

    chat.admins.push(userId);
    await chat.save();

    // Socket
    emitEvent(req, REFETCH_CHATS, chat.members);

    return res.status(200).json({
      success: true,
      message: "Admin added successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.removeAdmin = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateRemoveMembers(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { userId, chatId } = req.body;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }
    if (!chat.groupChat) {
      return res.status(400).json({
        success: false,
        message: "This is not a group chat",
      });
    }

    if (chat.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to remove members",
      });
    }

    if (!chat.admins.includes(userId.toString())) {
      return res.status(403).json({
        success: false,
        message: "This member is not admin!",
      });
    }

    const newAdmin = [];
    for (let i = 0; i < chat.admins.length; i++) {
      if (chat.admins[i].toString() !== userId.toString()) {
        newAdmin.push(chat.admins[i]);
      }
    }

    chat.admins = newAdmin;
    await chat.save();

    // Socket
    emitEvent(req, REFETCH_CHATS, chat.members);

    return res.status(200).json({
      success: true,
      message: "Admin removed successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
