const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const adminSchema = new Schema({
    user_name:{
        type: String,
        required:true
    },
    user_password:{
        type: String,
        required:true
    },
    user_status:{
        type: Number,
        required:true
    }
});


// Export Schema
module.exports = mongoose.model("admin", adminSchema);