const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const meetingRoutes = require("./routes/meetingRoutes");
const teamsRoutes = require("./routes/teamsRoutes");
const momRoutes = require("./routes/momRoutes");
const bodyParser = require("body-parser");
const multer = require("multer");

dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
app.use("/api/teams", teamsRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/mom", momRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => console.log("Server running on port 3000"));
