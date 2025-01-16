const {
  sloteValidation,
  sloteForUserValidation,
  bookSloteValidation,
  cancelSloteValidation,
  rescheduleSloteValidation,
} = require("../../../Middleware/Validation/userValidation");
const {
  AdvocateReview,
} = require("../../../Model/User/Review/advocateReviewModel");
const { Slot } = require("../../../Model/User/Slot/slotModel");
const { generateFixedLengthRandomNumber } = require("../../../Util/otp");

exports.createSlote = async (req, res) => {
  try {
    // Body Validation
    const { error } = sloteValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { timeInMin, startDate, endDate, times, serviceType } = req.body;
    // Date validation
    const todayIST = new Date();
    todayIST.setMinutes(todayIST.getMinutes() + 330);
    for (let i = 0; i < times.length; i++) {
      if (
        new Date(`${startDate}T${times[i]}:00.000Z`).getTime() <
        todayIST.getTime()
      ) {
        return res.status(400).send({
          success: false,
          message: "Please select appropriate date!",
        });
      }
    }

    // Create array of dates
    function getDifferenceInDays(date1, date2) {
      const timeDiff = Math.abs(new Date(date2) - new Date(date1));
      const diffInDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      return diffInDays;
    }
    const noOfDate = getDifferenceInDays(startDate, endDate) + 1;
    const dates = [];
    for (i = 0; i < noOfDate; i++) {
      const today = new Date(startDate);
      today.setDate(today.getDate() + i);
      dates.push(today.toISOString().slice(0, 10));
    }

    // Checking over lapping
    const newTimeSlot = [];
    const runningTimeSlotonDatabase = [];
    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
    const runningTimeSlots = await Slot.find({
      advocate: req.user._id,
      date: { $gte: startOfDay },
    }).select("_id date time timeInMin");
    for (let i = 0; i < runningTimeSlots.length; i++) {
      runningTimeSlotonDatabase.push({
        startTimeInMili: new Date(
          `${new Date(runningTimeSlots[i].date).toISOString().slice(0, 10)}T${
            runningTimeSlots[i].time
          }:00.000Z`
        ).getTime(),
        endTimeInMili:
          new Date(
            `${new Date(runningTimeSlots[i].date).toISOString().slice(0, 10)}T${
              runningTimeSlots[i].time
            }:00.000Z`
          ).getTime() +
          parseInt(runningTimeSlots[i].timeInMin) * 60 * 1000,
      });
    }
    for (let i = 0; i < dates.length; i++) {
      for (let j = 0; j < times.length; j++) {
        newTimeSlot.push({
          newStartTimeInMili: new Date(
            `${dates[i]}T${times[j]}:00.000Z`
          ).getTime(),
          newEndTimeInMili:
            new Date(`${dates[i]}T${times[j]}:00.000Z`).getTime() +
            parseInt(timeInMin) * 60 * 1000,
        });
      }
    }
    const isOverlapping = newTimeSlot.some((newSlot) =>
      runningTimeSlotonDatabase.some(
        (runningSlot) =>
          newSlot.newStartTimeInMili < runningSlot.endTimeInMili &&
          newSlot.newEndTimeInMili > runningSlot.startTimeInMili
      )
    );
    if (isOverlapping) {
      return res.status(400).send({
        success: false,
        message:
          "You already have a slot at this time frame. Please check your existing slots!",
      });
    }

    // Create
    for (let i = 0; i < dates.length; i++) {
      for (let j = 0; j < times.length; j++) {
        const otp = generateFixedLengthRandomNumber(
          process.env.OTP_DIGITS_LENGTH
        );
        await Slot.findOneAndUpdate(
          { advocate: req.user._id, time: times[j], date: new Date(dates[i]) },
          { updatedAt: new Date(), password: otp, timeInMin, serviceType },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    }

    res.status(200).json({
      success: true,
      message: "Created successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deactivateSlote = async (req, res) => {
  try {
    const { password } = req.body;
    const _id = req.params.id;
    const slote = await Slot.findById(_id);
    if (!slote) {
      return res.status(400).json({
        success: false,
        message: "This slote is not present!",
      });
    }
    if (slote.isBooked) {
      if (slote.status === "Upcoming" || slote.status === "Missed") {
        if (!password) {
          return res.status(400).json({
            success: false,
            message: "Please enter OTP!",
          });
        } else {
          if (parseInt(slote.password) !== parseInt(password)) {
            return res.status(400).json({
              success: false,
              message: "Wrong password!",
            });
          } else {
            slote.status = "Deactivated";
            await slote.save();
          }
        }
      } else {
        slote.status = "Deactivated";
        await slote.save();
      }
    } else {
      slote.status = "Deactivated";
      await slote.save();
    }

    res.status(200).json({
      success: true,
      message: "Deleted successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.mySloteForAdvocate = async (req, res) => {
  try {
    const { date, start_date, end_date, status, serviceType } = req.query;
    const _id = req.user._id;
    const yesterday = new Date();
    yesterday.setMinutes(yesterday.getMinutes() - 1110);
    const query = { $and: [{ advocate: _id }, { isDelete: false }] };

    // Filter
    if (date) {
      query.$and.push({ date: new Date(date) });
    } else if (start_date && end_date) {
      query.$and.push({
        date: { $gte: new Date(start_date), $lte: new Date(end_date) },
      });
    } else {
      query.$and.push({ date: { $gt: new Date(yesterday) } });
    }

    if (status) {
      query.$and.push({ status });
    }
    if (serviceType) {
      query.$and.push({ serviceType });
    }

    const slot = await Slot.find(query).populate("client", "name profilePic");

    const transformData = slot.reduce((acc, current) => {
      // Find if the date already exists in the accumulator
      const existingDate = acc.find(
        (item) =>
          new Date(item.date).toDateString() ===
          new Date(current.date).toDateString()
      );
      if (existingDate) {
        existingDate.slotes.push({
          isBooked: current.isBooked,
          _id: current._id,
          time: current.time,
          timeInMin: current.timeInMin,
          status: current.status,
          serviceType: current.serviceType,
          createdAt: current.createdAt,
          client_legal_issue: current.client_legal_issue,
          client: current.client
            ? {
                _id: current.client._id,
                name: current.client.name,
                avatar: current.client.profilePic.url
                  ? current.client.profilePic.url
                  : null,
              }
            : {},
        });
      } else {
        acc.push({
          date: current.date,
          slotes: [
            {
              isBooked: current.isBooked,
              _id: current._id,
              time: current.time,
              timeInMin: current.timeInMin,
              status: current.status,
              createdAt: current.createdAt,
              serviceType: current.serviceType,
              client_legal_issue: current.client_legal_issue,
              client: current.client
                ? {
                    _id: current.client._id,
                    name: current.client.name,
                    avatar: current.client.profilePic.url
                      ? current.client.profilePic.url
                      : null,
                  }
                : {},
            },
          ],
        });
      }

      return acc;
    }, []);
    res.status(200).json({
      success: true,
      message: `My slot fetched successfully!`,
      data: transformData,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.bookASlote = async (req, res) => {
  try {
    // Body Validation
    const { error } = bookSloteValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { sloteId, client_legal_issue } = req.body;

    // Check is this slot present
    const slot = await Slot.findOne({ _id: sloteId, isDelete: false });
    if (!slot) {
      return res.status(400).send({
        success: false,
        message: `This slot is not present!`,
      });
    }
    // Advocate cant book own slot
    if (slot.advocate.toString() == req.user._id.toString()) {
      return res.status(400).send({
        success: false,
        message: `You can not book your own slot!`,
      });
    }
    // Check is date have been passed
    const today = new Date();
    today.setMinutes(today.getMinutes() + 390); // 5.5 hours and 1 hours, user should book a slot 1 hour ahead of slot time
    const date = `${slot.date.toISOString().slice(0, 10)}T${slot.time}:00.000Z`;
    const inMiliSecond = new Date(date).getTime();
    if (inMiliSecond <= today.getTime()) {
      return res.status(400).send({
        success: false,
        message: `Booking Unavailable, Bookings need to be made at least 1 hour in advance!`,
      });
    }

    // Check is this slot available
    if (slot.status === "Vacant" && !slot.isBooked) {
      slot.client = req.user._id;
      slot.isBooked = true;
      slot.client_legal_issue = client_legal_issue;
      slot.status = "Upcoming";
      await slot.save();
      return res.status(200).json({
        success: true,
        message: "Booked!",
      });
    } else {
      return res.status(400).send({
        success: false,
        message: `This slote have been booked!`,
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.mySloteForUser = async (req, res) => {
  try {
    const { date, start_date, end_date } = req.query;
    const _id = req.user._id;
    const yesterday = new Date();
    yesterday.setMinutes(yesterday.getMinutes() - 1110);
    const query = {
      $and: [{ client: _id }, { isDelete: false }, { isBooked: true }],
    };

    // Filter
    if (date) {
      query.$and.push({ date: new Date(date) });
    } else if (start_date && end_date) {
      query.$and.push({
        date: { $gte: new Date(start_date), $lte: new Date(end_date) },
      });
    } else {
      query.$and.push({ date: { $gt: new Date(yesterday) } });
    }

    const slot = await Slot.find(query).populate(
      "advocate",
      "name profilePic headLine"
    );

    const transformData = slot.reduce((acc, current) => {
      // Find if the date already exists in the accumulator
      const existingDate = acc.find(
        (item) =>
          new Date(item.date).toDateString() ===
          new Date(current.date).toDateString()
      );
      if (existingDate) {
        existingDate.slotes.push({
          isBooked: current.isBooked,
          password: current.password,
          _id: current._id,
          time: current.time,
          timeInMin: current.timeInMin,
          status: current.status,
          serviceType: current.serviceType,
          client_legal_issue: current.client_legal_issue,
          createdAt: current.createdAt,
          advocate: current.advocate
            ? {
                _id: current.advocate._id,
                name: current.advocate.name,
                headLine: current.advocate.headLine,
                avatar: current.advocate.profilePic
                  ? current.advocate.profilePic.url
                  : null,
              }
            : {},
        });
      } else {
        acc.push({
          date: current.date,
          slotes: [
            {
              isBooked: current.isBooked,
              password: current.password,
              _id: current._id,
              time: current.time,
              timeInMin: current.timeInMin,
              status: current.status,
              serviceType: current.serviceType,
              createdAt: current.createdAt,
              client_legal_issue: current.client_legal_issue,
              advocate: {
                _id: current.advocate._id,
                name: current.advocate.name,
                headLine: current.advocate.headLine,
                avatar: current.advocate.profilePic.url
                  ? current.advocate.profilePic.url
                  : null,
              },
            },
          ],
        });
      }

      return acc;
    }, []);
    res.status(200).json({
      success: true,
      message: `My slot fetched successfully!`,
      data: transformData,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.sloteByIdForUser = async (req, res) => {
  try {
    const _id = req.params.id;
    const slot = await Slot.findOne({ _id, isDelete: false }).populate(
      "advocate",
      "name profilePic headLine"
    );
    if (!slot) {
      return res.status(400).send({
        success: false,
        message: `This slote is not present!`,
      });
    }

    // Review
    const rating = await AdvocateReview.aggregate([
      { $match: { isDelete: false, advocate: slot.advocate._id } },
      {
        $group: {
          _id: "$advocate",
          averageRating: { $avg: "$rating" }, // Calculate the average rating
          totalReviews: { $sum: 1 }, // Optional: Count total reviews
        },
      },
      {
        $project: { averageRating: 1, totalReviews: 1 },
      },
    ]);

    const transformData = {
      isBooked: slot.isBooked,
      _id: slot._id,
      date: slot.date,
      time: slot.time,
      password: slot.password,
      timeInMin: slot.timeInMin,
      status: slot.status,
      serviceType: slot.serviceType,
      client_legal_issue: slot.client_legal_issue,
      createdAt: slot.createdAt,
      advocate: {
        _id: slot.advocate._id,
        name: slot.advocate.name,
        headLine: slot.advocate.headLine,
        avatar: slot.advocate.profilePic.url
          ? slot.advocate.profilePic.url
          : null,
        totalReviews: rating[0] ? rating[0].totalReviews : null,
        averageRating: rating[0] ? rating[0].averageRating : null,
      },
    };
    res.status(200).json({
      success: true,
      message: `Slot details fetched successfully!`,
      data: transformData,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.sloteByIdForAdvocate = async (req, res) => {
  try {
    const _id = req.params.id;
    const slot = await Slot.findOne({ _id, isDelete: false }).populate(
      "client",
      "name profilePic"
    );
    if (!slot) {
      return res.status(400).send({
        success: false,
        message: `This slote is not present!`,
      });
    }
    console.log(slot);
    const transformData = {
      date: slot.date,
      isBooked: slot.isBooked,
      _id: slot._id,
      time: slot.time,
      timeInMin: slot.timeInMin,
      status: slot.status,
      serviceType: slot.serviceType,
      client_legal_issue: slot.client_legal_issue,
      createdAt: slot.createdAt,
      client: slot.client
        ? {
            _id: slot.client._id,
            name: slot.client.name,
            avatar: slot.client.profilePic.url
              ? slot.client.profilePic.url
              : null,
          }
        : {},
    };
    res.status(200).json({
      success: true,
      message: `Slot details fetched successfully!`,
      data: transformData,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.sloteForUser = async (req, res) => {
  try {
    const { date } = req.query;
    const advocate = req.params.advocate;

    const query = {
      $and: [{ advocate: advocate }, { isDelete: false }],
    };

    // Filter
    const yesterday = new Date();
    yesterday.setMinutes(yesterday.getMinutes() - 1110);
    const day = String(yesterday.getUTCDate()).padStart(2, "0");
    const month = String(yesterday.getUTCMonth() + 1).padStart(2, "0");
    const year = yesterday.getUTCFullYear();
    const defaultDate = new Date(`${year}-${month}-${day}`);
    if (date) {
      if (new Date(date).getTime() <= yesterday.getTime()) {
        return res.status(400).send({
          success: false,
          message: `This date is not allowed!`,
        });
      }
      query.$and.push({ date: new Date(date) });
    } else {
      query.$and.push({ date: { $gt: new Date(defaultDate) } });
    }

    const slot = await Slot.find(query);

    const transformData = slot.reduce((acc, current) => {
      // Find if the date already exists in the accumulator
      const existingDate = acc.find(
        (item) =>
          new Date(item.date).toDateString() ===
          new Date(current.date).toDateString()
      );
      if (existingDate) {
        existingDate.slotes.push({
          isBooked: current.isBooked,
          _id: current._id,
          time: current.time,
          timeInMin: current.timeInMin,
          status: current.status,
          serviceType: current.serviceType,
          createdAt: current.createdAt,
        });
      } else {
        acc.push({
          date: current.date,
          slotes: [
            {
              isBooked: current.isBooked,
              _id: current._id,
              time: current.time,
              timeInMin: current.timeInMin,
              status: current.status,
              serviceType: current.serviceType,
              createdAt: current.createdAt,
            },
          ],
        });
      }

      return acc;
    }, []);
    res.status(200).json({
      success: true,
      message: `Slot fetched successfully!`,
      data: transformData,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.cancelSloteForUser = async (req, res) => {
  try {
    // Body Validation
    const { error } = cancelSloteValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { sloteId } = req.body;

    // Check is this slot present
    const slot = await Slot.findOne({
      _id: sloteId,
      isDelete: false,
      status: "Upcoming",
      client: req.user._id,
    });
    if (!slot) {
      return res.status(400).send({
        success: false,
        message: `This slot is not booked by you!`,
      });
    }
    // Check is date have been passed
    const current = new Date();
    current.setMinutes(current.getMinutes() + 390); // 5.5 hours and 1 hours, user should cancel a slot 1 hour ahead of slot time
    const date = `${slot.date.toISOString().slice(0, 10)}T${slot.time}:00.000Z`;
    const inMiliSecond = new Date(date).getTime();
    if (inMiliSecond <= current.getTime()) {
      return res.status(400).send({
        success: false,
        message: `Can not cancel, Cancellation need to be made at least 1 hour in advance!`,
      });
    }

    slot.lastcancelClient = req.user._id;
    slot.isCancel = true;
    slot.isBooked = false;
    slot.client_legal_issue = null;
    slot.client = null;
    slot.status = "Vacant";
    await slot.save();
    return res.status(200).json({
      success: true,
      message: "Cancelled successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.rescheduleSloteForUser = async (req, res) => {
  try {
    // Body Validation
    const { error } = rescheduleSloteValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { oldSloteId, newSloteId } = req.body;

    // Check is this slot present
    const oldSlot = await Slot.findOne({
      _id: oldSloteId,
      isDelete: false,
      status: "Upcoming",
      client: req.user._id,
    });
    if (!oldSlot) {
      return res.status(400).send({
        success: false,
        message: `This slot is not booked by you!`,
      });
    }
    // Check is Time validation
    const current = new Date();
    current.setMinutes(current.getMinutes() + 390); // 5.5 hours and 1 hours, user should reschedule a slot 1 hour ahead of slot time
    const oldDate = `${oldSlot.date.toISOString().slice(0, 10)}T${
      oldSlot.time
    }:00.000Z`;
    const inMiliSecondOld = new Date(oldDate).getTime();
    if (inMiliSecondOld <= current.getTime()) {
      return res.status(400).send({
        success: false,
        message: `Can not reschedule, Reschedule need to be made at least 1 hour in advance!`,
      });
    }

    // Check is this slot present
    const newSlot = await Slot.findOne({ _id: newSloteId, isDelete: false });
    if (!newSlot) {
      return res.status(400).send({
        success: false,
        message: `This slot is not present!`,
      });
    }
    // Check is Time validation
    const newDate = `${newSlot.date.toISOString().slice(0, 10)}T${
      newSlot.time
    }:00.000Z`;
    const inMiliSecondNew = new Date(newDate).getTime();
    if (inMiliSecondNew <= current.getTime()) {
      return res.status(400).send({
        success: false,
        message: `Booking Unavailable, Bookings need to be made at least 1 hour in advance!`,
      });
    }

    // Check is this slot available
    if (newSlot.status === "Vacant" && !newSlot.isBooked) {
      newSlot.client = req.user._id;
      newSlot.isBooked = true;
      newSlot.client_legal_issue = oldSlot.client_legal_issue;
      newSlot.status = "Upcoming";

      oldSlot.client = null;
      oldSlot.isBooked = false;
      oldSlot.client_legal_issue = null;
      oldSlot.status = "Vacant";
      oldSlot.lastcancelClient = req.user._id;
      oldSlot.isCancel = true;

      await newSlot.save();
      await oldSlot.save();
      return res.status(200).json({
        success: true,
        message: "Reschedule successfully!",
      });
    } else {
      return res.status(400).send({
        success: false,
        message: `This slote have been booked!`,
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.countSlot = async (req, res) => {
  try {
    const advocate = req.user._id;

    const [totalSlot, completedSlot, missedSlot, upcomingSlot] =
      await Promise.all([
        Slot.countDocuments({
          $and: [{ advocate }, { isDelete: false }],
        }),
        Slot.countDocuments({
          $and: [{ advocate }, { isDelete: false }, { status: "Completed" }],
        }),
        Slot.countDocuments({
          $and: [{ advocate }, { isDelete: false }, { status: "Missed" }],
        }),
        Slot.countDocuments({
          $and: [{ advocate }, { isDelete: false }, { status: "Upcoming" }],
        }),
      ]);

    res.status(200).json({
      success: true,
      data: { totalSlot, completedSlot, missedSlot, upcomingSlot },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
