const {
  validateTextPost,
  addMediaPost,
  addPollPost,
  addCelebratePost,
  deleteMediaPost,
} = require("../../../Middleware/Validation/postValidation");
const { Post } = require("../../../Model/User/Post/postModel");
const { uploadFileToBunny, deleteFileToBunny } = require("../../../Util/bunny");
const { getOtherExceptGivenFileName } = require("../../../Util/features");
const { deleteSingleFile } = require("../../../Util/utility");
const bunnyFolderName = "post";
const fs = require("fs");

exports.addTextPost = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateTextPost(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { content, hash_tag } = req.body;
    // Create text post
    await Post.create({
      content: content,
      user: req.user._id,
      postType: "text",
      hash_tag,
    });
    res.status(200).json({
      success: true,
      message: "Post created successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateTextPost = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateTextPost(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { content, hash_tag } = req.body;

    const _id = req.params.id;
    const post = await Post.findOne({ _id, postType: "text" });
    if (!post) {
      return res.status(400).json({
        success: false,
        message: "This post is not present!",
      });
    }
    // update text post
    await post.updateOne({
      content: content,
      hash_tag,
    });
    res.status(200).json({
      success: true,
      message: "Post updated successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.addMediaPost = async (req, res) => {
  try {
    const files = req.files;
    if (files.length < 1) {
      return res.status(400).json({
        success: false,
        message: "Select at least one media!",
      });
    }

    // Body Validation
    const { error } = addMediaPost(req.body);
    if (error) {
      for (let i = 0; i < files.length; i++) {
        deleteSingleFile(files[i].path);
      }
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { content, hash_tag } = req.body;
    const media = [];
    for (let i = 0; i < files.length; i++) {
      //Upload file to bunny
      const fileStream = fs.createReadStream(files[i].path);
      await uploadFileToBunny(bunnyFolderName, fileStream, files[i].filename);
      media.push({
        mimeType: files[i].mimetype,
        fileName: files[i].filename,
        url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${files[i].filename}`,
      });
      deleteSingleFile(files[i].path);
    }
    // Create text post
    await Post.create({
      content: content,
      user: req.user._id,
      postType: "media",
      media: media,
      hash_tag,
    });
    res.status(200).json({
      success: true,
      message: "Post created successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.addDocumentPost = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Select a document file!",
      });
    }

    // Body Validation
    const { error } = addMediaPost(req.body);
    if (error) {
      deleteSingleFile(req.file.path);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    //Upload file to bunny
    const fileStream = fs.createReadStream(req.file.path);
    await uploadFileToBunny(bunnyFolderName, fileStream, req.file.filename);
    deleteSingleFile(req.file.path);

    const { content, hash_tag } = req.body;
    const document = {
      url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`,
      fileName: req.file.filename,
    };

    // Create text post
    await Post.create({
      content: content,
      user: req.user._id,
      postType: "document",
      document: document,
      hash_tag,
    });
    res.status(200).json({
      success: true,
      message: "Post created successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateDocumentPost = async (req, res) => {
  try {
    // Body Validation
    const { error } = addMediaPost(req.body);
    if (error) {
      if (req.file) {
        deleteSingleFile(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { content, hash_tag } = req.body;

    const _id = req.params.id;
    const post = await Post.findOne({ _id, postType: "document" });
    if (!post) {
      if (req.file) {
        deleteSingleFile(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: "This post is not present!",
      });
    }

    let document = post.document;
    if (req.file) {
      //Upload file to bunny
      const fileStream = fs.createReadStream(req.file.path);
      await uploadFileToBunny(bunnyFolderName, fileStream, req.file.filename);
      deleteSingleFile(req.file.path);

      document = {
        url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`,
        fileName: req.file.filename,
      };

      await deleteFileToBunny(bunnyFolderName, post.document.fileName);
    }

    // Update document post
    await post.updateOne({
      content: content,
      document: document,
      hash_tag,
    });
    res.status(200).json({
      success: true,
      message: "Post updated successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.addTemplatePost = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Select a template!",
      });
    }

    // Body Validation
    const { error } = addMediaPost(req.body);
    if (error) {
      deleteSingleFile(req.file.path);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    //Upload file to bunny
    const fileStream = fs.createReadStream(req.file.path);
    await uploadFileToBunny(bunnyFolderName, fileStream, req.file.filename);
    deleteSingleFile(req.file.path);

    const { content, hash_tag } = req.body;
    const template = {
      fileName: req.file.filename,
      url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`,
    };

    // Create text post
    await Post.create({
      content: content,
      user: req.user._id,
      postType: "template",
      template: template,
      hash_tag,
    });
    res.status(200).json({
      success: true,
      message: "Post created successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateTemplatePost = async (req, res) => {
  try {
    // Body Validation
    const { error } = addMediaPost(req.body);
    if (error) {
      if (req.file) {
        deleteSingleFile(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { content, hash_tag } = req.body;

    const _id = req.params.id;
    const post = await Post.findOne({ _id, postType: "template" });
    if (!post) {
      if (req.file) {
        deleteSingleFile(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: "This post is not present!",
      });
    }

    let template = post.template;
    if (req.file) {
      //Upload file to bunny
      const fileStream = fs.createReadStream(req.file.path);
      await uploadFileToBunny(bunnyFolderName, fileStream, req.file.filename);
      deleteSingleFile(req.file.path);

      template = {
        fileName: req.file.filename,
        url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`,
      };

      await deleteFileToBunny(bunnyFolderName, post.template.fileName);
    }

    // update template post
    await post.updateOne({
      content: content,
      template: template,
      hash_tag,
    });
    res.status(200).json({
      success: true,
      message: "Post updated successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.addPollPost = async (req, res) => {
  try {
    // Body Validation
    const { error } = addPollPost(req.body);
    if (error) {
      deleteSingleFile(req.file.path);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { content, hash_tag, poll } = req.body;

    // Create text post
    await Post.create({
      content: content,
      user: req.user._id,
      postType: "poll",
      poll,
      hash_tag,
    });
    res.status(200).json({
      success: true,
      message: "Post created successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updatePollPost = async (req, res) => {
  try {
    // Body Validation
    const { error } = addPollPost(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { content, hash_tag, poll } = req.body;

    const _id = req.params.id;
    const post = await Post.findOne({ _id, postType: "poll" });
    if (!post) {
      return res.status(400).json({
        success: false,
        message: "This post is not present!",
      });
    }

    // Update poll post
    await post.updateOne({
      content: content,
      poll,
      hash_tag,
    });
    res.status(200).json({
      success: true,
      message: "Post updated successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.addCelebratePost = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Select a image!",
      });
    }

    // Body Validation
    const { error } = addCelebratePost(req.body);
    if (error) {
      deleteSingleFile(req.file.path);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    //Upload file to bunny
    const fileStream = fs.createReadStream(req.file.path);
    await uploadFileToBunny(bunnyFolderName, fileStream, req.file.filename);
    deleteSingleFile(req.file.path);

    const { content, hash_tag, person } = req.body;
    const celebrate = {
      person: person,
      fileName: req.file.filename,
      url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`,
    };

    // Create text post
    await Post.create({
      content: content,
      user: req.user._id,
      postType: "celebrate",
      celebrate: celebrate,
      hash_tag,
    });
    res.status(200).json({
      success: true,
      message: "Post created successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateCelebratePost = async (req, res) => {
  try {
    // Body Validation
    const { error } = addCelebratePost(req.body);
    if (error) {
      if (req.file) {
        deleteSingleFile(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { content, hash_tag, person } = req.body;

    const _id = req.params.id;
    const post = await Post.findOne({ _id, postType: "celebrate" });
    if (!post) {
      if (req.file) {
        deleteSingleFile(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: "This post is not present!",
      });
    }

    let celebrate = { ...post.celebrate, person: person };
    if (req.file) {
      //Upload file to bunny
      const fileStream = fs.createReadStream(req.file.path);
      await uploadFileToBunny(bunnyFolderName, fileStream, req.file.filename);
      deleteSingleFile(req.file.path);

      celebrate = {
        person: person,
        fileName: req.file.filename,
        url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`,
      };

      await deleteFileToBunny(bunnyFolderName, post.celebrate.fileName);
    }

    // update celebrate post
    await post.updateOne({
      content: content,
      celebrate: celebrate,
      hash_tag,
    });
    res.status(200).json({
      success: true,
      message: "Post updated successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteMediaFile = async (req, res) => {
  try {
    // Body Validation
    const { error } = deleteMediaPost(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { mediaFileId } = req.body;
    const _id = req.params.id;
    const post = await Post.findOne({
      _id,
      postType: "media",
      "media._id": mediaFileId,
    });
    if (!post) {
      return res.status(400).json({
        success: false,
        message: "This post file is not present!",
      });
    }

    // Delete File
    let fileName;
    for (let i = 0; i < post.media.length; i++) {
      if (post.media[i]._id == mediaFileId) {
        fileName = post.media[i].fileName;
        break;
      }
    }
    if (fileName) {
      await deleteFileToBunny(bunnyFolderName, fileName);
    }
    // New Media
    const newMediaArray = getOtherExceptGivenFileName(post.media, fileName);
    // Create text post
    await post.updateOne({
      media: newMediaArray,
    });
    res.status(200).json({
      success: true,
      message: "File deleted successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateMediaPost = async (req, res) => {
  try {
    const files = req.files;
    // Body Validation
    const { error } = addMediaPost(req.body);
    if (error) {
      if (files.length >= 1) {
        for (let i = 0; i < files.length; i++) {
          deleteSingleFile(files[i].path);
        }
      }
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const _id = req.params.id;
    const post = await Post.findOne({ _id, postType: "media" });
    if (!post) {
      if (files.length >= 1) {
        for (let i = 0; i < files.length; i++) {
          deleteSingleFile(files[i].path);
        }
      }
      return res.status(400).json({
        success: false,
        message: "This post is not present!",
      });
    }

    const { content, hash_tag } = req.body;
    const media = post.media;
    if (files.length >= 1) {
      for (let i = 0; i < files.length; i++) {
        //Upload file to bunny
        const fileStream = fs.createReadStream(files[i].path);
        await uploadFileToBunny(bunnyFolderName, fileStream, files[i].filename);
        deleteSingleFile(files[i].path);

        media.push({
          mimeType: files[i].mimetype,
          fileName: files[i].filename,
          url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${files[i].filename}`,
        });
      }
    }
    // update post
    await post.updateOne({
      content: content,
      media: media,
      hash_tag,
    });
    res.status(200).json({
      success: true,
      message: "Post updated successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getMyPost = async (req, res) => {
  try {
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    //Search
    let query = { user: req.user._id, isDelete: false };
    if (req.query.search) {
      const startWith = new RegExp("^" + req.query.search.toLowerCase(), "i");
      const containInString = new RegExp(req.query.search, "i");
      const constainInArray = { $regex: `${req.query.search}`, $options: "i" };
      query = {
        $and: [
          { user: req.user._id },
          { isDelete: false },
          {
            $or: [{ content: containInString }, { hash_tag: constainInArray }],
          },
        ],
      };
    }
    const [post, totalPost] = await Promise.all([
      Post.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .lean(),
      Post.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalPost / resultPerPage) || 0;
    res.status(200).json({
      success: true,
      message: "Post fetched successfully!",
      data: post,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
    });
    res.status(200).json({
      success: true,
      message: "Post fetched successfully!",
      data: post,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.softDeletePost = async (req, res) => {
  try {
    const _id = req.params.id;

    const post = await Post.findOne({
      _id,
      isDelete: false,
    });
    if (!post) {
      return res.status(400).json({
        success: false,
        message: "This post is not present!",
      });
    }
    // Update is
    await post.updateOne({
      isDelete: true,
      deleted_at: new Date(),
    });
    res.status(200).json({
      success: true,
      message: "Post deleted successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
