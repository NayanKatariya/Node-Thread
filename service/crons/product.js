const cron = require('node-cron');
const { getProducts } = require('../product.service');

cron.schedule('30 */1 * * *', async () => {
  console.log('Running product...');
  await getProducts();
});
