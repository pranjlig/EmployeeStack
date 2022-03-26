const mongoose = require("mongoose");
const Employee = require("./employee")
const Project = require("./project")

const entrySchema = new mongoose.Schema({
    projectName: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true,
        // max: new Date()
    },
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee"
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project"
    },
    hours: {
        type: Number,
        required: true
    },
    description: String,
});

const Entry = mongoose.model("Entry", entrySchema);

module.exports = Entry;