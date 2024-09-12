const {
  sloteValidation,
  sloteForUserValidation,
} = require("../../../Middleware/Validation/userValidation");
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

    const { timeInMin, date, times } = req.body;
    const yesterday = new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000);
    const dateInMiliSecond = new Date(date).getTime();

    if (dateInMiliSecond <= yesterday) {
      return res.status(400).send({
        success: false,
        message: `${date[i]} date is not acceptable!`,
      });
    }

    for (let i = 0; i < times.length; i++) {
      const slote = await Slot.findOne({
        advocate: req.user._id,
        time: times[i],
        date: date,
      });
      if (!slote) {
        const otp = generateFixedLengthRandomNumber(
          process.env.OTP_DIGITS_LENGTH
        );
        await Slot.create({
          advocate: req.user._id,
          time: times[i],
          date: new Date(date),
          password: otp,
          timeInMin,
        });
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

exports.deleteSlote = async (req, res) => {
  try {
    const _id = req.params.id;
    const slote = await Slot.findById(_id);
    if (!slote) {
      return res.status(400).json({
        success: false,
        message: "This slote is not present!",
      });
    }
    if (slote.isBooked) {
      slote.isDelete = true;
      slote.deleted_at = new Date();
      await slote.save();
    } else {
      await slote.deleteOne();
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

// This API only work when user , advocate call happened
exports.deactivateSlote = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Please enter OTP!",
      });
    }
    const _id = req.params.id;
    const slote = await Slot.findById(_id);
    if (!slote) {
      return res.status(400).json({
        success: false,
        message: "This slote is not present!",
      });
    }

    if (parseInt(slote.password) !== parseInt(password)) {
      return res.status(400).json({
        success: false,
        message: "Wrong password!",
      });
    }
    slote.isActive = false;
    await slote.save();
    res.status(200).json({
      success: true,
      message: "Deactivated successfully!",
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
    const { date, start_date, end_date, isBooked, notBooked } = req.query;
    const _id = req.user._id;
    const yesterday = new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000);
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

    if (isBooked) {
      query.$and.push({ isBooked: isBooked });
    } else if (notBooked) {
      query.$and.push({ isBooked: false });
    }

    const slot = await Slot.find(query).populate("client", "name profilePic");

    const transformData = slot.reduce((acc, current) => {
      // Find if the date already exists in the accumulator
      const existingDate = acc.find((item) => item.date === current.date);
      if (existingDate) {
        existingDate.slotes.push({
          isBooked: current.isBooked,
          _id: current._id,
          time: current.time,
          timeInMin: current.timeInMin,
          isActive: current.isActive,
          createdAt: current.createdAt,
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
              isActive: current.isActive,
              createdAt: current.createdAt,
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
    const sloteId = req.params.id;

    // Check is this slot present
    const slot = await Slot.findOne({ _id: sloteId, isDelete: false });
    if (!slot) {
      return res.status(400).send({
        success: false,
        message: `This slot is not present!`,
      });
    }
    // Check is date have been passed
    const yesterday = new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000);
    const dateInMiliSecond = new Date(slot.date).getTime();
    if (dateInMiliSecond <= yesterday) {
      return res.status(400).send({
        success: false,
        message: `You can not book this slote!`,
      });
    }
    // Check Slot time
    const today = new Date();
    today.setMinutes(today.getMinutes() + 330);
    const isToday = today.toDateString() === new Date(slot.date).toDateString();
    if (isToday) {
      const date = `${slot.date.toISOString().slice(0, 10)}T${
        slot.time
      }:00.000Z`;
      const inMiliSecond = new Date(date).getTime();
      if (inMiliSecond <= today.getTime()) {
        return res.status(400).send({
          success: false,
          message: `You can not book a past slot!`,
        });
      }
    }
    // Check is this slot available
    if (slot.isActive && !slot.isBooked) {
      slot.client = req.user._id;
      slot.isBooked = true;
      await slot.save();
    } else {
      return res.status(400).send({
        success: false,
        message: `This slote have been booked!`,
      });
    }
    res.status(200).json({
      success: true,
      message: "Booked!",
    });
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
    const yesterday = new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000);
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

    const slot = await Slot.find(query).populate("advocate", "name profilePic");

    const transformData = slot.reduce((acc, current) => {
      // Find if the date already exists in the accumulator
      const existingDate = acc.find((item) => item.date === current.date);
      if (existingDate) {
        existingDate.slotes.push({
          isBooked: current.isBooked,
          password: current.password,
          _id: current._id,
          time: current.time,
          timeInMin: current.timeInMin,
          isActive: current.isActive,
          createdAt: current.createdAt,
          advocate: current.advocate
            ? {
                _id: current.advocate._id,
                name: current.advocate.name,
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
              isActive: current.isActive,
              createdAt: current.createdAt,
              advocate: {
                _id: current.advocate._id,
                name: current.advocate.name,
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
      "name profilePic"
    );
    if (!slot) {
      return res.status(400).send({
        success: false,
        message: `This slote is not present!`,
      });
    }
    const transformData = {
      isBooked: slot.isBooked,
      _id: slot._id,
      time: slot.time,
      password: slot.password,
      timeInMin: slot.timeInMin,
      isActive: slot.isActive,
      createdAt: slot.createdAt,
      advocate: {
        _id: slot.advocate._id,
        name: slot.advocate.name,
        avatar: slot.advocate.profilePic.url
          ? slot.advocate.profilePic.url
          : null,
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

exports.sloteForUser = async (req, res) => {
  try {
    // Body Validation
    const { error } = sloteForUserValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { advocate, date } = req.body;

    const query = {
      $and: [{ advocate: advocate }, { isDelete: false }],
    };

    // Filter

    const yesterday = new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000);
    if (date) {
      // Check is date have been passed
      const dateInMiliSecond = new Date(date).getTime();
      if (dateInMiliSecond <= yesterday) {
        return res.status(400).send({
          success: false,
          message: `This date is not allowed!`,
        });
      }
      query.$and.push({ date: new Date(date) });
    } else {
      query.$and.push({ date: { $gt: yesterday } });
    }

    const slot = await Slot.find(query);

    const transformData = slot.reduce((acc, current) => {
      // Find if the date already exists in the accumulator
      const existingDate = acc.find((item) => item.date === current.date);
      if (existingDate) {
        existingDate.slotes.push({
          isBooked: current.isBooked,
          _id: current._id,
          time: current.time,
          timeInMin: current.timeInMin,
          isActive: current.isActive,
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
              isActive: current.isActive,
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
