const Product = require("../models/product");
const BigPromise = require("../middlewares/bigPromise");
const cloudinary = require("cloudinary");
const customError = require("../utils/customError");
const product = require("../models/product");
const whereClause = require("../utils/whereClause");

exports.addProduct = BigPromise(async (req, res, next) => {
  let imageArray = [];

  if (!req.files) {
    return next(new customError("Images are required", 401));
  }

  if (req.files) {
    for (let index = 0; index < req.files.photos.length; index++) {
      let result = await cloudinary.v2.uploader.upload(
        req.files.photos[index].tempFilePath,
        {
          folder: "products",
        }
      );

      imageArray.push({
        id: result.public_id,
        secure_url: result.secure_url,
      });
    }
  }
  req.body.photos = imageArray;
  req.body.user = req.user.id;

  const product = await Product.create(req.body);

  res.status(200).json({
    success: true,
    product,
  });
});

exports.getAllProducts = BigPromise(async (req, res, next) => {
  const resultperPage = 6;

  const totalcountProduct = await Product.countDocuments();

  const productObj = new whereClause(Product.find(), req.query)
    .search()
    .filter();

  let products = await productObj.base;

  const filteredProductNumber = products.length;

  productObj.pager(resultperPage);
  products = await productObj.base.clone();

  res.status(200).json({
    success: true,
    products,
    totalcountProduct,
    filteredProductNumber,
  });
});

exports.getOneProduct = BigPromise(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new customError("No product found with this id", 401));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

exports.addReview = BigPromise(async (req, res, next) => {
  const { rating, comment, productId } = req.body;

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  //find product to push review to
  const product = await Product.findById(productId);

  //check if user already made a review
  const alreadyReview = product.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString()
  );

  if (alreadyReview) {
    product.reviews.forEach((review) => {
      if (review.user.toString() === req.user._id.toString()) {
        (review.comment = comment), (review.rating = rating);
      }
    });
  } else {
    product.reviews.push(review);
    product.numberofReviews = product.reviews.length;
  }

  // adjust ratings
  product.ratings =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    product.reviews.length;

  // save
  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});

exports.deleteReview = BigPromise(async (req, res, next) => {
  const { productId } = req.query;

  //find product by its id
  const product = await Product.findById(productId);

  //filter out review sent by user
  const reviews = product.reviews.filter(
    (rev) => rev.user.toString() === req.user._id.toString()
  );

  const numberofReviews = reviews.length;

  // adjust ratings
  product.ratings =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    product.reviews.length;

  // update the product
  await Product.findByIdAndUpdate(
    productId,
    {
      reviews,
      ratings,
      numberofReviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
  });
});

exports.getOnlyReviewsForOneProduct = BigPromise(async (req, res, next) => {
  const product = await Product.findById(req.query.id);

  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});

//admin only controllers
exports.adminGetAllProduct = BigPromise(async (req, res, next) => {
  const products = await Product.find();

  res.status(200).json({
    success: true,
    products,
  });
});

exports.adminUpdateOneProduct = BigPromise(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new customError("No product found with this id", 401));
  }

  let imagesArray = [];

  if (req.files) {
    //destroy existing image
    for (let index = 0; index < product.photos.length; index++) {
      const res = await cloudinary.v2.uploader.destroy(
        product.photos[index].id
      );
    }
    //upload new image
    for (let index = 0; index < req.files.photos.length; index++) {
      let result = await cloudinary.v2.uploader.upload(
        req.files.photos[index].tempFilePath,
        {
          folder: "products", // folder name -> .env
        }
      );
      imagesArray.push({
        id: result.public_id,
        secure_url: result.secure_url,
      });
    }
  }

  req.body.photos = imagesArray;

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    product,
  });
});

exports.adminDeleteOneProduct = BigPromise(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new customError("No product found with this id", 401));
  }

  //destroy existing image
  for (let index = 0; index < product.photos.length; index++) {
    const res = await cloudinary.v2.uploader.destroy(product.photos[index].id);
  }

  await product.remove();

  res.status(200).json({
    success: true,
    message: "Product Deleted!",
  });
});
