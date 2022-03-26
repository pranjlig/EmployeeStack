const mongoose = require("mongoose");

const monthSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: new Date(),
        required: true
    }
})

const Month = mongoose.model("Month", monthSchema);

module.exports = Month;