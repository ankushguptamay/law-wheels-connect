const express = require("express");
const router = express.Router();

const {
  getChatDetails,
  newGroupChat,
  newPrivateChat,
  getMessages,
  getMyChats,
  getMyGroups,
  addAdmin,
  addMembers,
  removeAdmin,
  removeGroupAvatar,
  addUpdateGroupAvatar,
  removeMember,
  sendAttachments,
  leaveGroup,
  renameGroup,viewMessagesPrivateChat
} = require("../../Controller/Chat/chatController.js");

//middleware
const imageAndPDF = require("../../Middleware/UploadFile/imageAndPDF.js");
const image = require("../../Middleware/UploadFile/image.js");

router.post("/groupChat", newGroupChat);
router.post("/privateChat", newPrivateChat);
router.post(
  "/attachments",
  imageAndPDF.array("attachments", 10),
  sendAttachments
);

router.get("/chats", getMyChats);
router.get("/chats/:id", getChatDetails);
router.get("/myGroups", getMyGroups);
router.get("/messages/:id", getMessages);

router.put("/groupAvatar/:id", image.single("avatar"), addUpdateGroupAvatar);
router.put("/addMembers", addMembers);
router.put("/removeAdmin", removeAdmin);
router.put("/removeGroupAvatar/:id", removeGroupAvatar);
router.put("/removeMember", removeMember);
router.put("/addAdmin", addAdmin);
router.put("/leaveGroup/:id", leaveGroup);
router.put("/renameGroup/:id", renameGroup);

router.put("/viewMessages/:id", viewMessagesPrivateChat); // id=chatId

module.exports = router;
