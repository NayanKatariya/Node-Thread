const cron = require("node-cron");
const { getOrders } = require("../order.service");

cron.schedule("0 */2 * * *", async () => {
  console.log("Running order...");
  await getOrders();
});

cron.schedule("0 */4 * * *", async () => {
  console.log("Running message & order...");
  await getGmailMessages();
  await getOrders(true);
});
