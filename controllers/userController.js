const User = require("../models/user");
const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customError");
const cookieToken = require("../utils/cookieToken");
const cloudinary = require("cloudinary");
const mailHelper = require("../utils/emailHelper");
const crypto = require("crypto");

exports.signUp = BigPromise(async (req, res, next) => {
  //let result;
  if (!req.files) {
    return next(new customError("photo is required for sign up", 400));
  }

  const { name, email, password } = req.body;

  if (!(email || name || password)) {
    return next(new CustomError("Email, name and password are required", 400));
  }

  let file = req.files.photo;

  const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
    folder: "users",
    width: 150,
    crop: "scale",
  });

  const user = await User.create({
    name,
    email,
    password,
    photo: {
      id: result.public_id,
      secure_url: result.secure_url,
    },
  });

  cookieToken(user, res);
});

exports.login = BigPromise(async (req, res, next) => {
  const { email, password } = req.body;

  //check for presence of email and password
  if (!email || !password) {
    return next(new CustomError("Please provide email or password"));
  }

  //get user from DB
  const user = await User.findOne({ email }).select("+password");

  // if user is not found in DB
  if (!user) {
    return next(new customError("Email or password does not match or exist"));
  }
  // match the password
  const isPasswordCorrect = await user.isValidatedPassword(password);

  //if password do not match
  if (!isPasswordCorrect) {
    return next(new customError("Email or password does not match or exist"));
  }

  //if all goes good, we send the token
  cookieToken(user, res);
});

exports.logout = BigPromise(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    message: "logout success",
  });
});

exports.forgotPassword = BigPromise(async (req, res, next) => {
  //collect email
  const { email } = req.body;

  //find user in database
  const user = await User.findOne({ email });

  //if user is not found in database
  if (!user) {
    return next(new customError("Email not found ", 400));
  }

  //get token from user model
  const forgotToken = user.getForgotPasswordToken();

  //save user field in db
  await user.save({ validateBeforeSave: false });

  //create url
  const myurl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/password/reset/${forgotToken}`;

  // craft a message
  const message = `Copy and paste this link on your url and hit enter \n\n ${myurl}`;

  //attempt to send email
  try {
    await mailHelper({
      email: user.email,
      subject: "Sheddy Tshirt Store - Reset email",
      message,
    });

    //json response for success email
    res.status(200).json({
      success: true,
      message: `Email sent successfully to:  ${user.email}`,
    });
  } catch (error) {
    //reset user fields if things go wrong
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new customError(error.message, 500));
  }
});

exports.passwordReset = BigPromise(async (req, res, next) => {
  //get the token from req
  const token = req.params.token;

  //encrypt the token
  const encryptToken = (this.forgotPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex"));

  //find user based on encryption token
  const user = await User.findOne({
    encryptToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  //if user does not exist
  if (!user) {
    return next(new customError("Token is invalid or expired ", 400));
  }

  //check that password and confirm password are equal
  if (req.body.password !== req.body.confirmPassword) {
    return next(
      new customError("Password and confirm password do not match", 400)
    );
  }

  //collect password body
  user.password = req.body.password;

  //reset token fields
  user.forgotPasswordToken = undefined;
  forgotPasswordExpiry = undefined;

  // save new password to db
  await user.save();
  //send json response or send a token
  cookieToken(user, res);
});

exports.getLoggedInUserDetails = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user,
  });
});

exports.changePassword = BigPromise(async (req, res, next) => {
  //get the user id
  const userId = req.user.id;

  //find user based on id
  const user = await User.findById(userId).select("+password");

  //compare password to be changed password save on the database
  const isCorrectOldPassword = await user.isValidatedPassword(
    req.body.oldPassword
  );

  //when password doesn't match
  if (!isCorrectOldPassword) {
    return next(new customError("old password is incorrent", 400));
  }

  //update with new password and save
  user.password = req.body.password;
  await user.save();

  //send token
  cookieToken(user, res);
});

exports.updateUserDetails = BigPromise(async (req, res, next) => {
  //add a check for email and name from the body

  // collect data to change from body
  const newData = {
    name: req.body.name,
    email: req.body.email,
  };

  // Handle photo update
  if (req.files) {
    //find user
    const user = await User.findById(req.user.id);

    //find image id of user
    const ImageId = user.photo.id;

    //delete photo on cloudinary
    const resp = await cloudinary.v2.uploader.destroy(ImageId);

    //upload new photo
    const result = await cloudinary.v2.uploader.upload(
      req.files.photo.tempFilePath,
      {
        folder: "users",
        width: 150,
        crop: "scale",
      }
    );

    newData.photo = {
      id: result.public_id,
      secure_url: result.secure_url,
    };
  }

  //update user
  const user = await User.findByIdAndUpdate(req.user.id, newData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
});

exports.adminAllUsers = BigPromise(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    success: true,
    users,
  });
});

exports.admingetOneUser = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new customError("No user found", 400));
  }
  res.status(200).json({
    success: true,
    user,
  });
});

exports.adminUpdateOneUserDetails = BigPromise(async (req, res, next) => {
  //add a check for email and name from the body

  // collect data to change from body
  const newData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  //update user
  const user = await User.findByIdAndUpdate(req.params.id, newData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
});

exports.adminDeleteOneUser = BigPromise(async (req, res, next) =>{
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return next (new customError("No such user found", 401))
  }

  const imageId = user.photo.id;
  await cloudinary.v2.uploader.destroy(imageId);

  await user.remove()

  res.status(200).json({
    success: true
  })
})

exports.managerAllUsers = BigPromise(async (req, res, next) => {
  const users = await User.find({ role: "user" });

  res.status(200).json({
    success: true,
    users,
  });
});
