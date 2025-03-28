const mammoth = require("mammoth");
const axios = require("axios");
const fs = require("fs");

let latestTranscriptText = null;

const getTransScript = async (req, res) => {
  try {
    // Parse emails (ensure it's an array)
    const emails = JSON.parse(req.body.emails || "[]");
    const meetingTitle = req.body.meetingTitle;
    const actualNames =req.body.actualNames;
    console.log(actualNames);
    if (emails.length === 0) {
      return res.status(400).json({ error: "No recipient emails provided." });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded. Please upload a .docx file.",
      });
    }

    // Extract raw text from the .docx file
    const result = await mammoth.extractRawText({ path: req.file.path });
    latestTranscriptText = result.value.trim(); // Clean transcript text

    // Remove the uploaded file after processing
    fs.unlinkSync(req.file.path);

    // Send extracted text to the next API
    await axios.post("http://localhost:3000/api/mom/summarize-and-email", {
      actualNames,
      transcript: latestTranscriptText,
      recipientEmails: emails,
      meatingTopic: meetingTitle,
    });

    res.json({ message: "Successfully processed transcript and sent data." });
  } catch (error) {
    console.error("Error processing transcript:", error);
    res.status(500).json({ error: "Failed to process transcript document." });
  }
};

module.exports = { getTransScript };
