const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
    email : {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    resetPasswordCount: {
        type: Number,
        default: 0
    },
    countExpires: Date,
});

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;