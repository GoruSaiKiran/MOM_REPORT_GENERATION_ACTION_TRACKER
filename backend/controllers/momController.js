
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require("express");
const bodyParser = require("body-parser");
const PDFDocument = require("pdfkit");
const axios = require("axios");

// Replace with your actual API key for Gemini
const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Function to fetch chatInfo from MS Graph API
let meetingTopic = "";
async function fetchChatInfo(meetingTopic) {
  const chatsUrl = "https://graph.microsoft.com/v1.0/chats";
  const authToken = process.env.chat_authToken; // Graph token from .env

  try {
    const chatsResponse = await axios.get(chatsUrl, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const chats = chatsResponse.data.value;

    const matchingChat = chats.find(
      (chat) => chat.topic && chat.topic.trim() === meetingTopic.trim()
    );
    if (!matchingChat) {
      console.warn(`No chat found with topic: ${meetingTopic}. Falling back to transcript data.`);
      return ""; // Return an empty string to indicate no chat info
    }

    const chatId = matchingChat.id;
    const chatDetailUrl = `https://graph.microsoft.com/v1.0/chats/${chatId}`;

    const chatDetailResponse = await axios.get(chatDetailUrl, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    return JSON.stringify(chatDetailResponse.data, null, 2);
  } catch (error) {
    console.error("Error fetching chat info from MS Graph API:", error);
    // Instead of throwing error, return empty string to fall back on transcript data.
    return "";
  }
}

async function summarizeAndExtract(transcriptText, chatInfo) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const originalPrompt = `You are given a transcript of a meeting and additional chat information. Please analyze the data and produce a JSON array with the following structure:

[
  {
    "summary": "A plain text summary of the meeting discussion.",
    "meeting title": "The title of the meeting.",
    "meeting id": "The meeting identifier.",
    "duration": "The duration of the meeting. If not explicitly provided, infer the duration from the meeting's timestamps.",
    "members": "A comma-separated list of meeting member names.",
    "decisions": "Any decisions made during the meeting. If not explicitly provided, infer the decisions from the summarized content.",
    "key extractions": "An array of objects in the following format. Note that the example values below are only for illustration and should not be used as final values. Instead, extract and fill in the actual details from the transcript and chat information. If any of the details are not available, use 'Not specified.' \\n\\nExample format:\\n[\\n  { taskName: 'MOM report Generation', taskDescription: 'Users are unable to login with Google OAuth', assigneeName: 'Mani' },\\n  { taskName: 'MOM report Generation', taskDescription: 'Users are unable to login with Google OAuth', assigneeName: 'Manish' },\\n  { taskName: 'MOM report Generation', taskDescription: 'Users are unable to login with Google OAuth', assigneeName: 'Rahul' }\\n]"
  }
]

Here is the data:
Transcript:
${transcriptText}

Chat Info:
${chatInfo}

Please output only valid JSON without markdown formatting.`;

    const appendedPrompt = `
----- Additional Instructions -----
You are an AI assistant that processes meeting transcripts. Your task is to extract and summarize content while maintaining accurate speaker attribution. Follow these steps:

Identify Unique Speakers:
- Extract only explicit speaker labels from the transcript (e.g., "Speaker 0", "Speaker 1", etc.).
- Do not introduce any new speaker labels (e.g., "Anuj", "Azim") directly in the "speakers" section.

Summarize Content Per Speaker:
- Provide a concise summary of each speaker's contributions without losing key details.
- No citation markers in the final summary.

Predict Speaker Names (if possible):
- Based on the context of the transcript, infer likely names (e.g., "Anuj", "Azim"), but remove honorifics or titles such as "Sir", "Madam", "Dr.", etc.
- Note: The example names provided below (e.g., Rahul, Rupa, Azim, Kiran, Anuj) are for illustration only. Do not output these example values unless they are explicitly inferred from the transcript content.

Infer Department and Role:
- Based on the context of the transcript, determine the appropriate department and role for each speaker.
- Departments may include: Business Unit, Technical Unit, Sales Unit, People Success Unit, etc.
- Roles should be inferred from the discussion (e.g., Project Lead, Software Engineer, Business Analyst, Operations Manager, etc.).
- Note: The example department and role values provided below are for illustration only. Derive the actual values solely from the transcript content.

Store the Inferred Data in the Following Format:
- "predicted_names" → Maps each "Speaker X" to its inferred name.
- "classification" → Associates each "Speaker X" with their predicted name, department, and role.
- Do not introduce names like "Anuj" and "Azim" as separate speakers.

Corrected Output Format (Example for Structure Only):

{
  "speakers": {
    "Speaker 1": "Speaker 1 discussed issues with the meeting setup and coordinating with team members to join the meeting.",
    "Speaker 2": "Speaker 2 assisted with the meeting setup, communicated with team members, and made initial observations about the presentation.",
    "Speaker 3": "Speaker 3 opened the session, emphasized the importance of brand communication, and discussed the PPT templates and brand guidelines.",
    "Speaker 4": "Speaker 4 confirmed the audio and visual clarity at the beginning of the session.",
    "Speaker 5": "Speaker 5 conducted a review of a sample presentation, pointing out errors and discussing best practices for layouts, content, and formatting."
  },
  "classification": {
    "Speaker 1": {
      "predicted_name": "<inferred name from transcript>",
      "department": "<inferred department from transcript>",
      "role": "<inferred role from transcript>"
    },
    "Speaker 2": {
      "predicted_name": "<inferred name from transcript>",
      "department": "<inferred department from transcript>",
      "role": "<inferred role from transcript>"
    },
    "Speaker 3": {
      "predicted_name": "<inferred name from transcript>",
      "department": "<inferred department from transcript>",
      "role": "<inferred role from transcript>"
    },
    "Speaker 4": {
      "predicted_name": "<inferred name from transcript>",
      "department": "<inferred department from transcript>",
      "role": "<inferred role from transcript>"
    },
    "Speaker 5": {
      "predicted_name": "<inferred name from transcript>",
      "department": "<inferred department from transcript>",
      "role": "<inferred role from transcript>"
    }
  },
  "predicted_names": {
    "Speaker 1": "<inferred name from transcript>",
    "Speaker 2": "<inferred name from transcript>",
    "Speaker 3": "<inferred name from transcript>",
    "Speaker 4": "<inferred name from transcript>",
    "Speaker 5": "<inferred name from transcript>"
  }
}

Additionally, ensure that the output JSON also includes all the PDF-related data (such as meeting title, meeting id, duration, members, summary, decisions, and key extractions) that are going to be sent in the PDF report.

Ensure that every speaker is included, their content is summarized effectively, and their classification (predicted name, department, and role) is derived solely from the transcript context rather than from the provided examples.
`;

    const prompt = originalPrompt + appendedPrompt;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error("Error processing transcript:", error);
    throw error;
  }
}

// Helper function to generate a PDF buffer using a promise.
const generatePdfBuffer = (doc) => {
  return new Promise((resolve, reject) => {
    let buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);
    doc.end();
  });
};

const summarizeAndEmail = async (req, res) => {
  try {
    // Validate and extract input from request
    const transcriptText = req.body.transcript;
    let chatInfo = "";
    const recipientEmails = req.body.recipientEmails; // Expect an array of emails
    const graphToken = process.env.sendemail_graphToken;
    const meatingTopic = req.body.meatingTopic;
    
    if (!transcriptText) {
      return res.status(400).json({ error: "Transcript text is required." });
    }
    if (!graphToken) {
      return res.status(400).json({ error: "Graph access token is required." });
    }
    if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
      return res.status(400).json({ error: "An array of recipient emails is required." });
    }
    if (!chatInfo) {
      chatInfo = await fetchChatInfo(meatingTopic);
    }

    // Get the summary from Gemini AI
    let summaryJsonStr = await summarizeAndExtract(transcriptText, chatInfo);
    summaryJsonStr = summaryJsonStr.trim();
    if (summaryJsonStr.startsWith("```")) {
      const lines = summaryJsonStr.split("\n");
      lines.shift();
      lines.pop();
      summaryJsonStr = lines.join("\n");
    }

    let summaryData;
    try {
      summaryData = JSON.parse(summaryJsonStr);
    } catch (parseError) {
      return res.status(400).json({ error: "Invalid JSON summary provided by Gemini." });
    }
    
    const meetingData =
      Array.isArray(summaryData) && summaryData.length > 0 ? summaryData[0] : {};

    console.log("Type of meetingData.speakers:", typeof meetingData.speakers);

    const meetingTitle = meetingData["meeting title"] || "Meeting_Report";
    const meetingID = meetingData["meeting id"] || "";
    const duration = meetingData["duration"] || "";
    const members = meetingData["members"] || "";
    const summaryText = meetingData["summary"] || "";
    const decisions = meetingData["decisions"] || "";
    const keyExtractions = meetingData["key extractions"] || "";

    const doc = new PDFDocument({ margin: 50 });
    // Populate PDF content.
    doc.fontSize(20).text(meetingTitle, { align: "center" });
    doc.moveDown(1.5);
    doc.fontSize(12).text(`Meeting ID: ${meetingID}`);
    doc.moveDown(0.75);
    doc.text(`Duration: ${duration}`);
    doc.moveDown(0.75);
    doc.text(`Members: ${members}`);
    doc.moveDown(1);
    
    // Summary of Meeting
    doc.fontSize(14).text("Summary of Meeting:", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(summaryText);
    doc.moveDown(1);
    
    // Decisions Made
    if (decisions) {
      doc.fontSize(14).text("Decisions Made:", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text(decisions);
      doc.moveDown(1);
    }
    
    // Key Extractions
    if (keyExtractions) {
      doc.fontSize(14).text("Key Extractions:", { underline: true });
      doc.moveDown(0.5);
      if (Array.isArray(keyExtractions)) {
        keyExtractions.forEach((extraction, index) => {
          doc.fontSize(12).text(`Extraction #${index + 1}:`, { bold: true });
          doc.moveDown(0.3);
          if (extraction && typeof extraction === "object") {
            Object.entries(extraction).forEach(([k, v]) => {
              doc.text(`${k}: ${v || "N/A"}`);
            });
          } else {
            doc.text(String(extraction));
          }
          doc.moveDown(1);
        });
      } else if (typeof keyExtractions === "object") {
        Object.entries(keyExtractions).forEach(([k, v]) => {
          doc.fontSize(12).text(`${k}: ${v || "N/A"}`);
        });
        doc.moveDown(1);
      } else {
        doc.fontSize(12).text(String(keyExtractions));
        doc.moveDown(1);
      }
    }
    
    // Speaker Identification Section
    if (meetingData.speakers && meetingData.classification && meetingData.predicted_names) {
      doc.fontSize(14).text("Speaker Identification:", { underline: true });
      doc.moveDown(0.5);
      Object.entries(meetingData.speakers).forEach(([speakerLabel, speakerSummary]) => {
        const classification = meetingData.classification[speakerLabel] || {};
        const inferredName = classification.predicted_name || "N/A";
        const department = classification.department || "N/A";
        const role = classification.role || "N/A";
        doc.fontSize(12)
          .text(`${speakerLabel}: ${speakerSummary}`)
          .text(`Inferred Name: ${inferredName}`)
          .text(`Department: ${department}`)
          .text(`Role: ${role}`);
        doc.moveDown(0.5);
      });
      doc.moveDown(1);
    }
    
    // --- New: Speaker Name Accuracy Section ---
    // We compute overall accuracy by comparing actualNames with inferred names.
    let speakerAccuracySection = "";
    let matchingNames = [];
    let unmatchedNames = [];
    // Extract actualNames from req.body
    let actualNames = req.body.actualNames;
    if (actualNames) {
      if (typeof actualNames === "string") {
        try {
          actualNames = JSON.parse(actualNames);
        } catch (err) {
          console.error("Error parsing actualNames JSON:", err);
          actualNames = {};
        }
      }
      if (typeof actualNames === "object" && Object.keys(actualNames).length > 0) {
        let inferredNames = {};
        if (
          meetingData.predicted_names &&
          typeof meetingData.predicted_names === "object" &&
          Object.keys(meetingData.predicted_names).length > 0
        ) {
          inferredNames = meetingData.predicted_names;
        } else if (meetingData.classification && typeof meetingData.classification === "object") {
          for (const speaker in meetingData.classification) {
            inferredNames[speaker] = meetingData.classification[speaker].predicted_name || "";
          }
        }
        if (inferredNames && typeof inferredNames === "object") {
          const normalizeKey = key => key.replace(/[\s-]/g, "").toLowerCase();
          const extractActualName = value => (typeof value === "object" && value !== null) ? String(value.name || "") : String(value);
          
          let normalizedActualNames = {};
          for (const key in actualNames) {
            normalizedActualNames[normalizeKey(key)] = extractActualName(actualNames[key]);
          }
          let normalizedInferredNames = {};
          for (const key in inferredNames) {
            normalizedInferredNames[normalizeKey(key)] = String(inferredNames[key]);
          }
          
          let total = 0;
          let correct = 0;
          for (const speaker in normalizedActualNames) {
            total++;
            const actual = normalizedActualNames[speaker].toLowerCase();
            const inferred = (normalizedInferredNames[speaker] || "").toLowerCase();
            if (actual === inferred) {
              correct++;
              matchingNames.push(`${speaker}: ${actual}`);
            } else {
              unmatchedNames.push(`${speaker}: expected "${actual}", got "${normalizedInferredNames[speaker]}"`);
            }
          }
          const accuracy = total > 0 ? (correct / total) * 100 : 0;
          speakerAccuracySection = `Overall Accuracy: ${accuracy.toFixed(2)}%\nMatching Names: ${matchingNames.join(", ") || "None"}\nUnmatched Names: ${unmatchedNames.join(", ") || "None"}`;
        } else {
          speakerAccuracySection = "Inferred names data is not available or not in the expected format.";
        }
      } else {
        speakerAccuracySection = "No actualNames provided; skipping speaker name evaluation.";
      }
    } else {
      speakerAccuracySection = "No actualNames provided; skipping speaker name evaluation.";
    }
    
    if (speakerAccuracySection) {
      doc.fontSize(14).text("Speaker Name Accuracy:", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text(speakerAccuracySection);
      doc.moveDown(1);
    }
    
    const pdfBuffer = await generatePdfBuffer(doc);
    
    const mailBody = {
      message: {
        subject: `MOM Report - ${meetingTitle}`,
        body: {
          contentType: "Text",
          content: `Please find attached the MOM Report PDF for the meeting "${meetingTitle}".`,
        },
        toRecipients: recipientEmails.map((email) => ({
          emailAddress: { address: email },
        })),
        attachments: [
          {
            "@odata.type": "#microsoft.graph.fileAttachment",
            name: `${meetingTitle}.pdf`,
            contentType: "application/pdf",
            contentBytes: pdfBuffer.toString("base64"),
          },
        ],
      },
      saveToSentItems: "true",
    };
    
    try {
      await axios.post(
        "https://graph.microsoft.com/v1.0/me/sendMail",
        mailBody,
        {
          headers: {
            Authorization: `Bearer ${graphToken}`,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (sendError) {
      console.error(
        "Error sending email via Graph:",
        sendError.response ? sendError.response.data : sendError
      );
      return res.status(500).json({ error: "Failed to send email." });
    }
    
    // Jira Integration - chained after email sending.
    try {
      await axios.post(
        "http://localhost:3000/api/meetings/create-jira",
        keyExtractions
      );
    } catch (jiraError) {
      console.error("Error during Jira integration:", jiraError);
    }
    
    return res.json({ message: "Email sent successfully with PDF attachment." });
  } catch (error) {
    console.error("Error in summarizeAndEmail:", error);
    return res.status(500).json({ error });
  }
};

module.exports = { summarizeAndEmail };

