const {
  connectionRequest,
  getMyConnection,
  acceptConnect,
} = require("../../../Middleware/Validation/userValidation");
const {
  Connection,
} = require("../../../Model/User/Connection/connectionModel");
const { NEW_CONNECTION, INVITATION_ACCEPTED, emitEvent } = require("../../../Util/event");

exports.sendConnectionRequest = async (req, res) => {
  try {
    // Body Validation
    const { error } = connectionRequest(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { userId } = req.body;

    const connection = await Connection.findOne({
      $or: [
        { sender: req.user, receiver: userId },
        { sender: userId, receiver: req.user },
      ],
    });
    if (connection) {
      if (connection.status === "pending") {
        return res.status(400).json({
          success: true,
          message: "Connection request already present!",
        });
      } else if (
        connection.status === "accepted" ||
        connection.status === "rejected"
      ) {
        return res.status(400).json({
          success: true,
          message: "Already connected!",
        });
      }
    }

    await Connection.create({
      sender: req.user._id,
      receiver: userId,
    });

    emitEvent(req, NEW_CONNECTION, [userId]);

    res.status(200).json({
      success: true,
      message: "Followed successfully!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getMyConnection = async (req, res) => {
  try {
    // Body Validation
    const { error } = getMyConnection(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { status, search } = req.query;

    // pagination
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    let query = {
      receiver: req.user._id,
      status: status,
    };
    if (search) {
      const containInString = new RegExp(req.query.search, "i");
      query = {
        receiver: req.user._id,
        status: status,
        "sender.name": containInString,
      };
    }

    const [connections, totalConnections] = await Promise.all([
      Connection.find(query)
        .sort({ name: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .lean()
        .populate("sender", "name profilePic"),
      Connection.countDocuments(query),
    ]);

    const allConnection = connections.map(({ _id, sender }) => ({
      _id,
      sender: {
        _id: sender._id,
        name: sender.name,
        profilePic: sender.profilePic ? sender.profilePic.url : null,
      },
    }));

    const totalPages = Math.ceil(totalConnections / resultPerPage) || 0;

    return res.status(200).json({
      success: true,
      data: allConnection,
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

exports.acceptConnect = async (req, res) => {
  try {
    // Validate Body
    const { error } = acceptConnect(req.body);
    if (error) {
      return res.status(400).send(error.details[0].message);
    }
    const { accept, connectId } = req.body;
    const { _id } = req.user;
    const connecte = await Connection.findOne({
      _id: connectId,
      status: "pending",
    });
    if (!connecte) {
      return res.status(400).json({
        success: false,
        message: "Request is not present!",
      });
    }
    if (connecte.receiver.toString() !== _id.toString()) {
      return res.status(401).json({
        success: false,
        message: "You are not authorized to accept this request!",
      });
    }
    if (!accept) {
      await connecte.destroy();
      return res.status(200).json({
        success: true,
        message: "Invitation ignored!",
      });
    }

    await connecte.updateOne({ status: "accepted" });

    emitEvent(req, INVITATION_ACCEPTED, [connecte.sender.toString()]);

    res.status(200).json({
      success: true,
      message: "Invitation acceptd successfully!",
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};
