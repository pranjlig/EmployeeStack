const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");
const methodOverride = require("method-override");


const employeeRoutes = require("./routes/employees")
const adminRoutes = require("./routes/admin")
const userRoutes = require("./routes/users");

if ( process.env.NODE_ENV !== "production" ) {
    require("dotenv").config()
}

mongoose.connect("mongodb://localhost:27017/employeeApp")
    .then(() => {console.log("Mongoose Connection Open...")})
    .catch((err) => {console.log("Mongoose Connection Error...", err)})


app.set("views", path.join(__dirname, "/views"))
app.set("view engine", "ejs")

app.use(express.urlencoded({ extended: true}));
app.use(methodOverride('_method'));

app.use(express.static(path.join(__dirname, '/public')));

const sessionConfig = {
    // store,
    name: "session",
    secret: "This is secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // expires:  new Date() + 1000*60,
    }
}

app.use(session(sessionConfig));

app.use(flash());
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.warning = req.flash("warning");
    res.locals.info = req.flash("info");
    next();
});



app.use("/employee", employeeRoutes);
app.use("/admin", adminRoutes);
app.use("/", userRoutes)

app.get("*", function (req, res) {
    res.render("error");   
});

app.listen(3000, () => {
    console.log("Serving on port 3000...")
});

