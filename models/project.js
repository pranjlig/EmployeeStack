const mongoose = require("mongoose");
const Employee = require("./employee")

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["In-Progress", "Completed"],
        default: "In-Progress"
    },
    description: {
        type: String
    },
    startDate: {
        type: Date,
        default: new Date(),
        required: true,
    },
    requiredEndDate: {
        type: Date
    },
    terminationDate: {
        type: Date
    },
    totalExpenditure: Number,
    breakdown: [
        {
            _id: {id: false},
            employeeId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Employee"
            },
            employeeName: String,
            projectDetails: [{
                _id: {id: false},
                hours: {
                    type: Number, 
                    min: 0,
                    default: 0
                },
                salaryPerHour: {
                    type: Number, 
                    min: 0,
                    default: 0
                } 
            }],
            expenseOnEmployee: {
                type: Number,
                min: 0
            }
        }
    ],
    total: Number
});

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;