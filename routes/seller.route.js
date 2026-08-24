
const express = require("express");
const { authMiddleware } = require("../middleware/authentication");
const { connectAccountValidation } = require("../validations/seller.validation");
const { connectAccount, getConnectedAccount, removeConnectedAccount, connectGoogleAccount, removeGoogleAccount, handleAutomation } = require("../controllers/seller.controller");
const router = express.Router();

router.post(
  "/connect",
  authMiddleware,
  connectAccountValidation,
  connectAccount
);

router.post(
  "/connect-google",
  authMiddleware,
  connectGoogleAccount
);

router.get(
  "/accounts",
  authMiddleware,
  getConnectedAccount
);

router.delete(
  "/remove-account/:id",
  authMiddleware,
  removeConnectedAccount
);

router.delete(
  "/remove-google-account/:id",
  authMiddleware,
  removeGoogleAccount
);

router.post(
  "/handleAutomation",
  authMiddleware,
  handleAutomation
);


module.exports = router;
