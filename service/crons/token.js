const cron = require('node-cron');
const { updateTokens } = require('../token.service');

cron.schedule('*/15 * * * *', async () => {
  console.log('Running update token...');
  await updateTokens();
});
