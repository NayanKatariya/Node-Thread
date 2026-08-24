
const express = require("express");
const { authMiddleware } = require("../middleware/authentication");
const { connectAccountValidation } = require("../validations/seller.validation");
const { connectAccount } = require("../controllers/seller.controller");
const { getOrders } = require("../service/order.service");
const { getProducts } = require("../service/product.service");
const { getAllOrders } = require("../controllers/order.controller");
const validateScheduleReview = require("../validations/requestReview.validation");
const { createScheduleReviewRequest, removeAutomation } = require("../controllers/requestReview.controller");
const router = express.Router();

router.post(
  "/create-schedule-review",
  authMiddleware,
  validateScheduleReview,
  createScheduleReviewRequest
);
router.post(
  "/remove-schedule-review",
  authMiddleware,
  validateScheduleReview,
  removeAutomation
);
// router.get(
//   "/getOrders",
//   authMiddleware,
//   // connectAccountValidation,
//   getAllOrders
// );


module.exports = router;
