var express = require('express');
var router = express.Router();
const userRouter = require('./users.route');
const sellerRouter = require('./seller.route');
const orderRouter = require('./order.route');
const scheduleRouter = require('./requestReview.route');
const messageRouter = require('./message.route');
const productRouter = require('./product.route');
const chatRouter = require('./chat.route');
/* GET home page. */
router.use('/auth', userRouter);
router.use('/seller', sellerRouter);
router.use('/order', orderRouter);
router.use('/schedule', scheduleRouter);
router.use('/message', messageRouter);
router.use('/product', productRouter);
router.use('/chat', chatRouter);

module.exports = router;
