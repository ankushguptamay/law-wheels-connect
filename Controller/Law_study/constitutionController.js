const {
  articleValidation,
  articleUpdateValidation,
} = require("../../Middleware/Validation/lawStudyValidation");
const { Constitution } = require("../../Model/Law_Study/constitutionModel");

exports.addArticle = async (req, res) => {
  try {
    // Body Validation
    const { error } = articleValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { number, article_number, article_title } = req.body;
    const articles = await Constitution.findOne({
      $or: [{ number }, { article_number }, { article_title }],
    });
    if (articles) {
      return res.status(404).json({
        success: false,
        message: `Article should be uniqe!`,
      });
    }

    // Create Article
    await Constitution.create({ ...req.body });
    res.status(200).json({
      success: true,
      message: "Article added successfully!",
      data: { number, article_number, article_title },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getPart = async (req, res) => {
  try {
    const part = await Constitution.aggregate([
      {
        $group: {
          _id: "$part_number",
          part_number_romanise: { $first: "$part_number_romanise" },
          part_title: { $first: "$part_title" },
          chapter_title: { $first: "$chapter_title" },
          totalArticles: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          part_number: "$_id",
          part_number_romanise: 1,
          part_title: 1,
          chapter_title: 1,
          totalArticles: 1,
        },
      },
    ]);

    res.status(200).json({ success: true, data: part });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getChapterOrArticle = async (req, res) => {
  try {
    const chapters = await Constitution.find({
      part_number_romanise: req.params.part_number_romanise,
    });

    if (chapters.length < 1) {
      return (
        res.status(404),
        json({ success: false, message: "Zero articles in this part!" })
      );
    }

    let data = { part_number_romanise, part_title: chapters[0].part_title };
    let isChapters = false;
    if (chapters[0].chapter_title) {
      isChapters = true;
      const transformData = chapters.reduce((acc, current) => {
        const existingChapter = acc.find(
          (item) => item.chapter_number === current.chapter_number
        );
        if (existingChapter) {
          existingChapter.articles.push({
            article_type: current.article_type,
            _id: current._id,
            number: current.number,
            article_number: current.article_number,
            article_title: current.article_title,
          });
        } else {
          acc.push({
            chapter_number: current.chapter_number,
            chapter_title: current.chapter_title,
            articles: [
              {
                article_type: current.article_type,
                _id: current._id,
                number: current.number,
                article_number: current.article_number,
                article_title: current.article_title,
              },
            ],
          });
        }
        return acc;
      }, []);
      data = { ...data, chapters: transformData };
    } else {
      const articles = [];
      for (let i = 0; i < chapters.length; i++) {
        articles.push({
          article_type: current.article_type,
          _id: current._id,
          number: current.number,
          article_number: current.article_number,
          article_title: current.article_title,
        });
      }
    }

    res.status(200).json({ success: true, data, isChapters });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getArticleDetails = async (req, res) => {
  try {
    const { number, _id } = req.query;
    let query;
    if (number) {
      query = { number };
    } else if (_id) {
      query = { _id };
    } else {
      return res.status(404).json({
        success: false,
        message: "Please select article number or _id!",
      });
    }

    const articles = await Constitution.findOne(query).select(
      "_id part_number_romanise part_title chapter_number chapter_title article_type number article_number article_title article_content extras"
    );

    res.status(200).json({ success: true, data: articles });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateArticle = async (req, res) => {
  try {
    // Body Validation
    const { error } = articleUpdateValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const _id = req.params._id;
    const { article_number, article_title } = req.body;

    const articles = await Constitution.findById(_id);
    if (!articles) {
      return res.status(404).json({
        success: false,
        message: `This article is not present!`,
      });
    }

    // checking any copy
    if (
      article_number !== articles.article_number ||
      article_title !== articles.article_title
    ) {
      const isCopied = await Constitution.findOne({
        _id: { $ne: _id },
        $or: [{ article_number }, { article_title }],
      });
      if (isCopied) {
        return res.status(404).json({
          success: false,
          message: `Article Number or article should be uniqe!`,
        });
      }
    }

    // Create Article
    await articles.updateOne({ ...req.body });
    res.status(200).json({
      success: true,
      message: "Article updated successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteArticle = async (req, res) => {
  try {
    const _id = req.params._id;
    const articles = await Constitution.findById(_id);
    if (!articles) {
      return res.status(404).json({
        success: false,
        message: `This article is not present!`,
      });
    }

    // Create Article
    await articles.deleteOne();
    res.status(200).json({
      success: true,
      message: "Article deleted successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
