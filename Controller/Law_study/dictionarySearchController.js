const {
  DictionarySearchs,
} = require("../../Model/Law_Study/dictionarySearchModel");

exports.addWordInSearch = async (req, res) => {
  try {
    const { wordId } = req.body;
    if (!wordId) {
      return res
        .status(400)
        .json({ success: false, message: "Please select a word!" });
    }
    // Search is this word present in record or not
    const search = await DictionarySearchs.findOne({
      word: wordId,
      user: req.user._id,
    });

    if (search) {
      search.updatedAt = new Date();
      await search.save();
    } else {
      const allSearch = await DictionarySearchs.countDocuments({
        user: req.user._id,
      });
      if (parseInt(allSearch) > 11) {
        await DictionarySearchs.findOneAndDelete({ user: req.user._id }).sort({
          updatedAt: -1,
        });
      }
      await DictionarySearchs.create({ word: wordId, user: req.user._id });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.myRecentWordSearchs = async (req, res) => {
  try {
    const search = await DictionarySearchs.find({
      user: req.user._id,
    }).sort({ updatedAt: 1 });

    res.status(200).json({ success: true, data: search });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.popularWordSearchs = async (req, res) => {
  try {
    // 24 Hours
    const last24Hours = new Date();
    last24Hours.setDate(last24Hours.getDate() - 1);

    const popularSearches = await DictionarySearchs.aggregate([
      { $match: { updatedAt: { $gte: last24Hours } } },
      { $group: { _id: "$word", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 12 }, // only 20 popular search
      {
        $lookup: {
          from: "dictionaries",
          localField: "_id", // Grouped 'word' field
          foreignField: "_id", // Matching field in Dictionaries
          as: "wordDetails",
        },
      },
      { $unwind: "$wordDetails" },
      {
        $project: {
          _id: 1,
          word: "$wordDetails.word",
          definition: "$wordDetails.definition",
          count: 1,
        },
      },
    ]);

    res.status(200).json({ success: true, data: popularSearches });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
