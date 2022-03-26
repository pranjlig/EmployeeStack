const express = require("express");
const router = express.Router();
const employeeFunctions = require("../controllers/employees");
const middleware = require("../middleware")

router.route("/:employeeId/add-task")
    .get(middleware.isLoggedIn, middleware.isAuthorized, employeeFunctions.renderAddEntry)
    .post(middleware.isLoggedIn, middleware.isAuthorized, middleware.validateEntry, employeeFunctions.addEntry)


router.delete("/:employeeId/delete-task/:entryId", middleware.isLoggedIn, middleware.isAuthorized, employeeFunctions.deleteEntry)

router.get("/:employeeId/profile", middleware.isLoggedIn, middleware.isAuthorized, employeeFunctions.renderProfile)

router.route("/:employeeId/change-password")
    .get(middleware.isLoggedIn, middleware.isAuthorized, employeeFunctions.renderChangePassword)
    .post(middleware.isLoggedIn, middleware.isAuthorized, employeeFunctions.changePassword)
    
module.exports = router