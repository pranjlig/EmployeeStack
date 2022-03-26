const instadate = require("instadate");
const sgMail = require('@sendgrid/mail');
const Entry = require("../models/entry");
const Employee = require("../models/employee");
const Project = require("../models/project");
const CompletedProject = require("../models/completedProject");
const Month = require("../models/month");


module.exports.getMaxAge = () => {
    var dt = new Date();
    const newD = instadate.addDays(dt, 1)
    newD.setHours(0)
    newD.setMinutes(0)
    newD.setSeconds(0)
    return instadate.differenceInSeconds(dt, newD)*1000
}


module.exports.didMonthChange = ( entries ) => {
    if (entries && entries.length){
        const lastEntry = entries[0]
        return (!instadate.isSameMonth(lastEntry.date, new Date()))
    }
    return false
    
}

module.exports.didMonthDataUpdate = async () => {
    const months = await Month.find({}).sort({date: -1}).limit(1);
    if (months.length) {
        if (instadate.isSameMonth(months[0].date, new Date())){
            return true
        }
        else {
            const month = new Month({date: new Date()});
            await month.save();
            return false
        }
    }
    const month = new Month({date: new Date()});
    await month.save();
    return false
}

module.exports.sendMail = async (recipient, subject, message) => {
    try {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        // sgMail.setApiKey(apiKey);
        const msg = {
            to: recipient,
            from: process.env.EMAIL,
            subject,
            text: message,
            html: `${message}`,
        };
        await sgMail.send(msg);
        return true
    } catch (error){
        return false
    }   
}


module.exports.addToMonthWorkHours = (employee, projectId, hours) => {
    let isPresent = false
    let indexOfProject = undefined
    for (let i = 0; i < employee.onGoingProjects.length; i += 1) {
        if ( `${employee.onGoingProjects[i].projectId}` == `${projectId}` ) {          
            indexOfProject = i;
            isPresent = true;
            break
        }
    }
    if ( isPresent ) {
        employee.onGoingProjects[indexOfProject].hourDetails.monthWorkHours += hours;
    }
    else {
        const newOnGoingProject = { projectId, hourDetails: { monthWorkHours: hours, totalWorkHours: 0 } }
        employee.onGoingProjects.push( newOnGoingProject )
    }
}

module.exports.updateMonthData = async () => {
    const employees = await Employee.find({});
    for (const employee of employees){
        if (employee.onGoingProjects && employee.onGoingProjects.length) {
            let totalWorkHoursForLastMonth = 0;
            const breakdowns = employee.onGoingProjects.map( (onGoingProject) => {
                const hours = onGoingProject.hourDetails.monthWorkHours;
                totalWorkHoursForLastMonth += hours
                onGoingProject.hourDetails.totalWorkHours += hours
                onGoingProject.hourDetails.monthWorkHours = 0
                return {
                    projectId: onGoingProject.projectId, 
                    details: { hours: hours, salaryPerHour: 0}
                }
            });
            const savedEmployee = await employee.save()
            // console.log(breakdowns)
            if (breakdowns.length === savedEmployee.onGoingProjects.length) {
                const salaryPerHour = Math.round(((savedEmployee.salary / totalWorkHoursForLastMonth) + Number.EPSILON) * 100) / 100
                // console.log("Total work for the month: ", totalWorkHoursForLastMonth, "Salary per hour", salaryPerHour)
                for (const breakdown of breakdowns) {
                    if (breakdown.details.hours !== 0) {
                        breakdown["details"].salaryPerHour = salaryPerHour; 
                        await addToProjectBreakdown(breakdown, savedEmployee._id, savedEmployee.name)
                    }            
                }
            }
        }
    }
}

const addToProjectBreakdown = async (breakdown, employeeId, employeeName) => {
    let isPresent = false
    let indexOfEmployee = undefined;
    const project = await Project.findById(breakdown.projectId);
    if (project) {
        for (let i = 0; i < project.breakdown.length; i += 1) {
            if ( `${project.breakdown[i].employeeId}` == `${employeeId}` ) {
                indexOfEmployee = i;
                isPresent = true;
                break
            }
        }
        const {hours, salaryPerHour} = breakdown.details
        if ( isPresent ) {       
            project.breakdown[indexOfEmployee].expenseOnEmployee += hours * salaryPerHour
            project.breakdown[indexOfEmployee].projectDetails.push({...breakdown.details});
        }
        else {
            const newEmployeeData = {
                employeeId,
                employeeName,
                projectDetails: [{...breakdown.details}],
                expenseOnEmployee: hours * salaryPerHour
            }
            project.breakdown.push(newEmployeeData)
        }
        // console.log(project.breakdown[indexOfEmployee])
        const savedProject = await project.save()
    } 
} 

module.exports.updateOnGoingProjects = async (employee) => {
    for (const onGoingProject of employee.onGoingProjects) {
        if (onGoingProject.hourDetails.totalWorkHours === 0 && onGoingProject.hourDetails.monthWorkHours === 0) {
            await Employee.findOneAndUpdate(
                {_id: employee._id},
                {$pull: {onGoingProjects: {projectId: onGoingProject.projectId}}}, 
                {new: true, runValidators: true}
            );        
        } else {
            const foundProject = await Project.findById(onGoingProject.projectId);
            if (foundProject && foundProject.status === "Completed") {
                for (const breakdown of foundProject.breakdown) {
                    if ( `${breakdown.employeeId}` == `${employee._id}` ) {
                        const totalAmount = breakdown.expenseOnEmployee  
                        const newCompletedProject = new CompletedProject({
                            employeeId: employee._id,
                            projectId: foundProject._id,
                            totalWorkHours: onGoingProject.hourDetails.totalWorkHours,
                            totalAmount: totalAmount
                        })
                        const savedNewCompletedProject = await newCompletedProject.save()
                        await Employee.findOneAndUpdate(
                            {_id: employee._id},
                            {$pull: {onGoingProjects: {projectId: onGoingProject.projectId}}, $push: {completedProjects: savedNewCompletedProject}}, 
                            {new: true, runValidators: true}
                        );               
                        break
                    }
                }
                
            }
        } 
    }   
}



