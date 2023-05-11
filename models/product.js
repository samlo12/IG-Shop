const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
    url: String,
    filename: String
})

const ProductSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['上身類', '下身類', '鞋袋飾物']
    },
    images: [ImageSchema],
    description: {
        type: String,
        required: true
    },
    createTime: {
        type: Date,
        default: Date.now
    }

})

module.exports = mongoose.model('Product', ProductSchema)