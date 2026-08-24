

const cron = require('node-cron');
const { getMessageAction, sendMessageToBuyer } = require('../message.service');

// cron.schedule('0 */4 * * *', async () => {
//   console.log('Running message action...');
//   await getMessageAction();
// });

// cron.schedule('* * * * *', async () => {
//   console.log('Send message action...');
//   await sendMessageToBuyer();
// });
