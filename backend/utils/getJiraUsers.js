// ✅ Fetch Jira Users dynamically
const axios = require("axios");

const JIRA_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

let users = {};

async function getJiraUsers() {
  try {
    // Fetch all users (without emails)
    const response = await axios.get(
      `${JIRA_URL}/rest/api/3/users/search?maxResults=50`,
      {
        auth: {
          username: JIRA_EMAIL,
          password: JIRA_API_TOKEN,
        },
        headers: { Accept: "application/json" },
      }
    );

    response.data.map((user) => (users[user.displayName] = user.accountId));
  } catch (error) {
    console.error(
      "❌ Error fetching Jira users:",
      error.response?.data || error.message
    );
    return [];
  }
}

module.exports = {
  getJiraUsers,
  users,
};