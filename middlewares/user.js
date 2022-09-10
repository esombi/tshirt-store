const User = require("../models/user");
const BigPromise = require("../middlewares/bigPromise");
const customError = require("../utils/customError");
const jwt = require("jsonwebtoken");

exports.isLoggedIn = BigPromise(async (req, res, next) => {
  //extract the token
  const token =
    req.cookies.token || req.header("Authorization").replace("Bearer ", "");

  //if no token
  if (!token) {
    return next(new customError("Login first to access this page", 401));
  }
  //decode token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  //find user by id
  req.user = await User.findById(decoded.id);

  next();
});

exports.customRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new customError("You are not allowed for this resource", 403)
      );
    }
    next();
  };
};
