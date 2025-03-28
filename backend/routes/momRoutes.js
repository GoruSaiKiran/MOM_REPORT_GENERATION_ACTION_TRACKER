const express = require("express");
const { summarizeAndEmail } = require("../controllers/momController");
const router = express.Router();

router.post("/summarize-and-email", summarizeAndEmail);

module.exports = router;
