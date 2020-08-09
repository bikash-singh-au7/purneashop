const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    cart:{type: Object, required: true},
    total_amount :{type: Number, required: true},
    customer_address: {type: String},
    customer_name :{type: String},
    customer_mobile :{type: Number}, 
    order_date: {type: Date, required: true, default: Date.now()},
    order_status: {type: Number, default: 0}
});


// Export Schema
module.exports = mongoose.model("offlineOrder", orderSchema);