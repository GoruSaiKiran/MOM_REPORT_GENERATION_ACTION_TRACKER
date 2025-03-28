const axios = require("axios");

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

async function getAccountId(email) {
  try {
    const auth = Buffer.from(`${email}:${JIRA_API_TOKEN}`).toString("base64");

    const response = await axios.get(
      `${JIRA_BASE_URL}/rest/api/3/user/search?query=${email}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
        },
      }
    );

    return response.data[0].accountId;
  } catch (error) {
    console.error(
      "❌ Error getting account ID:",
      error.response?.data || error.message
    );
  }
}

module.exports = { getAccountId };
