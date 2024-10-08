// const { getSockets } = require("../Utils/helper");

exports.ALERT = "ALERT";
exports.REFETCH_CHATS = "REFETCH_CHATS";

exports.NEW_ATTACHMENT = "NEW_ATTACHMENT";
exports.NEW_MESSAGE_ALERT = "NEW_MESSAGE_ALERT";

exports.NEW_FOLLOWER = "NEW_FOLLOWER";
exports.NEW_COMMENT = "NEW_COMMENT";
exports.TAG_USER = "TAG_USER";
exports.NEW_COMMENT_REPLY = "NEW_COMMENT_REPLY";
exports.NEW_LIKE = "NEW_LIKE";
exports.INVITATION_ACCEPTED = "INVITATION_ACCEPTED";

exports.NEW_CONNECTION = "NEW_CONNECTION";
exports.NEW_MESSAGE = "NEW_MESSAGE";

exports.START_TYPING = "START_TYPING";
exports.STOP_TYPING = "STOP_TYPING";

exports.CHAT_JOINED = "CHAT_JOINED";
exports.CHAT_LEAVED = "CHAT_LEAVED";

exports.ONLINE_USERS = "ONLINE_USERS";

exports.emitEvent = (req, event, users, data) => {
  // const io = req.app.get("io");
  // const usersSocket = getSockets(users);
  // io.to(usersSocket).emit(event, data);
  console.log(event + " Fired!");
};
