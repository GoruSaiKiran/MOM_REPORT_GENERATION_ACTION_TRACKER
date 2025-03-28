const axios = require("axios");
require("dotenv").config();
const { getMultipleAccountIds } = require("../utils/getAccountIdHelper");

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_PROJECT_KEY = "KAN";

const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64");

async function createJiraIssues(tasks) {
  // console.log(tasks);
  // Get Account IDs for all users
  const accountIds = await getMultipleAccountIds(tasks);

  // Check if account IDs were found
  if (Object.keys(accountIds).length === 0) {
    return;
  }

  const createdIssues = [];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const assigneeName = task.assigneeName; // Assign in a round-robin fashion
    let assigneeId = accountIds[assigneeName];

    if (!assigneeId) {
      continue;
    }

    const issueData = {
      fields: {
        project: { key: JIRA_PROJECT_KEY },
        summary: task.taskName,
        description: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: task.taskDescription,
                },
              ],
            },
          ],
        },
        issuetype: { id: "10001" }, // Ensure this ID is correct
        assignee: {
          accountId: assigneeId,
        },
      },
    };

    try {
      const response = await axios.post(
        `${JIRA_BASE_URL}/rest/api/3/issue`,
        issueData,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log(
        `✅ Created JIRA Issue: ${response.data.key} (Assigned to ${assigneeName})`
      );
      createdIssues.push({ id: response.data.key, assignee: assigneeName });
    } catch (error) {
      console.error(
        `❌ Error creating JIRA issue for ${assigneeName}:`,
        error.response?.data || error.message
      );
    }
  }

  return createdIssues;
}

module.exports = { createJiraIssues };