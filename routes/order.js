const express = require("express");
const {
  createOrder,
  getOneOrder,
  getLoggedInUserOrder,
  admingetAllOrders,
  adminUpdateOrder,
  adminDeleteOrder,
} = require("../controllers/orderController");
const router = express.Router();
const { isLoggedIn, customRole } = require("../middlewares/user");

router.route("/order/create").post(isLoggedIn, createOrder);
router.route("/order/:id").get(isLoggedIn, getOneOrder);
router.route("/myorder").get(isLoggedIn, getLoggedInUserOrder);

//admin routes
router
  .route("/admin/orders")
  .get(isLoggedIn, customRole("admin"), admingetAllOrders);

router
  .route("/admin/order:id")
  .put(isLoggedIn, customRole("admin"), adminUpdateOrder)
  .delete(isLoggedIn, customRole("admin"), adminDeleteOrder);

module.exports = router;
