const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const categorySchema = new Schema({
    category_name:{
        type: String,
        trim: true,
        required: true,
        unique: true
    },    
    category_slag:{
        type: String,
        trim: true,
        required: false
    },
    category_status:{
        type: Number,
        default:1,
        required: true
    },
    created_date:{
        type: Date,
		default: Date.now
    }
});

// Export module
module.exports = mongoose.model("category", categorySchema);