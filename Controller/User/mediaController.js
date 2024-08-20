const { UserMedia } = require("../../Model/User/userMediaModel");
const { deleteSingleFile } = require("../../Util/utility");
const { uploadFileToBunny, deleteFileToBunny } = require("../../Util/bunny");
const bunnyFolderName = "profile";
const fs = require("fs");

exports.addMedia = async (req, res) => {
  try {
    const { link } = req.body;
    const file = req.file;

    // Validation
    let typeOfMedia, mimeType, fileName, url;
    if (file) {
      //Upload file to bunny
      const fileStream = fs.createReadStream(file.path);
      await uploadFileToBunny(bunnyFolderName, fileStream, file.filename);
      deleteSingleFile(file.path);
      if (file.mimetype == "image") {
        mimeType = "image";
      }
      typeOfMedia = "File";
      fileName = file.filename;
      url = `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${file.filename}`;
    } else if (link) {
      url = link;
      typeOfMedia = "Link";
    } else {
      return res.status(400).json({
        success: true,
        message: "Select a media!",
      });
    }

    // Store Media
    await UserMedia.create({
      typeOfMedia,
      mimeType,
      fileName,
      url,
      user: req.user._id,
    });
    res.status(200).json({
      success: true,
      message: "Media added successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getMyMedia = async (req, res) => {
  try {
    const media = await UserMedia.find({
      user: req.user._id,
      isDelete: false,
    });
    res.status(200).json({
      success: true,
      message: "Media fetched successfully!",
      data: media,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getMediaById = async (req, res) => {
  try {
    const media = await UserMedia.findOne({
      _id: req.params.id,
    });
    res.status(200).json({
      success: true,
      message: "Media fetched successfully!",
      data: media,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.softDeleteMedia = async (req, res) => {
  try {
    const _id = req.params.id;

    const media = await UserMedia.findOne({
      _id,
      isDelete: false,
    });
    if (!media) {
      return res.status(400).json({
        success: false,
        message: "This media is not present!",
      });
    }
    // Update is
    await media.updateOne({
      isDelete: true,
      deleted_at: new Date(),
    });
    res.status(200).json({
      success: true,
      message: "Media deleted successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
