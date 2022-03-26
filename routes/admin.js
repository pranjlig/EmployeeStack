const express = require("express");
const adminFunctions = require("../controllers/admin");
const router = express.Router();
const middleware = require("../middleware")

router.route("/add-project")
    .get(middleware.isLoggedIn, middleware.isAdmin, adminFunctions.renderAddProject)
    .post(middleware.isLoggedIn, middleware.isAdmin, middleware.validateProject, adminFunctions.addProject)

router.route("/projects/:projectId")
    .get(middleware.isLoggedIn, middleware.isAdmin, adminFunctions.renderViewProject)
    .post(middleware.isLoggedIn, middleware.isAdmin, middleware.validateProject, adminFunctions.updateProject)
    .delete(middleware.isLoggedIn, middleware.isAdmin, adminFunctions.deleteProject)

router.post("/projects/:projectId/terminate", middleware.isLoggedIn, middleware.isAdmin, adminFunctions.terminateProject)

router.route("/add-employee")
    .get(middleware.isLoggedIn, middleware.isAdmin, adminFunctions.renderAddEmployee)
    .post(middleware.isLoggedIn, middleware.isAdmin, middleware.validateEmployee, adminFunctions.addEmployee)

router.route("/employees/:employeeId")
    .get(middleware.isLoggedIn, middleware.isAdmin, adminFunctions.renderViewEmployee)
    .post(middleware.isLoggedIn, middleware.isAdmin, middleware.validateEmployee, adminFunctions.updateEmployee)
    .delete(middleware.isLoggedIn, middleware.isAdmin, adminFunctions.deleteEmployee)

router.route("/change-password")
    .get(middleware.isLoggedIn, middleware.isAdmin, adminFunctions.renderChangePassword)
    .post(middleware.isLoggedIn, middleware.isAdmin, adminFunctions.changePassword)


module.exports = router;