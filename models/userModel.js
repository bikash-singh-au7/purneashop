const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt-nodejs");

// create product schema
const userSchema = new Schema({
    user_name: {
        type: String, 
        unique: true,
        required: true, 
    },
    user_email: {
        type: String, 
        required: false
    },
    user_mobile: {
        type: Number, 
        required: true
    },
    user_password: {
        type: String,
        required: true
    },
    user_status: {
        type: Number, 
        required: true, 
        default:1
    }
});

userSchema.methods.encryptPassword = function(password){
    return bcrypt.hashSync(password, bcrypt.genSaltSync(5), null);
}


userSchema.methods.validPassword = function(password){
    return bcrypt.compareSync(password, this.user_password);
}
module.exports = mongoose.model("user", userSchema);