const { min } = require("instadate");
const mongoose = require("mongoose");
const Employee = require("./employee")

const completedProjectSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee"
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project"
    },
    totalWorkHours: {
        type: Number,
        min: 0
    },
    totalAmount: {
        type: Number,
        min: 0
    }
});

const CompletedProject = mongoose.model("CompletedProject", completedProjectSchema);

module.exports = CompletedProject;