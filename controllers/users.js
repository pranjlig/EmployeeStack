const bcrypt = require("bcrypt");
const crypto = require('crypto');
const instadate = require("instadate");
const functions = require("./functions");
const Employee = require("../models/employee");
const Admin = require("../models/admin");

module.exports.renderLogin = (req, res) => {
    res.render("users/auth")
}

module.exports.signup = async (req, res) => {
    const { id, password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
        req.flash("error", "Passwords did not match.")
        res.redirect("/auth")
    }
    else {
        try {
            const employee = await Employee.findOne({_id: id}) 
            if (employee.password) {
                req.flash("error", "This user is already registered. Please log in instead of sign up.")
                return res.redirect("/auth")
            }         
            const hash = await bcrypt.hash(password, 12);
            employee.password = hash
            await employee.save()
            req.session.user_id = employee._id
            req.flash("success", "Successfully registered.")
            return res.redirect(`/employee/${employee._id}/add-task`)
        }
        catch (error){
            req.flash("error", "User not found. Please check your id or get yourself registered by the admin if not done.")
            res.redirect("/auth")
        }
    }
}

module.exports.login = async (req, res) => {
    let user = undefined
    const { email, password, type } = req.body
    if (type === "none") {
        req.flash("error", "Please select a type.")
        return res.redirect("/auth")
    }
    if (type === "Admin") {
        user = await Admin.findOne({ email })
    }
    else if (type === "Employee") {
        user = await Employee.findOne({ email });
    }  
    if (!user) {
        req.flash("error", "Email or password or account type is incorrect.")
        return res.redirect("/auth")
    }
    else {
        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) {
            req.flash("error", "Email or password or account type is incorrect.")
            return res.redirect("/auth")
        }
        else {
            req.session.user_id = user._id
            req.session.cookie.maxAge = functions.getMaxAge()
            // console.log(req.session)
            const isMonthDataUpdated = await functions.didMonthDataUpdate()
            if (!isMonthDataUpdated) {
                await functions.updateMonthData()
            }
            if (type === "Admin") {
                // console.log("session-admin", req.session.user_id)
                return res.redirect("/admin/add-project")
            }
            else if (type === "Employee") {
                const employee = await Employee.findById( user._id ).populate({path: "entries", options: {sort: {"date": -1}}});
                const isMonthChanged = functions.didMonthChange(employee.entries)
                if (isMonthChanged) {
                    await functions.updateOnGoingProjects(employee)
                }
                return res.redirect(`/employee/${user._id}/add-task`)
            }            
        }
    }
}


module.exports.renderRegisterAdmin = (req, res) => {
    res.render("users/register-admin")
}

module.exports.registerAdmin = async (req, res) => {
    const {email, password, confirmPassword } = req.body
    if (password !== confirmPassword) {
        req.flash("error", "Passwords did not match.")
        return res.redirect("/register-admin")
    }
    const hash = await bcrypt.hash(password, 12);
    const admin = new Admin({email, password: hash})
    const savedAdmin = await admin.save()            
    req.session.user_id = savedAdmin._id
    req.flash("success", "Successfully registered.")
    res.redirect("/admin/add-project")
}

module.exports.logout = (req, res) => {   
    // console.log("before", req.session, req.session.user_id)
    req.flash("success", "Successfully logged out.")
    res.redirect("/auth");
    setTimeout(() => {
        req.session.destroy()
        // console.log("session destroyed")
    }, 1000) 
    // console.log("after", req.session)
    res.redirect("/auth")
}

module.exports.renderForgotPage = (req, res) => {
    res.render("users/forgot-password");
}

module.exports.forgotPassword = async (req, res) => {
    const { email, type } = req.body
    // const user = await Employee.findOne({ email }) || await Admin.findOne({ email })
    let user = undefined
    if (type === "none") {
        req.flash("error", "Please select a type.")
        return res.redirect("/auth")
    }
    if (type === "Admin") {
        user = await Admin.findOne({ email })
    }
    else if (type === "Employee") {
        user = await Employee.findOne({ email });
    }  
    if (!user) {
        req.flash('error', 'No account with that email address exists.');
        return res.redirect('/forgot');
    }
    if (user.resetPasswordCount === 2 && Math.abs(instadate.differenceInDates(new Date(), user.countExpires)) === 0) {
        req.flash('error', 'You have exceeded the maximum attempts. Please try again tomorrow.');
        return res.redirect("/auth")
    } else {
        if (user.resetPasswordCount > 0 && Math.abs(instadate.differenceInDates(new Date(), user.countExpires)) > 0) {
            user.resetPasswordCount = 1
        }
        else {
            user.resetPasswordCount += 1;
        }
        user.countExpires = new Date()
        crypto.randomBytes(20, async function(err, buf) {
            const token = buf.toString('hex');
            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 3600000;
            await user.save()
            const message = 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'http://' + req.headers.host + '/reset/' + token + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            const isSent = await functions.sendMail(user.email, "Password Reset Token", message)
            if (isSent) {
                req.flash('success', 'Link to reset your password has been mailed to your registered email address. Please check spam folder if not recieved in inbox.');  
            } else{
                req.flash('error', 'Could not mail the link to reset your password. Please try after some time.');  
            }
            return res.redirect("/auth")
        });    
    } 
}

module.exports.renderReset = (req, res) => {
    res.render("users/reset");
}

module.exports.reset = async (req, res) => {
    const { password, confirmPassword } = req.body
    if (password !== confirmPassword) {
        req.flash("error", "Passwords did not match.")
        res.redirect(req.originalUrl)
    }
    else {
        const user = await Employee.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }) || await Admin.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });
        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('back');
        }    
        const hash = await bcrypt.hash(password, 12);
        user.password = hash
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save()
        req.flash("success", "Successfully changed your password.")
        return res.redirect("/auth")
    }
}
