
const express = require("express");
const { authMiddleware } = require("../middleware/authentication");
const { getAllProducts } = require("../controllers/product.controller");
const router = express.Router();


router.get(
  "/getProducts",
  authMiddleware,
  getAllProducts
);


module.exports = router;
