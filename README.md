MOM Report Generation & Action Tracker With Speaker Identification and Validation
MOM Report Generation and Action Tracker is designed to help meeting attendees quickly capture and review the key insights discussed during a meeting. The application generates a detailed MOM (Minutes of Meeting) report and extracts tasks that are then reflected in an action tracker (such as Jira) for efficient follow-up.

Table of Contents
Overview

Features

Technology Stack

Installation and Setup

Usage

Speaker Identification and Validation (Accuracy per Transcript)

Configuration

Development Guidelines

License

Overview
The main purpose of this project is to provide meeting attendees with quick insights into all discussions, ensuring that all tasks and decisions are easily remembered. The MOM report generated includes:

A summary of the meeting

Detailed meeting information (meeting ID, duration, members)

Decisions made during the meeting

Key task extractions which can be later imported into an action tracker like Jira

Features
Automated MOM Report Generation: Extracts key meeting insights from uploaded transcripts.

Action Tracker Integration: Converts extracted tasks into actionable items that can be tracked using Jira.

Chat and Email Integration: Uses Microsoft Graph API to fetch meeting chat details and send email reports.

AI-Powered Summarization: Leverages Google Cloud's Gemini Flash 2.0 model for natural language processing.

Modern Frontend: Built with React and Vite for a fast, modern development experience.

Robust Backend: Node.js server handling transcript processing, PDF generation, and integration with third-party APIs.

Speaker Identification and Validation: Enhances accuracy by validating speaker names against the actual attendees.

Technology Stack
Frontend:
React

Vite

Axios

Backend:
Node.js

Express

Google Cloud Gemini Flash 2.0 API (via @google/generative-ai)

Microsoft Graph API (for chat and email functions)

Jira API (for action tracking)

PDFKit, Mammoth, Multer, and other utility packages

Installation and Setup
Prerequisites
Node.js (v14 or later)

npm or yarn

Frontend Setup
Navigate to the project root.

Install dependencies:

bash
Copy
Edit
npm install
Run the development server:

bash
Copy
Edit
npm run dev
Backend Setup
Navigate to the backend directory:

bash
Copy
Edit
cd backend
Install dependencies:

bash
Copy
Edit
npm install
Create a .env file in the backend directory with the following variables:

ini
Copy
Edit
GEMINI_API_KEY=<your-gemini-api-key>
chat_authToken=<your-ms-graph-chat-token>
sendemail_graphToken=<your-ms-graph-email-token>
PORT=<your-port-number>

# Jira Environment Variables
JIRA_BASE_URL=<your-jira-base-url>
JIRA_EMAIL=<your-jira-email>
JIRA_API_TOKEN=<your-jira-api-token>
JIRA_PROJECT_KEY=<your-jira-project-key>
Start the backend server:

bash
Copy
Edit
node server.js
Usage
Transcript Upload
The organizer uploads the transcript generated from an MS Teams meeting.

Note: Transcribe permission must be enabled in Teams; recording is not necessary.

MOM Report Generation
The system processes the transcript and additional chat information to generate a MOM report.

A sample MOM report (see attached MOM REPORT GENERATION.pdf) demonstrates the format:

Meeting Details: ID, duration, members, and summary.

Decisions Made: Key decisions extracted from the discussion.

Key Task Extractions: Tasks (with task name, description, and assignee) ready for action tracking.

Action Tracker Integration
Extracted tasks are automatically forwarded to an action tracker (e.g., Jira) for further follow-up and management.

Speaker Identification and Validation (Accuracy per Transcript)
Our application includes an advanced Speaker Identification and Validation feature to enhance the accuracy of MOM reports.

How It Works:
Automated Speaker Identification:
The system processes the meeting transcript and infers speaker names based on speech patterns and context using Google Cloud's Gemini Flash 2.0 API.

Validation Against Actual Names:

The system allows users to input the expected speaker names.

It then compares these with the AI-generated speaker labels, calculating an overall accuracy percentage.

The names are categorized into matching and non-matching groups.

Detailed Reporting in PDF:

The Speaker Name Accuracy section in the MOM report PDF includes:

The accuracy percentage per transcript.

A breakdown of correctly identified vs. unmatched speaker names.

This ensures transparency and helps organizers correct any misidentified speakers before sharing the report.

By implementing this feature, the application ensures greater reliability in meeting analytics, role tracking, and decision-making, making the generated MOM report more structured and actionable.

Configuration
The project uses environment variables defined in the .env file (for both frontend and backend) to store sensitive information like API keys and authorization tokens. Ensure you update these with your own credentials.

Development Guidelines
Coding Standards
We recommend following standard ESLint rules (as configured) and using Prettier for code formatting.

Contributing
Feel free to fork the repository and submit pull requests. Please ensure your changes are well-tested and documented.