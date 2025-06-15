const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const session = require("express-session");
const pg = require("pg");



const app = express();
const nodemailer = require("nodemailer");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.use(
  session({
    secret: "abc",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 },
  })
);


// --------------------------------------------------------
// Get Routes
// --------------------------------------------------------


app.get("/",(req,res)=>{
    res.send("hello");
})

// --------------------------------------------------------
// Post Routes
// --------------------------------------------------------




const {} = app.listen(3000, () => {
  console.log("Server is Running at Port 3000");
});

