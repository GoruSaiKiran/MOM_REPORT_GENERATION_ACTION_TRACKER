const express = require("express");
const { createJIRA } = require("../controllers/meetingController");
const router = express.Router();

router.post("/create-jira", createJIRA);

module.exports = router;
