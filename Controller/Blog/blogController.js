const {
  deleteAdditionalPicValidation,
  blogValidation,
  slugValidation,
  publishBlogValidation,
} = require("../../Middleware/Validation/blogValidation");
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
        if (req.files.AdditionalPic) {
          for (let i = 0; i < req.files.AdditionalPic.length; i++) {
            deleteSingleFile(req.files.AdditionalPic[i].path);
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
        if (req.files.AdditionalPic) {
          for (let i = 0; i < req.files.AdditionalPic.length; i++) {
            deleteSingleFile(req.files.AdditionalPic[i].path);
          }
        }
      }
      return res.status(400).json({
        success: false,
        message: `Slug should be unique!`,
      });
    }
    let featuredPic;
    const additionalPic = [];
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
      if (req.files.AdditionalPic) {
        for (let i = 0; i < req.files.AdditionalPic.length; i++) {
          //Upload file to bunny
          const fileStream = fs.createReadStream(
            req.files.AdditionalPic[i].path
          );
          await uploadFileToBunny(
            bunnyFolderName,
            fileStream,
            req.files.AdditionalPic[i].filename
          );
          deleteSingleFile(req.files.AdditionalPic[i].path);
          additionalPic.push({
            fileName: req.files.AdditionalPic[i].filename,
            url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.files.AdditionalPic[i].filename}`,
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
      additionalPic,
      author: req.blogger._id,
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
      _id: req.params.id,
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
    deleteSingleFile(req.file.path);
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
      _id: req.params.id,
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
    // Body Validation
    const { error } = deleteAdditionalPicValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const additionalPicId = req.body.additionalPicId;
    const isBlog = await Blog.findOne({
      _id: req.params.id,
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

exports.addAdditionalPic = async (req, res) => {
  try {
    // File should be exist
    if (!req.files) {
      return res.status(400).send({
        success: false,
        message: "Please..upload atleast an additional image!",
      });
    }

    const isBlog = await Blog.findOne({
      _id: req.params.id,
    });
    if (!isBlog) {
      return res.status(400).json({
        success: false,
        message: `This blog is not present!`,
      });
    }
    const additionalPic = isBlog.additionalPic;
    const maxFileUpload = 20;
    const currentUploadedPics = additionalPic.length;
    const fileCanUpload = maxFileUpload - currentUploadedPics;
    let fileUploaded = 0;
    //Upload file to bunny
    for (let i = 0; i < req.files.length; i++) {
      if (i < fileCanUpload) {
        //Upload file
        const fileStream = fs.createReadStream(req.files[i].path);
        await uploadFileToBunny(
          bunnyFolderName,
          fileStream,
          req.files[i].filename
        );
        additionalPic.push({
          url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.files[i].filename}`,
          fileName: req.files[i].filename,
        });
        fileUploaded = fileUploaded + 1;
      }
      deleteSingleFile(req.files[i].path);
    }

    await isBlog.updateOne({ additionalPic });
    // Final response
    res.status(200).send({
      success: true,
      message: `${fileUploaded} additional pic added successfully!`,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    // Body Validation
    const { error } = blogValidation(req.body);
    if (error) {
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
    const isBlog = await Blog.findOne({
      _id: req.params.id,
    });
    if (!isBlog) {
      return res.status(400).json({
        success: false,
        message: `This blog is not present!`,
      });
    }
    if (slug !== isBlog.slug) {
      const isSlug = await Blog.findOne({ slug: slug });
      if (isSlug) {
        return res.status(400).json({
          success: false,
          message: `Slug should be unique!`,
        });
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
    };

    // update
    await isBlog.updateOne(data);
    res.status(200).json({
      success: true,
      message: "Blog updated successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const isBlog = await Blog.findOne({
      _id: req.params.id,
    });
    if (!isBlog) {
      return res.status(400).json({
        success: false,
        message: `This blog is not present!`,
      });
    }

    // Delete Files
    if (isBlog.featuredPic) {
      if (isBlog.featuredPic.fileName) {
        await deleteFileToBunny(bunnyFolderName, isBlog.featuredPic.fileName);
      }
    }

    for (let i = 0; i < isBlog.additionalPic.length; i++) {
      if (isBlog.additionalPic[i].fileName) {
        await deleteFileToBunny(
          bunnyFolderName,
          isBlog.additionalPic[i].fileName
        );
      }
    }

    // delete
    await isBlog.deleteOne();
    res.status(200).json({
      success: true,
      message: "Blog deleted successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.blogSlug = async (req, res) => {
  try {
    // Body Validation
    const { error } = slugValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const slug = req.body.slug;
    const isBlog = await Blog.findOne({ slug });
    if (isBlog) {
      return res.status(400).json({
        success: false,
        message: `Present`,
      });
    }

    res.status(200).json({
      success: true,
      message: "NotPresent!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.publishBlog = async (req, res) => {
  try {
    // Body Validation
    const { error } = publishBlogValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const status = req.body.status;
    const isBlog = await Blog.findById(req.params.id);
    if (!isBlog) {
      return res.status(400).json({
        success: false,
        message: `This blog is not present`,
      });
    }

    await isBlog.updateOne(status);
    res.status(200).json({
      success: true,
      message: `Blog ${status} successfully!`,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getBlogs = async (req, res) => {
  try {
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    //Search
    let query = {};
    if (req.query.search) {
      const startWith = new RegExp("^" + req.query.search.toLowerCase(), "i");
      query = { $or: [{ slug: startWith }, { title: startWith }] };
    }
    const [blog, totalBlogs] = await Promise.all([
      Blog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(resultPerPage)
        // .populate("parentBlogCatagories", "name slug categoryPic description")
        .lean(),
      Blog.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalBlogs / resultPerPage) || 0;

    res.status(200).json({
      success: true,
      message: "Blog fetched successfully!",
      data: blog,
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

exports.getBlogBySlug = async (req, res) => {
  try {
    const isBlog = await Blog.findOne({
      slug: req.params.slug,
    });
    if (!isBlog) {
      return res.status(400).json({
        success: false,
        message: `This blog is not present!`,
      });
    }

    // delete
    await isBlog.deleteOne();
    res.status(200).json({
      success: true,
      message: "Blog fetched successfully!",
      data: isBlog,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getBlogBySlugForUser = async (req, res) => {
  try {
    const today = new Date();
    const isBlog = await Blog.findOne({
      slug: req.params.slug,
      publishDate: { $lte: today },
      status: "Published",
    });
    if (!isBlog) {
      return res.status(400).json({
        success: false,
        message: `This blog is not present!`,
      });
    }

    // delete
    await isBlog.deleteOne();
    res.status(200).json({
      success: true,
      message: "Blog fetched successfully!",
      data: isBlog,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
