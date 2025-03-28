const express = require("express");
const multer = require("multer");
const { getTransScript } = require("../controllers/teamsController");
const { summarizeAndEmail } = require("../controllers/momController");

const router = express.Router();

// Configure Multer to store files in the 'uploads' folder
const upload = multer({ dest: "uploads/" });

// Fix the field name here to match what is sent from the frontend
router.post("/getTransScript", upload.single("transcriptFile"), getTransScript);

module.exports = router;
