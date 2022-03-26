const mongoose = require("mongoose");
const Project = require("./project");
const Entry = require("./entry");
const CompletedProject = require("./completedProject");

const employeeSchema = new mongoose.Schema({  
    name: {
        type: String,
        required: true
    },
    password: String,
    email: {type: String, required: true, unique: true},
    phone: {type: String, required: true},
    address: {type: String, required: true},
    salary: {
        type: Number, 
        required: true,
        min: 0
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    resetPasswordCount: {
        type: Number,
        default: 0
    },
    countExpires: Date,
    entries: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Entry"
    }],
    onGoingProjects: [{
        _id: {id: false},
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project"
        },
        hourDetails: {
            monthWorkHours: Number,
            totalWorkHours: Number
        }
    }],
    completedProjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "CompletedProject"
    }]
});


const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;