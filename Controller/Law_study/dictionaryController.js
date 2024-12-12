const {
  dictionaryWordValidation,
} = require("../../Middleware/Validation/lawStudyValidation");
const { Dictionaries } = require("../../Model/Law_Study/dictionaryModel");

exports.addDictionaryWord = async (req, res) => {
  try {
    // Body Validation
    const { error } = dictionaryWordValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { word, definition } = req.body;
    const dictionary = await Dictionaries.findOne({ word });
    if (dictionary) {
      return res.status(404).json({
        success: false,
        message: `${word} is already present in Law Wheels club dictionary!`,
      });
    }

    // Create Dictionaries
    await Dictionaries.create({ word, definition });
    res.status(200).json({
      success: true,
      message: "Word added successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteDictionaryWord = async (req, res) => {
  try {
    const _id = req.params.id;
    const dictionary = await Dictionaries.findOne({ _id });
    if (!dictionary) {
      return res.status(404).json({
        success: false,
        message: `This word is not present in Law Wheels club dictionary!`,
      });
    }

    // Create Dictionaries
    await dictionary.deleteOne();
    res.status(200).json({
      success: true,
      message: `The ${dictionary.word} has been successfully removed from the Law Wheels Club dictionary!`,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateDictionaryWord = async (req, res) => {
  try {
    const _id = req.params.id;
    // Body Validation
    const { error } = dictionaryWordValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { definition } = req.body;
    // Find in database
    const dictionary = await Dictionaries.findOne({ _id });
    if (!dictionary) {
      return res.status(404).json({
        success: false,
        message: `This word is not present in Law Wheels club dictionary!`,
      });
    }

    // Create Dictionaries
    await dictionary.updateOne({ definition });
    res.status(200).json({
      success: true,
      message: `The ${dictionary.word} has been successfully removed from the Law Wheels Club dictionary!`,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getDictionary = async (req, res) => {
  try {
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    const { search, firstLetter, isLegal, isDefinition } = req.query;

    //Search
    let query = { $and: [] };
    if (firstLetter) {
      const startWith = new RegExp("^" + firstLetter.toLowerCase(), "i");
      query.$and.push({ word: startWith });
    }
    if (search) {
      const containInString = new RegExp(search.toLowerCase(), "i");
      if (isLegal == "true") {
        query.$and.push({ word: containInString });
      } else if (isDefinition == "true") {
        query.$and.push({ definition: containInString });
      } else {
        query.$and.push({
          $or: [{ word: containInString }, { definition: containInString }],
        });
      }
    }

    // Remove $and if no conditions were added
    if (query.$and.length === 0) {
      delete query.$and;
    }

    const [words, totalWord] = await Promise.all([
      Dictionaries.find(query)
        .sort({ word: 1 })
        .select("_id word definition")
        .skip(skip)
        .limit(resultPerPage)
        .lean(),
      Dictionaries.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalWord / resultPerPage) || 0;
    res.status(200).json({
      success: true,
      message: "Dictionary word fetched successfully!",
      data: words,
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

exports.getWordDetails = async (req, res) => {
  try {
    const _id = req.params.id;
    const dictionary = await Dictionaries.findOne({ _id }).select(
      "-id word definition"
    );
    if (!dictionary) {
      return res.status(404).json({
        success: false,
        message: `This word is not present in Law Wheels club dictionary!`,
      });
    }

    res.status(200).json({
      success: true,
      message: `${dictionary.word} details fetched successfully!`,
      data: dictionary,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
