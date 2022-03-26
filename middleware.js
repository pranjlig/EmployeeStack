const emailCheck = require('email-check');
const Admin = require("./models/admin");
const Employee = require("./models/employee");

module.exports.validateEmployee = async (req, res, next) => {
    let {name, email, phone, salary, address} = req.body;
    name = name.trim()
    emai = email.trim()
    phone = phone.trim()
    salary = salary.trim()
    address = address.trim()
    const isNameValid = /^[A-Za-z\s]*$/.test(name)   
    if(!name.length || !isNameValid) {
        req.flash('error', 'Name must only contain letters.');
        return res.redirect(req.originalUrl)
    }
    const isPhoneValid = /^\d+$/.test(phone)
    if (phone.length !== 10 || !isPhoneValid){
        req.flash('error', 'Phone number must have 10 digits.');
        return res.redirect(req.originalUrl)
    }
    const isSalaryValid = /^\d+$/.test(salary) || /^\d+\.\d+$/.test(salary)
    if (!salary.length || !isSalaryValid || parseFloat(salary) <= 0) {
        req.flash('error', 'Salary must be digits and greater than 0.');
        return res.redirect(req.originalUrl)
    } 
    if (!address.length) {
        req.flash('error', 'Please provide an address.');
        return res.redirect(req.originalUrl)
    }
    try {
        if (req.path === "/add-employee") {
            const employee = await Employee.findOne({email})
            if (employee) {
                req.flash('error', 'This email id is already registered. Please use another email id.');
                return res.redirect(req.originalUrl)
            }
        }
        
        const isEmailValid = await emailCheck(email)
        if (isNameValid) {
            console.log("checked")
            return next();
        }
        if(!email.length || !isEmailValid) {
            req.flash('error', 'Email is not valid.');
            return res.redirect(req.originalUrl)
        } 
    }
    catch (error){
        console.log(error)
        req.flash('error', 'Email is not valid.');
        return res.redirect(req.originalUrl)
    }       
    next();

}

module.exports.validateEntry = (req, res, next) => {
    let { date, hours, project } = req.body;
    date = date.trim()
    project = project.trim()
    hours = hours.trim()
    if (!date.length || !Date.parse(date)) {
        req.flash('error', 'Date must be a valid date.');
        return res.redirect(req.originalUrl) 
    }
    const isHoursValid = /^\d+$/.test(hours) || /^\d+\.\d+$/.test(hours)
    if (!hours.length || !isHoursValid || parseFloat(hours) <= 0) {
        req.flash('error', 'Hours must be digits and greater than 0.');
        return res.redirect(req.originalUrl) 
    }
    project = project.split(",")
    if (project.length !== 2) {
        req.flash('error', 'Please select a valid project.');
        return res.redirect(req.originalUrl) 
    }
    next();
}

module.exports.validateProject = (req, res, next) => {
    let { projectName, startDate, requiredEndDate} = req.body;
    projectName = projectName.trim();
    startDate = startDate.trim();
    requiredEndDate = requiredEndDate.length ? requiredEndDate.trim() : "";
    if (!projectName.length || !startDate.length) {
        req.flash('error', 'Project Name, Status and Start Date must not be empty.');
        return res.redirect(req.originalUrl)
    }
    if (!Date.parse(startDate)) {
        req.flash('error', '"Start Date" must be a valid date.');
        return res.redirect(req.originalUrl) 
    }
    if (requiredEndDate.length && !Date.parse(requiredEndDate)){
        req.flash('error', '"Required End Date" must be a valid date.');
        return res.redirect(req.originalUrl)
    }
    next();
}

module.exports.isLoggedIn = (req, res, next)=>{
    if (!req.session.user_id) {
        // console.log("not allowed")
        req.flash('error', 'You must be signed in first!');
        res.redirect('/auth');
    } else { 
        next();
    }
}

module.exports.isAuthorized = (req, res, next) => {
    if (req.session.user_id !== req.params.employeeId) {
        // console.log("not authorized")
        req.flash('error', 'You are not authorized to access this route. Please login again.');
        res.redirect("/auth");
        setTimeout(() => {
            req.session.destroy()
            // console.log("session destroyed")
        }, 1000)       
    } else { 
        next();
    }
}


module.exports.isAdmin = async (req, res, next) => {
    const admin = await Admin.findById(req.session.user_id);
    if (!admin) {
        // console.log("not admin")
        req.flash("error", "You do not possess admin rights. Please login again.")
        res.redirect("/auth");
        setTimeout(() => {
            req.session.destroy()
            console.log("session destroyed")
        }, 1000) 
        
    } else { 
        next();
    }
}

// module.exports.isLoggedIn = (req, res, next) => {
//     next()
// }
// module.exports.isAuthorized = (req, res, next) => {
//     next()
// }
// module.exports.isAdmin = (req, res, next) => {
//     next()
// }
 