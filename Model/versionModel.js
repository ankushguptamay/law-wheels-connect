const { Schema, model, models } = require("mongoose");

const schema = new Schema({ version: { type: String } });

exports.AppVersion = models.AppVersion || model("AppVersion", schema);
