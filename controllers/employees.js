const bcrypt = require("bcrypt");

const Employee = require("../models/employee");
const Project = require("../models/project");
const Entry = require("../models/entry");
const instadate = require("instadate");
const functions = require("./functions");



module.exports.renderAddEntry = async (req, res) => {
    const nowDate = new Date()
    // const lastDate = instadate.lastDateInMonth(nowDate)
    const lastDate = nowDate
    const firstDate = instadate.firstDateInMonth(new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()))
    const maxDate = `${lastDate.getFullYear()}-${("0" + (lastDate.getMonth() + 1)).slice(-2)}-${("0" + lastDate.getDate()).slice(-2)}`
    const minDate = `${firstDate.getFullYear()}-${("0" + (firstDate.getMonth() + 1)).slice(-2)}-${("0" + firstDate.getDate()).slice(-2)}`
    try {
        const projects = await Project.find({status: "In-Progress"});
        const employee = await Employee.findById( req.params.employeeId )
            .populate({path: "entries", match: {date: {$gte: firstDate, $lte: lastDate}}, options: {sort: {"date": -1}}});
        // // await Project.findOneAndUpdate({name: "proj1"},  {status: "Completed"})
        // await Employee.updateMany({}, {entries: [], onGoingProjects: [], completedProjects: []})
        // // employee.entries = []
        // // employee.onGoingProjects = []

        // for (const project of employee.onGoingProjects) {
        //     project.hourDetails.monthWorkHours = project.hourDetails.totalWorkHours
        //     project.hourDetails.totalWorkHours = 0
        // }
        // const savedEmployee = await employee.save();
        // for (const project of projects) {
        //     project.breakdown = []
        //     await project.save()
        // }
        return res.render("employees/employee-task", {projects, employee, maxDate, minDate})
    }
    catch {
        req.flash("error", "Could not find page. Please login.")
        return res.redirect("/auth")
    }
}


module.exports.addEntry = async (req, res) => {

    const { employeeId } = req.params;
    let {date, project, hours, description} = req.body;
    let projectId = project.split(",")[0].trim()
    let projectName = project.split(",")[1].trim()
    hours =  parseFloat(hours.trim())
    date = date.trim()
    const newdate = {year: date.split("-")[0], month: parseInt(date.split("-")[1]) -1, date: date.split("-")[2]}
    const finalDate =  new Date(newdate.year, newdate.month, newdate.date, new Date().getHours(), new Date().getMinutes(), new Date().getSeconds());    
    
    try {
        const newEntry = new Entry({date: finalDate, employeeId, projectId, projectName, description, hours});
        const savedEntry = await newEntry.save();
        // console.log(savedEntry)
    
        const employee = await Employee.findById( employeeId );
        employee.entries.push(savedEntry);
        functions.addToMonthWorkHours(employee, projectId, hours);
        await employee.save();
        req.flash("success", "New entry added.")
        return res.redirect(`/employee/${employeeId}/add-task`)
    }
    catch {
        req.flash("error", "Could not find page. Please login.")
        return res.redirect("/auth")
    }
}


module.exports.deleteEntry = async (req, res) => {
    const {employeeId, entryId} = req.params;
    try {
        const entry = await Entry.findByIdAndDelete(entryId);
        const employee = await Employee.findOneAndUpdate({_id: employeeId}, {$pull: {entries: entryId}}, {new: true, runValidators: true});
        for (let project of employee.onGoingProjects) {
            if (`${project.projectId}` === `${entry.projectId}`) {
                project.hourDetails.monthWorkHours -= entry.hours
                await employee.save()
                req.flash("success", "Successfully deleted the entry.")
                break;
            }
        }
         return res.redirect(`/employee/${employeeId}/add-task`)
    }
    catch {
        req.flash("error", "Could not find page. Please login.")
        return res.redirect("/auth")
    }   
    
}

module.exports.renderProfile = async (req, res) => {
    const { employeeId } = req.params;
    try {
        const employee = await Employee.findById(employeeId)
        return res.render("employees/employee-profile", {employee})
    } catch {
        req.flash("error", "Could not find page.")
        return res.redirect(`/employee/${employeeId}/add-task`)
    }
} 

module.exports.renderChangePassword = async (req, res) => {
    const { employeeId } = req.params;
    try {
        const employee = await Employee.findById(employeeId)
        return res.render("employees/employee-change-password", {employee})
    } catch {
        req.flash("error", "Could not find page.")
        return res.redirect(`/employee/${employeeId}/add-task`)
    }
} 


module.exports.changePassword = async (req, res) => {
    const {employeeId} = req.params
    const {currentPassword, newPassword, confirmPassword } = req.body; 
    if (newPassword !== confirmPassword) {
        req.flash("error", "Passwords did not match.")
        return res.redirect(req.originalUrl)
    } else {
        const employee = await Employee.findOne({ _id: employeeId})
        const isValid = await bcrypt.compare(currentPassword, employee.password)
        if (!isValid) {
            req.flash("error", "Incorrect current password.")
            return res.redirect(req.originalUrl)
        }
        const hash = await bcrypt.hash(newPassword, 12);
        employee.password = hash
        await employee.save()
        req.flash("success", "Successfully changed your password. Please log in with your new password.")
        return res.redirect("/auth")
    }
}