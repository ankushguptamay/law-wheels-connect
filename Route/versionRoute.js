const express = require("express");
const {
  addUpdateVersion,
  getLatestVersion,
} = require("../Controller/versionController");

const version = express.Router();

version.post("/version", addUpdateVersion);
version.get("/version", getLatestVersion);

module.exports = version;
