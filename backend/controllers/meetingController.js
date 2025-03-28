const sendEmail = require("../utils/emailService");
const { createJiraIssues } = require("../config/jira");
const { getJiraUsers } = require("../utils/getJiraUsers");
// Adjust the file name accordingly

// (async () => {
//   await getJiraUsers();
//   console.log(users); // Access users after fetching
// })();

let tasks = []; // Simulated task database

exports.createJIRA = async (req, res) => {
  try {
    const task = req.body;
    // console.log(task);
    await getJiraUsers();

    const jiraResponse = await createJiraIssues(task);

    // console.log("jiraResponse", jiraResponse);
    if (jiraResponse) {
      task.jiraId = jiraResponse.id;
      tasks.push(task);
      return res
 
        .status(201)
        .json({ message: "Task created", jiraId: task.jiraId });
    }
    res.status(500).json({ error: "Failed to sync with JIRA" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};