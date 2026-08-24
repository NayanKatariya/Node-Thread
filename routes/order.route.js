
const express = require("express");
const { authMiddleware } = require("../middleware/authentication");
const { connectAccountValidation } = require("../validations/seller.validation");
const { connectAccount } = require("../controllers/seller.controller");
const { getOrders } = require("../service/order.service");
const { getProducts } = require("../service/product.service");
const { getAllOrders } = require("../controllers/order.controller");
const validateGetAllOrders = require("../validations/order.validation");
const router = express.Router();

router.post(
  "/connect",
  authMiddleware,
  connectAccountValidation,
  connectAccount
);
router.post(
  "/getOrders",
  authMiddleware,
  validateGetAllOrders,

  // connectAccountValidation,
  getAllOrders
);


module.exports = router;
