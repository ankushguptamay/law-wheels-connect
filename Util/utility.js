const fs = require("fs");

class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const deleteSingleFile = (filePath) => {
  if (filePath) {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          throw err;
        }
      });
    }
  }
  return;
};

function capitalizeFirstLetter(str) {
  const words = str.split(" ");

  return words
    .map((word) => {
      return word[0].toUpperCase() + word.substring(1).toLowerCase();
    })
    .join(" ");
}

const getOtherExceptGivenFileName = (all, given) => {
  const newAlls = [];
  for (let i = 0; i < all.length; i++) {
    if (all[i].fileName !== given) {
      newAlls.push(all[i]);
    }
  }
  return newAlls;
};

module.exports = {
  ErrorHandler,
  deleteSingleFile,
  capitalizeFirstLetter,
  getOtherExceptGivenFileName,
};
