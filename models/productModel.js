const mongoose = require("mongoose");
const Schema = mongoose.Schema;


// create product schema
const productSchema = new Schema({
    product_name: {
        type: String, 
        unique: true,
        required: true, 
    },
    product_desc: {
        type: String, 
        required: false
    },
    product_slag: {
        type: String, 
        required: true
    },
    product_image: {
        type: String
    },
    product_category: {
        type: Object, 
        required: true
    },
    product_mrp: {
        type: Number, 
        required: true
    },
    product_unit: {
        type: String, 
        required: true
    },
    product_price: {
        type: Number, 
        required: true
    },
    product_status: {
        type: Number, 
        required: true, 
        default:1
    },
    product_stock: {
        type: Number, 
        required:true
    }
});


module.exports = mongoose.model("product", productSchema);