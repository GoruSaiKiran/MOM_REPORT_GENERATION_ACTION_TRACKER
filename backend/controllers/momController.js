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
- Ensure that you ALWAYS provide a specific name for each speaker based on context. Never return "undefined", "unknown", or empty values for predicted names.
- Note: The example names provided below (e.g., Rahul, Rupa, Azim, Kiran, Anuj) are for illustration only. Do not output these example values unless they are explicitly inferred from the transcript content.

Infer Department and Role:
- Based on the context of the transcript, determine the appropriate department and role for each speaker.
- Departments may include: Business Unit, Technical Unit, Sales Unit, People Success Unit, etc.
- Roles should be inferred from the discussion (e.g., Project Lead, Software Engineer, Business Analyst, Operations Manager, etc.).
- Note: The example department and role values provided below are for illustration only. Derive the actual values solely from the transcript content.

Store the Inferred Data in the Following Format:
- "predicted_names" → Maps each "Speaker X" to its inferred name. This field is MANDATORY and MUST contain a non-empty string for each speaker.
- "classification" → Associates each "Speaker X" with their predicted name, department, and role.
- "department_categorization" → Group discussions and action items by department (Business Unit, Technical Unit, Sales Unit, People Success Unit, etc.)
- "role_based_summary" → Provide intelligent summaries based on roles (Executive Summary, Technical Summary, Business Impact, Action Items by Role)
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
  },
  "department_categorization": {
    "Technical Unit": {
      "discussions": "Summary of technical discussions and decisions made during the meeting",
      "action_items": ["Technical action item 1", "Technical action item 2"]
    },
    "Business Unit": {
      "discussions": "Summary of business-related discussions and decisions",
      "action_items": ["Business action item 1", "Business action item 2"]
    },
    "Sales Unit": {
      "discussions": "Summary of sales-related discussions and decisions",
      "action_items": ["Sales action item 1", "Sales action item 2"]
    }
  },
  "role_based_summary": {
    "Executive Summary": "High-level overview of meeting outcomes and strategic decisions for executives",
    "Technical Summary": "Detailed technical information and action items for technical team members",
    "Business Impact": "Analysis of business implications from the meeting discussions",
    "Action Items by Role": {
      "Project Lead": ["Action item for project lead 1", "Action item for project lead 2"],
      "Software Engineer": ["Action item for engineers 1", "Action item for engineers 2"],
      "Business Analyst": ["Action item for analysts 1", "Action item for analysts 2"]
    }
  }
}

Additionally, ensure that the output JSON also includes all the PDF-related data (such as meeting title, meeting id, duration, members, summary, decisions, and key extractions) that are going to be sent in the PDF report.

It is CRITICAL that every speaker has a predicted name and that no "undefined" values appear in predicted_names. If you cannot infer a specific name, use a generic name like "Participant 1" but NEVER leave a predicted name blank or undefined.

Ensure that every speaker is included, their content is summarized effectively, and their classification (predicted name, department, and role) is derived solely from the transcript context rather than from the provided examples.
`;

    const prompt = originalPrompt + appendedPrompt;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Validate and sanitize the response
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```") && cleanedText.endsWith("```")) {
      cleanedText = cleanedText.substring(3, cleanedText.length - 3).trim();
    }
    if (cleanedText.startsWith("json") || cleanedText.startsWith("JSON")) {
      cleanedText = cleanedText.substring(4).trim();
    }
    
    // Validate JSON format
    try {
      const parsed = JSON.parse(cleanedText);
      
      // Ensure all required fields are present
      if (Array.isArray(parsed) && parsed.length > 0) {
        const data = parsed[0];
        
        // Ensure predicted_names exists and has no undefined values
        if (data.predicted_names) {
          for (const speaker in data.predicted_names) {
            if (!data.predicted_names[speaker] || data.predicted_names[speaker] === "undefined") {
              console.warn(`Fixing undefined predicted name for ${speaker}`);
              data.predicted_names[speaker] = `Participant ${speaker.replace(/\D/g, '')}`;
            }
          }
        }
        
        // Ensure classification has predicted_name for each speaker
        if (data.classification) {
          for (const speaker in data.classification) {
            if (!data.classification[speaker].predicted_name || 
                data.classification[speaker].predicted_name === "undefined") {
              console.warn(`Fixing undefined predicted_name in classification for ${speaker}`);
              // Get from predicted_names if available, or use fallback
              const predName = (data.predicted_names && data.predicted_names[speaker]) || 
                              `Participant ${speaker.replace(/\D/g, '')}`;
              data.classification[speaker].predicted_name = predName;
            }
          }
        }
        
        cleanedText = JSON.stringify(parsed);
      }
    } catch (e) {
      console.error("Error validating JSON:", e);
      // Return original text if validation fails
    }
    
    return cleanedText;
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

// Helper function for consistent object access with safety
const safeGet = (obj, path, defaultValue = "") => {
  if (!obj) return defaultValue;
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined || typeof result !== 'object') {
      return defaultValue;
    }
    result = result[key];
    if (result === undefined) {
      return defaultValue;
    }
  }
  
  return result === null || result === undefined ? defaultValue : result;
};

// New function to calculate classification metrics
const calculateClassificationMetrics = (actualNames, inferredNames) => {
  if (!actualNames || !inferredNames) {
    return {
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      truePositives: 0,
      falsePositives: 0,
      trueNegatives: 0,
      falseNegatives: 0,
      matchingNames: [],
      unmatchedNames: []
    };
  }

  // Normalize keys for comparison
  const normalizeKey = key => String(key || "").replace(/[\s_]/g, "").toLowerCase();
  
  // Extract actual name whether it's a string or an object with a name property
  const extractActualName = value => {
    if (!value) return "";
    return (typeof value === "object" && 'name' in value) 
           ? String(value.name || "").trim().toLowerCase() 
           : String(value).trim().toLowerCase();
  };

  // Create normalized maps for comparison
  const normalizedActualNames = Object.entries(actualNames).reduce((acc, [key, value]) => {
    const normalizedKey = normalizeKey(key);
    if (normalizedKey) acc[normalizedKey] = extractActualName(value);
    return acc;
  }, {});

  const normalizedInferredNames = Object.entries(inferredNames).reduce((acc, [key, value]) => {
    const normalizedKey = normalizeKey(key);
    if (normalizedKey) acc[normalizedKey] = extractActualName(value);
    return acc;
  }, {});

  // Calculate classification metrics
  let truePositives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  const matchingNames = [];
  const unmatchedNames = [];

  // Check all inferred names against actual names
  Object.entries(normalizedInferredNames).forEach(([speaker, inferred]) => {
    const actual = normalizedActualNames[speaker];
    if (actual && actual === inferred) {
      truePositives++;
      matchingNames.push(`${speaker}: ${actual}`);
    } else if (inferred) {
      falsePositives++;
      unmatchedNames.push(`${speaker}: expected "${actual || 'none'}", got "${inferred}"`);
    }
  });

  // Check for false negatives (actual names not matched)
  Object.entries(normalizedActualNames).forEach(([speaker, actual]) => {
    if (!normalizedInferredNames[speaker] || normalizedInferredNames[speaker] !== actual) {
      falseNegatives++;
      if (!unmatchedNames.includes(`${speaker}: expected "${actual}", got "none"`)) {
        unmatchedNames.push(`${speaker}: expected "${actual}", got "none"`);
      }
    }
  });

  // Calculate derived metrics
  const totalPredictions = truePositives + falsePositives + falseNegatives;
  const precision = totalPredictions > 0 ? truePositives / (truePositives + falsePositives) : 0;
  const recall = (truePositives + falseNegatives) > 0 ? truePositives / (truePositives + falseNegatives) : 0;
  const f1Score = (precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
  const accuracy = (truePositives + falseNegatives) > 0 ? truePositives / (truePositives + falsePositives + falseNegatives) : 0;

  return {
    accuracy: accuracy * 100,
    precision: precision * 100,
    recall: recall * 100,
    f1Score: f1Score,
    truePositives,
    falsePositives,
    trueNegatives: 0, // Not applicable in this context
    falseNegatives,
    matchingNames,
    unmatchedNames
  };
};

// Function to add classification metrics table to PDF
const addMetricsTableToPdf = (doc, metrics) => {
  // Helper to draw table cells with improved layout
  const drawTableCell = (doc, x, y, width, height, text, isHeader = false) => {
    doc.rect(x, y, width, height).stroke();
    doc.fontSize(isHeader ? 10 : 9)
       .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
       .fillColor(isHeader ? '#000000' : '#333333');
    
    const textY = y + (height - doc.currentLineHeight()) / 2;
    doc.text(text, x + 4, textY, {
      width: width - 8,
      align: 'center',
      lineBreak: false
    });
  };

  // Table positioning parameters
  const startX = 50;
  const startY = doc.y + 10;
  const columnWidth = 110;
  const rowHeight = 22;
  const fontSize = 9;

  let currentY = startY;

  // Header row
  drawTableCell(doc, startX, currentY, columnWidth, rowHeight, 'Metric', true);
  drawTableCell(doc, startX + columnWidth, currentY, columnWidth, rowHeight, 'Value', true);
  currentY += rowHeight;

  // Data rows
  const metricsData = [
    { label: 'Accuracy', value: `${metrics.accuracy.toFixed(2)}%` },
    { label: 'Precision', value: `${metrics.precision.toFixed(2)}%` },
    { label: 'Recall', value: `${metrics.recall.toFixed(2)}%` },
    { label: 'F1-Score', value: metrics.f1Score.toFixed(2) },
    { label: 'True Positives', value: metrics.truePositives },
    { label: 'False Positives', value: metrics.falsePositives },
    { label: 'False Negatives', value: metrics.falseNegatives }
  ];

  metricsData.forEach(metric => {
    if (currentY > doc.page.height - 50) {
      doc.addPage();
      currentY = doc.page.margins.top;
    }

    drawTableCell(doc, startX, currentY, columnWidth, rowHeight, metric.label);
    drawTableCell(doc, startX + columnWidth, currentY, columnWidth, rowHeight, metric.value.toString());
    currentY += rowHeight;
  });

  // Reset styling
  doc.fontSize(12)
     .font('Helvetica')
     .fillColor('#000000');

  // Update document position
  doc.y = currentY + 10;
  return doc;
};
const summarizeAndEmail = async (req, res) => {
  try {
    // Validate and extract input from request
    const transcriptText = req.body.transcript;
    let chatInfo = "";
    const recipientEmails = req.body.recipientEmails; // Expect an array of emails
    const graphToken = process.env.sendemail_graphToken;
    const meatingTopic = req.body.meatingTopic; // Fixed spelling from "meatingTopic"
    
    if (!transcriptText) {
      return res.status(400).json({ error: "Transcript text is required." });
    }
    if (!graphToken) {
      return res.status(400).json({ error: "Graph access token is required." });
    }
    if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
      return res.status(400).json({ error: "An array of recipient emails is required." });
    }
    
    // Fetch chat info if not provided
    if (!chatInfo) {
      chatInfo = await fetchChatInfo(meatingTopic);
    }

    // Get the summary from Gemini AI
    let summaryJsonStr = await summarizeAndExtract(transcriptText, chatInfo);
    summaryJsonStr = summaryJsonStr.trim();
    
    // Clean up JSON string if it's wrapped in code blocks
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
      console.error("Failed to parse JSON from Gemini:", parseError);
      return res.status(400).json({ error: "Invalid JSON summary provided by Gemini." });
    }
    
    const meetingData =
      Array.isArray(summaryData) && summaryData.length > 0 ? summaryData[0] : {};

    console.log("Type of meetingData.speakers:", typeof meetingData.speakers);

    // Extract meeting data with safe fallbacks
    const meetingTitle = safeGet(meetingData, "meeting title", "Meeting_Report");
    const meetingID = safeGet(meetingData, "meeting id", "");
    const duration = safeGet(meetingData, "duration", "");
    const members = safeGet(meetingData, "members", "");
    const summaryText = safeGet(meetingData, "summary", "");
    const decisions = safeGet(meetingData, "decisions", "");
    const keyExtractions = safeGet(meetingData, "key extractions", "");
    
    // New fields for department categorization and role-based summary
    const departmentCategorization = safeGet(meetingData, "department_categorization", {});
    const roleBasedSummary = safeGet(meetingData, "role_based_summary", {});

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
        const classification = safeGet(meetingData, `classification.${speakerLabel}`, {});
        const inferredName = safeGet(classification, "predicted_name", "N/A");
        const department = safeGet(classification, "department", "N/A");
        const role = safeGet(classification, "role", "N/A");
        doc.fontSize(12)
          .text(`${speakerLabel}: ${speakerSummary}`)
          .text(`Inferred Name: ${inferredName}`)
          .text(`Department: ${department}`)
          .text(`Role: ${role}`);
        doc.moveDown(0.5);
      });
      doc.moveDown(1);
    }
    
    // --- New: Department-Based Categorization Section ---
    if (departmentCategorization && typeof departmentCategorization === "object" && Object.keys(departmentCategorization).length > 0) {
      doc.fontSize(14).text("Department-Based Categorization:", { underline: true });
      doc.moveDown(0.5);
      
      Object.entries(departmentCategorization).forEach(([department, content]) => {
        doc.fontSize(12).text(department, { bold: true });
        doc.moveDown(0.3);
        
        if (content.discussions) {
          doc.text(`Discussions: ${content.discussions}`);
          doc.moveDown(0.3);
        }
        
        if (content.action_items && Array.isArray(content.action_items) && content.action_items.length > 0) {
          doc.text("Action Items:");
          content.action_items.forEach((item, index) => {
            doc.text(`  ${index + 1}. ${item}`);
          });
        } else if (content.action_items) {
          doc.text(`Action Items: ${content.action_items}`);
        }
        
        doc.moveDown(0.7);
      });
      
      doc.moveDown(0.5);
    }
    
    // --- New: Role-Based Summary Section ---
    if (roleBasedSummary && typeof roleBasedSummary === "object" && Object.keys(roleBasedSummary).length > 0) {
      doc.fontSize(14).text("Role-Based Intelligent Summary:", { underline: true });
      doc.moveDown(0.5);
      
      // Executive Summary
      if (roleBasedSummary["Executive Summary"]) {
        doc.fontSize(12).text("Executive Summary:", { bold: true });
        doc.text(roleBasedSummary["Executive Summary"]);
        doc.moveDown(0.5);
      }
      
      // Technical Summary
      if (roleBasedSummary["Technical Summary"]) {
        doc.fontSize(12).text("Technical Summary:", { bold: true });
        doc.text(roleBasedSummary["Technical Summary"]);
        doc.moveDown(0.5);
      }
      
      // Business Impact
      if (roleBasedSummary["Business Impact"]) {
        doc.fontSize(12).text("Business Impact:", { bold: true });
        doc.text(roleBasedSummary["Business Impact"]);
        doc.moveDown(0.5);
      }
      
      // Action Items by Role
      if (roleBasedSummary["Action Items by Role"] && typeof roleBasedSummary["Action Items by Role"] === "object") {
        doc.fontSize(12).text("Action Items by Role:", { bold: true });
        doc.moveDown(0.3);
        
        Object.entries(roleBasedSummary["Action Items by Role"]).forEach(([role, items]) => {
          doc.text(role + ":");
          
          if (Array.isArray(items)) {
            items.forEach((item, index) => {
              doc.text(`  ${index + 1}. ${item}`);
            });
          } else {
            doc.text(`  ${items}`);
          }
          
          doc.moveDown(0.3);
        });
      }
      
      doc.moveDown(0.5);
    }
    
    // --- Speaker Name Classification Metrics Section ---
    // Extract actualNames from req.body
    let actualNames = req.body.actualNames;
    let metrics = null;
    
    if (actualNames) {
      // Ensure actualNames is in object format
      if (typeof actualNames === "string") {
        try {
          actualNames = JSON.parse(actualNames);
        } catch (err) {
          console.error("Error parsing actualNames JSON:", err);
          actualNames = {};
        }
      }
      
      if (typeof actualNames === "object" && actualNames !== null && Object.keys(actualNames).length > 0) {
        // Get inferred names from the meetingData
        let inferredNames = {};
        
        if (meetingData.predicted_names && 
            typeof meetingData.predicted_names === "object" && 
            meetingData.predicted_names !== null) {
          inferredNames = meetingData.predicted_names;
        } else if (meetingData.classification && 
                  typeof meetingData.classification === "object" && 
                  meetingData.classification !== null) {
          // Fall back to classification if predicted_names isn't available
          for (const speaker in meetingData.classification) {
            const speakerData = meetingData.classification[speaker];
            if (speakerData && typeof speakerData === "object") {
              inferredNames[speaker] = speakerData.predicted_name || "";
            }
          }
        }
        
        if (inferredNames && typeof inferredNames === "object" && inferredNames !== null) {
          // Calculate classification metrics
          metrics = calculateClassificationMetrics(actualNames, inferredNames);
          
          // Add Classification Metrics section to PDF
          doc.fontSize(14).text("Speaker Classification Metrics:", { underline: true });
          doc.moveDown(0.5);
          
          // Add metrics table
          addMetricsTableToPdf(doc, metrics);
          
          // Add explanation of metrics
          doc.fontSize(12).text("Metric Definitions:", { bold: true });
          doc.moveDown(0.3);
          doc.text("• Accuracy: Overall correctness (TP+TN)/(TP+TN+FP+FN)");
          doc.text("• Precision: Proportion of correctly predicted positive identifications (TP/(TP+FP))");
          doc.text("• Recall: Proportion of actual positives correctly identified (TP/(TP+FN))");
          doc.text("• F1-Score: Harmonic mean of precision and recall (2×(precision×recall)/(precision+recall))");
          doc.moveDown(0.3);
          
          doc.text("Classification Terms:", { bold: true });
          doc.moveDown(0.3);
          doc.text("• True Positive (TP): Speaker correctly identified with the right name");
          doc.text("• False Positive (FP): Speaker assigned an incorrect name");
          doc.text("• False Negative (FN): Speaker name missed when it should have been identified");
          doc.text("• True Negative (TN): Non-speaker correctly not assigned a name");
          
          // Add matched and unmatched names if available
          if (metrics.matchingNames && metrics.matchingNames.length > 0) {
            doc.moveDown(0.5);
            doc.text("Correctly Matched Names:", { bold: true });
            metrics.matchingNames.forEach(match => {
              doc.text(`• ${match}`);
            });
          }
          
          if (metrics.unmatchedNames && metrics.unmatchedNames.length > 0) {
            doc.moveDown(0.5);
            doc.text("Incorrectly Matched Names:", { bold: true });
            metrics.unmatchedNames.forEach(unmatch => {
              doc.text(`• ${unmatch}`);
            });
          }
          
          doc.moveDown(1);
        }
      }
    }
    
    // Generate PDF buffer - moved outside the conditionals
    const pdfBuffer = await generatePdfBuffer(doc);
    
    // Send email with PDF attachment
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
      // Continue despite Jira integration errors
    }
    
    return res.json({ 
      message: "Email sent successfully with PDF attachment.",
      metricsCalculated: metrics !== null
    });
  } catch (error) {
    console.error("Error in summarizeAndEmail:", error);
    return res.status(500).json({ error: String(error) });
  }
};

module.exports = { summarizeAndEmail };