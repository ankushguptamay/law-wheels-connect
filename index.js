require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const authAdmin = require("./Route/Admin/authAdmin");
const authUser = require("./Route/User/authUser");
const blogger = require("./Route/Blogger/authBlogger");
const { connectDB } = require("./Util/features");
const cookieParser = require("cookie-parser");
// const {
//   sendSinglePushNotification,
// } = require("./Util/sendFirebasePushNotification");

const app = express();

connectDB(process.env.MONGO_URI);

var corsOptions = {
  origin: "*",
};

app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/user", authUser);
// app.post("/pushNotification", (req, res) => {
//   try {
//     console.log(req.body)
//     const device_token = req.body.device_token;
//     sendSinglePushNotification(device_token, {
//       title: "Test Title",
//       body: "Test Body",
//     });
//     return res.send("Ok");
//   } catch (error) {
//     return res.send(error.message);
//   }
// });
app.use("/admin", authAdmin);
app.use("/blogger", blogger);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
