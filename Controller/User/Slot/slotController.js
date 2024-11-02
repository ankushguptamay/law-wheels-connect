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
    const today = new Date();
    today.setMinutes(today.getMinutes() + 330);
    const date = `${slot.date.toISOString().slice(0, 10)}T${slot.time}:00.000Z`;
    const inMiliSecond = new Date(date).getTime();
    if (inMiliSecond <= today.getTime()) {
      return res.status(400).send({
        success: false,
        message: `You can not book a past slot!`,
      });
    }

    // Check is this slot available
    if (slot.status === "Vacant" && !slot.isBooked) {
      slot.client = req.user._id;
      slot.isBooked = true;
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
          status: current.status,
          serviceType: current.serviceType,
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
              status: current.status,
              serviceType: current.serviceType,
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
      status: slot.status,
      serviceType: slot.serviceType,
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
