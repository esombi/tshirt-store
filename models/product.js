const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please provide product name"],
        trim: true,
        maxLength: [120, "Product name should not be more than 120 characters"]
    },
    price: {
        type: Number,
        required: [true, "Please provide product price"],
        trim: true,
        maxLength: [6, "Product price should not be more than 6 digits"]
    },
    description: {
        type: String,
        required: [true, "Please provide product description"],
    },
    photos: [
        {
            id: {
                type: String,
                required: true
            },
            secure_url: {
                type: String,
                required: true
            }
        }
    ],
    category: {
        type: String,
        required: [true, "Please select category from options"],
        enum: [
            'shortsleeves',
            'longsleeves',
            'sweatshirts',
            'hoodies'
        ],
        message: "Please choose category from options available"
    },
    stock: {
        type: Number,
        required: [true, 'Please add a number in stock'],
    },
    brand: {
        type: String,
        required: [true, "please add a brand for clothing"]
    },
    ratings:{
        type: Number,
        default: 0
    },
    numberofReviews:{
        type: Number,
        default: 0
    },
    reviews: [
        {
            user: {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
                required: true
            },
            name: {
                type: String,
                required: true
            },
            rating: {
                type: String,
                required: true
            },
            comment: {
                type: String,
                required: true
            },
        },
    ],
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Product', productSchema);