const express = require("express");
const router = express.Router();
const userFunctions = require("../controllers/users")


router.get("/", userFunctions.renderLogin);
router.get("/auth", userFunctions.renderLogin);

router.post("/login", userFunctions.login);

router.post("/signup", userFunctions.signup);

// router.route("/register-admin")
//     .get(userFunctions.renderRegisterAdmin)
//     .post(userFunctions.registerAdmin)

router.route("/forgot-password")
    .get(userFunctions.renderForgotPage)
    .post(userFunctions.forgotPassword)

router.route("/reset/:token")
    .get(userFunctions.renderReset)
    .post(userFunctions.reset)

router.get("/logout", userFunctions.logout)

module.exports = router;