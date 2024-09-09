const joi = require("joi");

exports.validateGroupChat = (data) => {
  const schema = joi.object().keys({
    chatName: joi.string().min(3).required(),
    members: joi.array().min(2).max(1000).required(),
  });
  return schema.validate(data);
};

exports.validateAddMembers = (data) => {
  const schema = joi.object().keys({
    chatId: joi.string().required(),
    members: joi.array().min(2).max(1000).required(),
  });
  return schema.validate(data);
};
exports.validateRemoveMembers = (data) => {
  const schema = joi.object().keys({
    chatId: joi.string().required(),
    userId: joi.string().required(),
  });
  return schema.validate(data);
};
exports.validateRenameGroup = (data) => {
  const schema = joi.object().keys({
    chatName: joi.string().min(3).required(),
  });
  return schema.validate(data);
};
exports.validateSendAttachments = (data) => {
  const schema = joi.object().keys({
    chatId: joi.string().required(),
  });
  return schema.validate(data);
};
exports.validatePrivateChat = (data) => {
  const schema = joi.object().keys({
    member: joi.string().required(),
  });
  return schema.validate(data);
};
