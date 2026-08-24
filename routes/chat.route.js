var express = require("express");
const upload = require("../utils/multer");
const { uploadPDF, askQuestion } = require("../controllers/chat.controller");
const validateAskChat = require("../validations/chat.validation");
var router = express.Router();

router.post("/upload", upload.single("file"), uploadPDF);
router.post("/ask", validateAskChat, askQuestion);

module.exports = router;
