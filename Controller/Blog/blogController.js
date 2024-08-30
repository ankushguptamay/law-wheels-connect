const {} = require("../../Middleware/Validation/blogValidation");
const { deleteSingleFile } = require("../../Util/utility");
const { uploadFileToBunny, deleteFileToBunny } = require("../../Util/bunny");
const bunnyFolderName = "blog-file";
const fs = require("fs");
const { Blog } = require("../../Model/Blog/blogModel");

exports.createBlog = async (req, res) => {
  try {
    // Body Validation
    const { error } = blogValidation(req.body);
    if (error) {
      if (req.files) {
        if (req.files.FeaturedPic) {
          deleteSingleFile(req.files.FeaturedPic[0].path);
        }
        if (req.files.AddititionalPic) {
          for (let i = 0; i < req.files.AddititionalPic.length; i++) {
            deleteSingleFile(req.files.AddititionalPic[i].path);
          }
        }
      }
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const {
      slug,
      category,
      tag,
      title,
      content,
      excerpt,
      readTime,
      publishDate,
      status,
      description,
    } = req.body;

    const isBlog = await Blog.findOne({ slug: slug });
    if (isBlog) {
      if (req.files) {
        if (req.files.FeaturedPic) {
          deleteSingleFile(req.files.FeaturedPic[0].path);
        }
        if (req.files.AddititionalPic) {
          for (let i = 0; i < req.files.AddititionalPic.length; i++) {
            deleteSingleFile(req.files.AddititionalPic[i].path);
          }
        }
      }
      return res.status(400).json({
        success: false,
        message: `Slug should be unique!`,
      });
    }
    let featuredPic;
    const addititionalPic = [];
    if (req.files) {
      if (req.files.FeaturedPic) {
        //Upload file to bunny
        const fileStream = fs.createReadStream(req.files.FeaturedPic[0].path);
        await uploadFileToBunny(
          bunnyFolderName,
          fileStream,
          req.files.FeaturedPic[0].filename
        );
        deleteSingleFile(req.files.FeaturedPic[0].path);
        featuredPic = {
          fileName: req.files.FeaturedPic[0].filename,
          url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.files.FeaturedPic[0].filename}`,
        };
      }
      if (req.files.AddititionalPic) {
        for (let i = 0; i < req.files.AddititionalPic.length; i++) {
          //Upload file to bunny
          const fileStream = fs.createReadStream(
            req.files.AddititionalPic[i].path
          );
          await uploadFileToBunny(
            bunnyFolderName,
            fileStream,
            req.files.AddititionalPic[i].filename
          );
          deleteSingleFile(req.files.AddititionalPic[i].path);
          addititionalPic.push({
            fileName: req.files.AddititionalPic[i].filename,
            url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.files.AddititionalPic[i].filename}`,
          });
        }
      }
    }
    const data = {
      slug,
      category,
      tag,
      title,
      content,
      excerpt,
      readTime,
      publishDate,
      status,
      description,
      featuredPic,
      addititionalPic,
      author: req.bloger._id,
    };
    // Create this if not exist
    await Blog.create(data);
    res.status(200).json({
      success: true,
      message: "Blog created successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.addUpdateFeaturedPic = async (req, res) => {
  try {
    // File should be exist
    if (!req.file) {
      return res.status(400).send({
        success: false,
        message: "Please..upload a profile image!",
      });
    }

    const isBlog = await Blog.findOne({
      _id: req.params._id,
    });
    if (!isBlog) {
      return res.status(400).json({
        success: false,
        message: `This blog is not present!`,
      });
    }

    //Upload file to bunny
    const fileStream = fs.createReadStream(req.file.path);
    await uploadFileToBunny(bunnyFolderName, fileStream, req.file.filename);
    deleteSingleFile(file.path);
    const featuredPic = {
      fileName: req.file.filename,
      url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`,
    };

    let message = "Featured pic added successfully!";
    if (isBlog.featuredPic.fileName) {
      await deleteFileToBunny(bunnyFolderName, isBlog.featuredPic.fileName);
      message = "Featured pic updated successfully!";
    }

    await isBlog.updateOne({ featuredPic });
    // Final response
    res.status(200).send({ success: true, message });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteFeaturedPic = async (req, res) => {
  try {
    const isBlog = await Blog.findOne({
      _id: req.params._id,
    });
    if (!isBlog) {
      return res.status(400).json({
        success: false,
        message: `This blog is not present!`,
      });
    }

    if (isBlog.featuredPic.fileName) {
      await deleteFileToBunny(bunnyFolderName, isBlog.featuredPic.fileName);
    }
    const featuredPic = { fileName: null, url: null };
    await isBlog.updateOne({ featuredPic });
    // Final response
    res
      .status(200)
      .send({ success: true, message: "Featured pic deleted successfully!" });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteAdditionalPic = async (req, res) => {
  try {
    const additionalPicId = req.body.additionalPicId;
    const isBlog = await Blog.findOne({
      _id: req.params._id,
      "additionalPic._id": additionalPicId,
    });
    if (!isBlog) {
      return res.status(400).json({
        success: false,
        message: `This blog or this additional pic is not present!`,
      });
    }

    const additionalPic = isBlog.additionalPic;
    const newAdditionalPic = [];
    for (let i = 0; i < additionalPic.length; i++) {
      if (additionalPic[i]._id.toString() == additionalPicId.toString()) {
        if (additionalPic[i].fileName) {
          await deleteFileToBunny(bunnyFolderName, additionalPic[i].fileName);
        }
      } else {
        newAdditionalPic.push(additionalPic[i]);
      }
    }

    await isBlog.updateOne({ additionalPic: newAdditionalPic });
    // Final response
    res
      .status(200)
      .send({ success: true, message: "Additional pic deleted successfully!" });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};
