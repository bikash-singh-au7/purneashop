const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const addressSchema = new Schema({
    user_id:{
        type: Schema.Types.ObjectId,
        ref:'user',
        required:true
    },
    user_name:{
        type: String,
        required: true
    },
    user_mobile:{
        type: Number,
        required: true
    },
    landmark:{
        type: String,
        required:true
    },
    address:{
        type: String,
        required:true
    },
    pincode:{
        type: Number,
        required:true
    },
    address_type:{
        type: String,
        required:true
    }
});


// Export Schema
module.exports = mongoose.model("address", addressSchema);