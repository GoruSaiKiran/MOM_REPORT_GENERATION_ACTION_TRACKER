const { users } = require("./getJiraUsers");

function getMultipleAccountIds(tasks) {
  let accountIds = {};

  for (const task of tasks) {
    // console.log(task);
    // console.log("users", users);
    const accountId = users[task.assigneeName];
    if (accountId) {
      accountIds[task.assigneeName] = accountId;
    }
  }
  // console.log("accountIds", accountIds);
  return accountIds;
}

module.exports = { getMultipleAccountIds };