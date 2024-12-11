require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const authAdmin = require("./Route/Admin/authAdmin");
const authUser = require("./Route/User/authUser");
const advocate = require("./Route/User/Advocate/indexRoute");
const student = require("./Route/User/Student/indexRoute");
const advise_seeker = require("./Route/User/Advise_Seeker/indexRoute");
const blogger = require("./Route/Blogger/authBlogger");
const { connectDB } = require("./Util/features");
const { socketIO } = require("./Socket/io");
const { createServer } = require("node:http");
const { deleteMyRecordFromPlayStore } = require("./Controller/User/userCont");

const app = express();
const server = createServer(app);

connectDB(process.env.MONGO_URI);

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/authUser", authUser);
app.use("/advocate", advocate);
app.use("/student", student);
app.use("/user", advise_seeker);
app.use("/admin", authAdmin);
app.use("/blogger", blogger);

// Initialize Socket.io and attach to app
const io = socketIO(server);
app.set("io", io);

app.post("deleteMyRecord", deleteMyRecordFromPlayStore); // Delete request from play store
app.get("/", (req, res) => {
  res.send("Hello World!!");
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
