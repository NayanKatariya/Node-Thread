var express = require('express');
var router = express.Router();
const { authMiddleware } = require('../middleware/authentication');
const { getCustomerMessages, getCustomerForMessages, getUserMessages, sendAmazonMessage, generateAutomaticMessage, generateMessageWithHistory } = require('../controllers/message.controller');
const { createMessageForBuyer, sendMessageToBuyer } = require('../service/message.service');
const { messageValidation } = require('../validations/message.validation');

router.get('/customerMessages',authMiddleware, getCustomerMessages);
router.get('/user',authMiddleware, getCustomerForMessages);
router.post('/user',authMiddleware, getUserMessages);
router.post('/create',authMiddleware, createMessageForBuyer);
// router.post('/generate',authMiddleware, validateRequest,generateMessage);
router.get('/sendMessageToBuyer',sendMessageToBuyer);
router.post('/sendMessage',authMiddleware,sendAmazonMessage);
router.post('/generate',authMiddleware,generateAutomaticMessage);
router.post('/generateMessageWithHistory',authMiddleware,messageValidation,generateMessageWithHistory);

module.exports = router;
