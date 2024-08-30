const {
  parentCategoriesValidation,
  categoriesValidation,
} = require("../../Middleware/Validation/blogValidation");
const {
  ParentBlogCategories,
} = require("../../Model/Blog/parentCategoryModel");
const {
  capitalizeFirstLetter,
  deleteSingleFile,
} = require("../../Util/utility");
const { uploadFileToBunny, deleteFileToBunny } = require("../../Util/bunny");
const bunnyFolderName = "blog-file";
const fs = require("fs");
const { BlogCategories } = require("../../Model/Blog/categoryModel");

exports.addParentCategories = async (req, res) => {
  try {
    // Body Validation
    const { error } = parentCategoriesValidation(req.body);
    if (error) {
      if (req.file) {
        deleteSingleFile(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { slug, description, sort_order, name } = req.body;

    const parentCategorie = await ParentBlogCategories.findOne({
      $or: [{ slug: slug }, { name: name }],
    });
    if (parentCategorie) {
      if (req.file) {
        deleteSingleFile(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: `Name and slug should be unique!`,
      });
    }
    let categoryPic;
    if (req.file) {
      console.log("here");
      //Upload file to bunny
      const fileStream = fs.createReadStream(req.file.path);
      await uploadFileToBunny(bunnyFolderName, fileStream, req.file.filename);
      deleteSingleFile(req.file.path);
      categoryPic = {
        fileName: req.file.filename,
        url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`,
      };
    }
    let data = { name, slug, description, sort_order, categoryPic };
    // Create this if not exist
    await ParentBlogCategories.create(data);
    res.status(200).json({
      success: true,
      message: "Parent categories added successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.addCategories = async (req, res) => {
  try {
    // Body Validation
    const { error } = categoriesValidation(req.body);
    if (error) {
      if (req.file) {
        deleteSingleFile(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { slug, description, parentBlogCatagories, sort_order, name } =
      req.body;

    const categorie = await BlogCategories.findOne({
      $or: [{ slug: slug }, { name: name }],
    });
    if (categorie) {
      if (req.file) {
        deleteSingleFile(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: `Name and slug should be unique!`,
      });
    }
    let categoryPic;
    if (req.file) {
      //Upload file to bunny
      const fileStream = fs.createReadStream(req.file.path);
      await uploadFileToBunny(bunnyFolderName, fileStream, req.file.filename);
      deleteSingleFile(req.file.path);
      categoryPic = {
        fileName: req.file.filename,
        url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`,
      };
    }
    let data = {
      name,
      slug,
      description,
      sort_order,
      categoryPic,
      parentBlogCatagories,
    };
    // Create this if not exist
    await BlogCategories.create(data);
    res.status(200).json({
      success: true,
      message: "Categories added successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getParentCategories = async (req, res) => {
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
      query = { $or: [{ slug: startWith }, { name: startWith }] };
    }
    const [parentCategories, totalParentCategories] = await Promise.all([
      ParentBlogCategories.find(query)
        .sort({ name: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .lean(),
      ParentBlogCategories.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalParentCategories / resultPerPage) || 0;

    res.status(200).json({
      success: true,
      message: "Parent categories fetched successfully!",
      data: parentCategories,
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

exports.getCategories = async (req, res) => {
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
      query = { $or: [{ slug: startWith }, { name: startWith }] };
    }
    const [categories, totalCategories] = await Promise.all([
      BlogCategories.find(query)
        .sort({ name: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .populate("parentBlogCatagories", "name slug categoryPic description")
        .lean(),
      BlogCategories.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCategories / resultPerPage) || 0;

    res.status(200).json({
      success: true,
      message: "Categories fetched successfully!",
      data: categories,
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

exports.updateParentCategories = async (req, res) => {
  try {
    // Body Validation
    const { error } = parentCategoriesValidation(req.body);
    if (error) {
      if (req.file) {
        deleteSingleFile(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { slug, description, sort_order, name } = req.body;
    const _id = req.params.id;

    const parentCategorie = await ParentBlogCategories.findOne({ _id });
    if (!parentCategorie) {
      if (req.file) {
        deleteSingleFile(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: `This parent categories is not present!`,
      });
    }

    if (name !== parentCategorie.name) {
      const isName = await ParentBlogCategories.findOne({ name });
      if (!isName) {
        if (req.file) {
          deleteSingleFile(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: `Name should be unique!`,
        });
      }
    }

    if (slug !== parentCategorie.slug) {
      const isSlug = await ParentBlogCategories.findOne({ slug });
      if (!isSlug) {
        if (req.file) {
          deleteSingleFile(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: `Slug should be unique!`,
        });
      }
    }

    let categoryPic;
    if (req.file) {
      //Upload file to bunny
      const fileStream = fs.createReadStream(req.file.path);
      await uploadFileToBunny(bunnyFolderName, fileStream, req.file.filename);
      deleteSingleFile(req.file.path);
      categoryPic = {
        fileName: req.file.filename,
        url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`,
      };
      // Delete file from bunny
      if (parentCategorie.categoryPic.fileName) {
        await deleteFileToBunny(
          bunnyFolderName,
          parentCategorie.categoryPic.fileName
        );
      }
    }
    let data = { name, slug, description, sort_order, categoryPic };

    // update
    await parentCategorie.updateOne(data);
    res.status(200).json({
      success: true,
      message: "Parent categories updated successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateCategories = async (req, res) => {
  try {
    // Body Validation
    const { error } = categoriesValidation(req.body);
    if (error) {
      if (req.file) {
        deleteSingleFile(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { slug, description, sort_order, parentBlogCatagories, name } =
      req.body;
    const _id = req.params.id;

    const categorie = await BlogCategories.findOne({ _id });
    if (!categorie) {
      if (req.file) {
        deleteSingleFile(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: `This categories is not present!`,
      });
    }

    if (name !== categorie.name) {
      const isName = await BlogCategories.findOne({ name });
      if (!isName) {
        if (req.file) {
          deleteSingleFile(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: `Name should be unique!`,
        });
      }
    }

    if (slug !== categorie.slug) {
      const isSlug = await BlogCategories.findOne({ slug });
      if (!isSlug) {
        if (req.file) {
          deleteSingleFile(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: `Slug should be unique!`,
        });
      }
    }

    let categoryPic;
    if (req.file) {
      //Upload file to bunny
      const fileStream = fs.createReadStream(req.file.path);
      await uploadFileToBunny(bunnyFolderName, fileStream, req.file.filename);
      deleteSingleFile(req.file.path);
      categoryPic = {
        fileName: req.file.filename,
        url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`,
      };
      // Delete file from bunny
      if (categorie.categoryPic.fileName) {
        await deleteFileToBunny(
          bunnyFolderName,
          categorie.categoryPic.fileName
        );
      }
    }
    let data = {
      name,
      slug,
      description,
      sort_order,
      categoryPic,
      parentBlogCatagories,
    };

    // update
    await categorie.updateOne(data);
    res.status(200).json({
      success: true,
      message: "Categories updated successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteParentCategories = async (req, res) => {
  try {
    const _id = req.params.id;

    const parentCategorie = await ParentBlogCategories.findOne({ _id });
    if (!parentCategorie) {
      return res.status(400).json({
        success: false,
        message: `This parent categories is not present!`,
      });
    }

    const categories = await BlogCategories.find({
      parentBlogCatagories: parentCategorie._id,
    });
    for (let i = 0; i < categories.length; i++) {
      // Delete file from bunny
      if (categories[i].categoryPic.fileName) {
        await deleteFileToBunny(
          bunnyFolderName,
          categories[i].categoryPic.fileName
        );
      }
    }
    await BlogCategories.deleteMany({
      parentBlogCatagories: parentCategorie._id,
    });
    // Delete file from bunny
    if (parentCategorie.categoryPic.fileName) {
      await deleteFileToBunny(
        bunnyFolderName,
        parentCategorie.categoryPic.fileName
      );
    }

    // update
    await parentCategorie.deleteOne();
    res.status(200).json({
      success: true,
      message: "Parent categories deleted successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteCategories = async (req, res) => {
  try {
    const _id = req.params.id;

    const categorie = await BlogCategories.findOne({ _id });
    if (!categorie) {
      return res.status(400).json({
        success: false,
        message: `This categories is not present!`,
      });
    }

    // Delete file from bunny
    if (categorie.categoryPic.fileName) {
      await deleteFileToBunny(bunnyFolderName, categorie.categoryPic.fileName);
    }

    // update
    await categorie.deleteOne();
    res.status(200).json({
      success: true,
      message: "Categories deleted successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
