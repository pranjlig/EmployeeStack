const bcrypt = require("bcrypt");
const Project = require("../models/project");
const Employee = require("../models/employee");
const Entry = require("../models/entry");
const CompletedProject = require("../models/completedProject");
const Admin = require("../models/admin");
const functions = require("./functions");

module.exports.renderAddProject = async (req, res) => {
    const projects = await Project.find({}).sort({startDate: -1})
    res.render("admin/admin-project", { projects })
}

module.exports.addProject = async(req, res) => {
    let { projectName: name, startDate, requiredEndDate, description } = req.body;
    name = name.trim();
    startDate = startDate.trim();
    requiredEndDate = requiredEndDate.trim();
    description = description.trim();
    const newStartDate = {year: startDate.split("-")[0], month: parseInt(startDate.split("-")[1]) -1, date: startDate.split("-")[2]}
    const finalStartDate =  new Date(newStartDate.year, newStartDate.month, newStartDate.date, new Date().getHours(), new Date().getMinutes(), new Date().getSeconds())
    let finalRequiredEndDate = null
    if (requiredEndDate) {
        const newRequiredEndDate = {year: requiredEndDate.split("-")[0], month: parseInt(requiredEndDate.split("-")[1]) -1, date: requiredEndDate.split("-")[2]}
        finalRequiredEndDate =  new Date(newRequiredEndDate.year, newRequiredEndDate.month, newRequiredEndDate.date, new Date().getHours(), new Date().getMinutes(), new Date().getSeconds())
    }
    try {
        const newProject = new Project({name, status: "In-Progress", startDate: finalStartDate, requiredEndDate: finalRequiredEndDate, description});
        const savedProject = await newProject.save()
        // console.log(savedProject)
        req.flash("success", "Successfully added new project.")
    } catch {
        req.flash("error", "Error in adding project.")
    }    
    res.redirect("/admin/add-project");
}

module.exports.renderViewProject = async (req, res) => {
    const { projectId } = req.params;
    try {
        // const project = await Project.findById(projectId, {
        //         _id: 1, name: 1, status: 1, description: 1, startDate: 1, requiredEndDate: 1, terminationDate: 1, totalExpenditure: 1, breakdown: 1,
        //         total: { $sum: "$breakdown.expenseOnEmployee" }
        //     })

        const project = await Project.findById(projectId, {
            _id: 1, name: 1, status: 1, description: 1, startDate: 1, requiredEndDate: 1, terminationDate: 1, totalExpenditure: 1, breakdown: 1,
            total: { $sum: "$breakdown.expenseOnEmployee" }
        }).populate("breakdown.employeeId")
        // console.log(project.breakdown[0].employeeId.name)
        return res.render("admin/admin-project-edit", { project });
    }
    catch (error) {
        req.flash("error", "Error in finding project.")
        return res.redirect("/admin/add-project");
    }
}

module.exports.updateProject = async (req, res) => {
    let {projectName: name, startDate, requiredEndDate, description} = req.body;
    name = name.trim();
    // status = status.trim();
    startDate = startDate.trim();
    requiredEndDate = requiredEndDate.trim();
    description = description.trim();
    const newdate = {year: startDate.split("-")[0], month: parseInt(startDate.split("-")[1]) -1, date: startDate.split("-")[2]}
    const finalDate = new Date(newdate.year, newdate.month, newdate.date, new Date().getHours(), new Date().getMinutes(), new Date().getSeconds())
    let finalRequiredEndDate = null
    if (requiredEndDate) {
        const newRequiredEndDate = {year: requiredEndDate.split("-")[0], month: parseInt(requiredEndDate.split("-")[1]) -1, date: requiredEndDate.split("-")[2]}
        finalRequiredEndDate =  new Date(newRequiredEndDate.year, newRequiredEndDate.month, newRequiredEndDate.date, new Date().getHours(), new Date().getMinutes(), new Date().getSeconds())
    }
    try {
        await Project.findOneAndUpdate(
            {_id: req.params.projectId},
            {name, startDate: finalDate, requiredEndDate: finalRequiredEndDate, description},
            {new: true, runValidators: true}
        )
        req.flash("success", "Successfully updated the project.")
        return res.redirect(`/admin/projects/${req.params.projectId}`)
    } catch {
        req.flash("error", "Error in updating the project.")
    }    
    return res.redirect(`/admin/add-project`)
}

module.exports.deleteProject = async (req, res) => {
    const {projectId} = req.params
    try {        
        await Employee.updateMany(
            {"onGoingProjects.projectId": projectId},
            {$pull: {onGoingProjects: {projectId: projectId}}}
        )
        const employees = await Employee.find({}).populate("entries").populate("completedProjects")
        for (const employee of employees) {
            const lengthOfEntriesBeforeFilter = employee.entries.length;
            employee.entries = employee.entries.filter(entry => entry.projectId != projectId);
            const isEntriesUpdated = lengthOfEntriesBeforeFilter > employee.entries.length;
            const lengthOfCompletedProjectsBeforeFilter = employee.completedProjects.length;
            employee.completedProjects = employee.completedProjects.filter(project => project.projectId != projectId);
            const isCompletedProjectsUpdated = lengthOfCompletedProjectsBeforeFilter > employee.completedProjects.length;
            if (isEntriesUpdated || isCompletedProjectsUpdated) {
                await employee.save();
            }
        }
        await Entry.deleteMany({projectId: projectId})
        await CompletedProject.deleteMany({projectId: projectId})
        const project = await Project.findOneAndDelete({_id: projectId})  
        req.flash("success", `Successfully deleted the project: ${project.name}.`)
    } catch (e) {
        req.flash("error", "Error in deleting the project.")
    }      
    return res.redirect("/admin/add-project")
}

module.exports.terminateProject = async (req, res) => {
    try {
        const project = await Project.findOne({_id: req.params.projectId})
        if (project.status === "Completed") {
            req.flash("info", `The project is already terminated.`)
            return res.redirect(`/admin/projects/${req.params.projectId}`)
        } else {
            project.status = "Completed"
            project.terminationDate = new Date()
            await project.save()
            req.flash("success", `Successfully terminated the project.`)
            return res.redirect(`/admin/projects/${req.params.projectId}`)
        }
        
    } catch {
        req.flash("error", "Error in terminating the project.")
    }   
    return res.redirect(`/admin/add-project`)   
}

module.exports.renderAddEmployee = async (req, res) => {
    const employees = await Employee.find({}).sort({name: 1})
    res.render("admin/admin-employee", {employees})
}

module.exports.addEmployee = async (req, res) => {
    const { name, email, phone, salary, address } = req.body;
    try {
        const newEmployee = new Employee({name: name.trim(), email: email.trim(), phone: phone.trim(), salary: salary.trim(), address: address.trim()});
        const savedEmployee = await newEmployee.save();
        // console.log(savedEmployee)
        const isSent = await functions.sendMail(savedEmployee.email, "Registration Id", `Your Registration Id is: ${savedEmployee._id}`)
        if (isSent) {
            req.flash("success", "Successfully added employee. The registration id for the new employee is sent to the registered email address. Please check the spam folder if not received in inbox.")
        } else {
            req.flash("warning", "Successfully added employee. Error in mailing registration id. Please collect from admin.")
        }
        
    } catch {
        req.flash("error", "Error in adding employee.")
    }        
    res.redirect("/admin/add-employee")
}

module.exports.renderViewEmployee = async (req, res) => {
    const { employeeId } = req.params;
    try {
        const employee = await Employee.findById(employeeId).populate("entries")
        return res.render("admin/admin-view-employee", { employee });
    }
    catch {
        req.flash("error", "Could not find employee.")
        return res.redirect("/admin/add-employee")
    }
}

module.exports.updateEmployee = async (req, res) => {
    const {employeeId} = req.params
    const {name, phone, salary, email, address} = req.body;
    try {
        await Employee.findOneAndUpdate(
            {_id: employeeId},
            {name: name.trim(), email: email.trim(), phone: phone.trim(), salary: salary.trim(), address: address.trim()},
            {new: true, runValidators: true}
        )
        req.flash("success", "Successfully updated the employee.")
    } catch {
        req.flash("error", "Error in updating the employee.")
    }            
    return res.redirect(`/admin/add-employee`)
}

module.exports.deleteEmployee = async (req, res) => {
    const { employeeId } = req.params;
    try {
        await Entry.deleteMany({employeeId: employeeId})
        await CompletedProject.deleteMany({employeeId: employeeId})
        await Employee.findByIdAndDelete(employeeId)
        req.flash("success", "Successfully deleted the employee.")
    } catch {
        req.flash("error", "Error in deleting the employee.")
    }         
    return res.redirect("/admin/add-employee")
}

module.exports.renderChangePassword = async (req, res) => {
    res.render("admin/admin-change-password");
} 


module.exports.changePassword = async (req, res) => {
    const {currentPassword, newPassword, confirmPassword } = req.body; 
    if (newPassword !== confirmPassword) {
        req.flash("error", "Passwords did not match.")
        return res.redirect(req.originalUrl)
    } else {
        const admin = await Admin.findOne({})
        const isValid = await bcrypt.compare(currentPassword, admin.password)
        if (!isValid) {
            req.flash("error", "Incorrect current password.")
            return res.redirect(req.originalUrl)
        }
        const hash = await bcrypt.hash(newPassword, 12);
        admin.password = hash
        await admin.save()
        req.flash("success", "Successfully changed your password. Please log in with your new password.")
        return res.redirect("/auth")
    }
}