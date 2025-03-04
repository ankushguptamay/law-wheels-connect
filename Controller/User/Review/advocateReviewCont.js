const mongoose = require("mongoose");
const {
  validateAdvocateReview,
  validateNotGiveReview,
  validateUpdateAdvocateReview,
  validateDeleteAdvocateReviewMessage,
} = require("../../../Middleware/Validation/reviewValidation");
const {
  AdvocateReview,
} = require("../../../Model/User/Review/advocateReviewModel");
const { Slot } = require("../../../Model/User/Slot/slotModel");
const { User } = require("../../../Model/User/userModel");

const updateAverageRating = async (advocate) => {
  try {
    const rating = await AdvocateReview.aggregate([
      {
        $match: {
          isDelete: false,
          advocate: new mongoose.Types.ObjectId(advocate),
        },
      },
      { $group: { _id: "$advocate", averageRating: { $avg: "$rating" } } },
      { $project: { _id: 0, averageRating: 1 } },
    ]);
    // New Average rating
    const averageRating =
      Array.isArray(rating) && rating.length > 0
        ? Math.round(rating[0].averageRating * 10) / 10
        : 0;

    await User.updateOne({ _id: advocate }, { $set: { averageRating } });
  } catch (error) {
    console.log(error);
  }
};

exports.giveAdvocateReviews = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateAdvocateReview(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { rating, message, advocate } = req.body;
    const client = req.user._id;

    // Check Is user take any service from advocate or not
    const anySlot = await Slot.findOne({
      advocate,
      client,
      $or: [
        { reviewGiven: { $exists: true, $eq: null } },
        { reviewGiven: { $exists: false } },
      ],
    });
    if (!anySlot) {
      return res.status(400).json({
        success: false,
        message: "You can not give review to this advocate!",
      });
    }

    // Check is any review present
    const review = await AdvocateReview.findOne({
      client,
      advocate,
      isDelete: false,
    });

    if (review) {
      const newMessage = review.messages;
      if (message) {
        newMessage.push({ createdAt: new Date(), message, givenBy: client });
      }
      review.rating = rating;
      review.messages = newMessage;
      await review.save();
    } else {
      if (message) {
        await AdvocateReview.create({
          rating,
          messages: { message, givenBy: client, createdAt: new Date() },
          advocate,
          client,
        });
      } else {
        await AdvocateReview.create({
          rating,
          advocate,
          client,
        });
      }
    }

    // Update Average rating of advocate
    updateAverageRating(advocate);

    // Update Slot
    await Slot.updateMany(
      {
        advocate,
        client,
        $or: [
          { reviewGiven: { $exists: true, $eq: null } }, // Field exists and is null
          { reviewGiven: { $exists: false } }, // Field does not exist
        ],
      },
      { $set: { reviewGiven: true } } // Use $set to update the field
    );
    res.status(200).json({
      success: true,
      message: "Thanks to give review!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.notGiveAdvocateReviews = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateNotGiveReview(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { advocate } = req.body;
    const client = req.user._id;
    // Update Slot
    await Slot.updateMany(
      {
        advocate,
        client,
        $or: [
          { reviewGiven: { $exists: true, $eq: null } },
          { reviewGiven: { $exists: false } },
        ],
      },
      { $set: { reviewGiven: false } }
    );
    res.status(200).json({
      success: true,
      message: "Successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateAdvocateReviewsByUser = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateUpdateAdvocateReview(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { reviewId, rating, message } = req.body;
    const client = req.user._id;

    const review = await AdvocateReview.findOne({
      _id: reviewId,
      client,
      isDelete: false,
    });
    if (!review) {
      return res.status(400).json({
        success: false,
        message: "This review is not present!",
      });
    }

    let newMessage = [];
    let messageId;
    // Checking Is any message present which is not passed 15min in future
    const currentTime = new Date().getTime();
    for (let i = 0; i < review.messages.length; i++) {
      const createdTime =
        new Date(review.messages[i].createdAt).getTime() + 15 * 60 * 1000; // added 15 min
      if (currentTime < createdTime) {
        if (review.messages[i].givenBy.toString() == client.toString()) {
          messageId = review.messages[i]._id;
        }
      }
    }
    // If messageId present
    if (messageId) {
      for (let i = 0; i < review.messages.length; i++) {
        if (review.messages[i]._id.toString() == messageId.toString()) {
          // message is present then message going to update in record other its gonna remove from record
          if (message) {
            newMessage.push({
              _id: review.messages[i]._id,
              createdAt: review.messages[i].createdAt,
              message: message,
              givenBy: review.messages[i].givenBy,
            });
          }
        } else {
          newMessage.push({
            _id: review.messages[i]._id,
            createdAt: review.messages[i].createdAt,
            message: review.messages[i].message,
            givenBy: review.messages[i].givenBy,
          });
        }
      }
    } else {
      const updatedTime = new Date(review.updatedAt).getTime() + 15 * 60 * 1000; // added 15 min
      if (currentTime < updatedTime) {
        newMessage = review.messages;
        if (message) {
          newMessage.push({
            createdAt: new Date(),
            message,
            givenBy: client,
          });
        }
      } else {
        return res.status(400).json({
          success: true,
          message: "You can only update a message 15 minute in future!",
        });
      }
    }

    // Prevent review updation time to change because if it will change then user can update a review with in 15min many time
    const updatedAt = review.updatedAt;
    review.rating = rating;
    review.messages = newMessage;
    review.updatedAt = updatedAt;
    await review.save();

    // Update Average rating of advocate
    updateAverageRating(review.advocate);

    // Update Slot
    await Slot.updateMany(
      {
        advocate: review.advocate,
        client,
        $or: [
          { reviewGiven: { $exists: true, $eq: null } }, // Field exists and is null
          { reviewGiven: { $exists: false } }, // Field does not exist
        ],
      },
      { $set: { reviewGiven: true } } // Use $set to update the field
    );
    res.status(200).json({
      success: true,
      message: "Review updated!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteAdvocateReviewMessageByUser = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateDeleteAdvocateReviewMessage(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { reviewId } = req.body;
    const client = req.user._id;

    const review = await AdvocateReview.findOne({
      _id: reviewId,
      client,
      isDelete: false,
    });
    if (!review) {
      return res.status(400).json({
        success: false,
        message: "This review is not present!",
      });
    }

    let newMessage = [];
    let messageId;
    // Checking Is any message present which is not passed 15min in future
    const currentTime = new Date().getTime();
    for (let i = 0; i < review.messages.length; i++) {
      const createdTime =
        new Date(review.messages[i].createdAt).getTime() + 15 * 60 * 1000; // added 15 min
      if (currentTime < createdTime) {
        if (review.messages[i].givenBy.toString() == client.toString()) {
          messageId = review.messages[i]._id;
        }
      }
    }
    // If messageId present
    if (messageId) {
      for (let i = 0; i < review.messages.length; i++) {
        if (review.messages[i]._id.toString() == messageId.toString()) {
          // Going to remove
        } else {
          newMessage.push({
            _id: review.messages[i]._id,
            createdAt: review.messages[i].createdAt,
            message: review.messages[i].message,
            givenBy: review.messages[i].givenBy,
          });
        }
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "You can only delete a message 15 minute in future!",
      });
    }

    // Review update time going to be same
    const updatedAt = review.updatedAt;
    review.messages = newMessage;
    review.updatedAt = updatedAt;
    await review.save();

    // Update Average rating of advocate
    updateAverageRating(review.advocate);

    res.status(200).json({
      success: true,
      message: "Message deleted!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteAdvocateReviewByUser = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateDeleteAdvocateReviewMessage(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { reviewId } = req.body;
    const client = req.user._id;

    const review = await AdvocateReview.findOne({
      _id: reviewId,
      client,
      isDelete: false,
    });
    if (!review) {
      return res.status(400).json({
        success: false,
        message: "This review is not present!",
      });
    }
    // Check Is user take any service from advocate or not
    const anySlot = await Slot.findOne({
      advocate: review.advocate,
      client,
      $or: [
        { reviewGiven: { $exists: true, $eq: null } },
        { reviewGiven: { $exists: false } },
      ],
    });
    if (anySlot) {
      await review.updateOne({ isDelete: true, deleted_at: new Date() }); // Soft delete
      // Update Slot
      await Slot.updateMany(
        {
          advocate,
          client,
          $or: [
            { reviewGiven: { $exists: true, $eq: null } }, // Field exists and is null
            { reviewGiven: { $exists: false } }, // Field does not exist
          ],
        },
        { $set: { reviewGiven: true } } // Use $set to update the field
      );
    } else {
      const currentTime = new Date().getTime();
      const updatedTime = new Date(review.updatedAt).getTime() + 15 * 60 * 1000; // added 15 min
      if (currentTime < updatedTime) {
        await review.updateOne({ isDelete: true, deleted_at: new Date() });
      } else {
        return res.status(400).json({
          success: false,
          message: "You can only delete a review 15 minute in future!",
        });
      }
    }

    // Update Average rating of advocate
    updateAverageRating(review.advocate);

    res.status(200).json({
      success: true,
      message: "Review deleted!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getAdvocateReviewForAdvocate = async (req, res) => {
  try {
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    const advocate = await AdvocateReview.aggregate([
      { $match: { isDelete: false, advocate: new mongoose.Types.ObjectId(req.user._id) } },
      {
        $group: {
          _id: "$advocate", // Group by advocate ID
          averageRating: { $avg: "$rating" }, // Calculate the average rating
          totalReviews: { $sum: 1 }, // Optional: Count total reviews
        },
      },
      { $project: { _id: 1, averageRating: 1, totalReviews: 1 } },
    ]);

    let query = { $and: [{ isDelete: false }, { advocate: req.user._id }] };

    const [reviews, totalReview] = await Promise.all([
      AdvocateReview.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .populate("client", "_id name profilePic")
        .populate("messages.givenBy", "_id name profilePic")
        .lean(),
      AdvocateReview.countDocuments(query),
    ]);

    const transformData = reviews.map(
      ({ _id, messages, rating, isDelete, client, createdAt, updatedAt }) => {
        const newMessage = messages.map(
          ({ givenBy, _id, message, createdAt }) => {
            const profilePic = givenBy.profilePic
              ? givenBy.profilePic.url
              : null;
            return {
              givenBy: { ...givenBy, profilePic },
              _id,
              message,
              createdAt,
            };
          }
        );
        return {
          _id,
          rating,
          messages: newMessage,
          client: {
            _id: client._id,
            name: client.name,
            profilePic: client.profilePic ? client.profilePic.url : null,
          },
          isDelete,
          createdAt,
          updatedAt,
        };
      }
    );

    res.status(200).json({
      success: true,
      totalPages: Math.ceil(totalReview / resultPerPage) || 0,
      currentPage: page,
      data: { ...advocate[0], feedBack: transformData },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getAdvocateReviewForUser = async (req, res) => {
  try {
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    const advocate = await AdvocateReview.aggregate([
      {
        $match: {
          isDelete: false,
          advocate: new mongoose.Types.ObjectId(req.params.id),
        },
      },
      {
        $group: {
          _id: "$advocate", // Group by advocate ID
          averageRating: { $avg: "$rating" }, // Calculate the average rating
          totalReviews: { $sum: 1 }, // Optional: Count total reviews
        },
      },
      { $project: { _id: 1, averageRating: 1, totalReviews: 1 } },
    ]);
    console.log(advocate);
    let query = { $and: [{ isDelete: false }, { advocate: req.params.id }] };

    const [reviews, totalReview] = await Promise.all([
      AdvocateReview.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .populate("client", "_id name profilePic")
        .populate("messages.givenBy", "_id name profilePic")
        .lean(),
      AdvocateReview.countDocuments(query),
    ]);

    const transformData = reviews.map(
      ({ _id, messages, rating, isDelete, client, createdAt, updatedAt }) => {
        const newMessage = messages.map(
          ({ givenBy, _id, message, createdAt }) => {
            const profilePic = givenBy.profilePic
              ? givenBy.profilePic.url
              : null;
            return {
              givenBy: { ...givenBy, profilePic },
              _id,
              message,
              createdAt,
            };
          }
        );
        return {
          _id,
          rating,
          messages: newMessage,
          client: {
            _id: client._id,
            name: client.name,
            profilePic: client.profilePic ? client.profilePic.url : null,
          },
          isDelete,
          createdAt,
          updatedAt,
        };
      }
    );

    res.status(200).json({
      success: true,
      totalPages: Math.ceil(totalReview / resultPerPage) || 0,
      currentPage: page,
      data: { ...advocate[0], feedBack: transformData },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
