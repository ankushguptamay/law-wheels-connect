const { tagValidation } = require("../../Middleware/Validation/blogValidation");
const { BlogTag } = require("../../Model/Blog/tagsModel");

exports.addTag = async (req, res) => {
  try {
    // Body Validation
    const { error } = tagValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { slug, description, name } = req.body;

    const tag = await BlogTag.findOne({
      $or: [{ slug: slug }, { name: name }],
    });
    if (tag) {
      return res.status(400).json({
        success: false,
        message: `Name and slug should be unique!`,
      });
    }
    // Create this if not exist
    await BlogTag.create({ name, slug, description });
    res.status(200).json({
      success: true,
      message: "Tag created successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getTag = async (req, res) => {
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
    const [tags, totalTags] = await Promise.all([
      BlogTag.find(query)
        .sort({ name: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .lean(),
      BlogTag.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalTags / resultPerPage) || 0;

    res.status(200).json({
      success: true,
      message: "Tags fetched successfully!",
      data: tags,
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

exports.updateTag = async (req, res) => {
  try {
    // Body Validation
    const { error } = tagValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { slug, description, name } = req.body;
    const _id = req.params.id;

    const tag = await BlogTag.findOne({ _id });
    if (!tag) {
      return res.status(400).json({
        success: false,
        message: `This tag is not present!`,
      });
    }

    if (name !== tag.name) {
      const isName = await BlogTag.findOne({ name });
      if (isName) {
        return res.status(400).json({
          success: false,
          message: `This tag name is present!`,
        });
      }
    }

    if (slug !== tag.slug) {
      const isSlug = await BlogTag.findOne({ slug });
      if (isSlug) {
        return res.status(400).json({
          success: false,
          message: `This tag slug is present!`,
        });
      }
    }

    // Update
    await tag.updateOne({ name, slug, description });
    res.status(200).json({
      success: true,
      message: "Tag updated successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteTag = async (req, res) => {
  try {
    const _id = req.params.id;

    const tag = await BlogTag.findOne({ _id });
    if (!tag) {
      return res.status(400).json({
        success: false,
        message: `This tag is not present!`,
      });
    }

    // Delete
    await tag.deleteOne();
    res.status(200).json({
      success: true,
      message: "Tag deleted successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
