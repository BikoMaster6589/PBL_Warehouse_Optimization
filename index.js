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












const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 465,
  secure: true, 
  auth: {
    user: "bishtbiko@gmail.com",
    pass: "aips gyqe rpgu uydv",
  },
});


// --------------------------------------------------------
// Get Routes
// --------------------------------------------------------

// Signup route
app.get("/", (req, res) => {
  const sameEmail = req.session.sameEmail || false;
  req.session.sameEmail = null;
  res.render("signup", { sameEmail });
});



// Signin Route
app.get("/signin", (req, res) => {
  const incorrectPass = req.session.incorrectPass || false;
  const userNotFound = req.session.userNotFound || false;
  req.session.incorrectPass = null;
  req.session.userNotFound = null;
  res.render("signin", { incorrectPass,userNotFound });
});


// Make Inventory Route
app.get("/makeInv", (req, res) => {
  res.render("makeInv");
});


// Manage Inventory
app.get("/manageInv", async (req, res) => {
    const { warehouseName } = req.query;
    const binName = req.session.binnid;
    const rackName = req.session.rackkid;
    const result = await db.query("SELECT capacity FROM bins LIMIT 1");
    const capacity = result.rows.length ? result.rows[0].capacity : null;

    if (warehouseName) {
      req.session.warehouseName = warehouseName;
    }

    console.log("Selected warehouse name:", req.session.warehouseName);
    res.render("managingInv", {
      warehouseName: req.session.warehouseName,
      binName,
      rackName,
      capacity
    }); 
});



// Home Route
app.get("/home", (req, res) => {
  const addedProduct = req.session.addedProduct || false;
  const warehouseMsg = req.session.warehouseMsg || false;
  req.session.warehouseMsg = null;
  req.session.addedProduct = null;
  const name = req.session.name;
  const email = req.session.email;
  const cname = req.session.companyName;
  const rack = req.session.rackId;
  const bin = req.session.BinId;
 
  res.render("home",{addedProduct,warehouseMsg,name,email,cname,rack,bin});

  console.log("warehouseMsg:", req.session.warehouseMsg, "addedProduct:", req.session.addedProduct);


});


// Otp Page

app.get("/verify-otp", (req, res) => {
  
  if (!req.session.tempUser || !req.session.tempUser.useremail) {
    return res.redirect("/"); 
  }
  let err;
  if(req.session.msg == 1){
    err = "Invalid Otp";
  }
  req.session.msg = 0;
  res.render("verify-otp.ejs", {
    error : err,
    name: req.session.tempUser.useremail // Safely access useremail now
  });
});
// Warehouse Route
app.get("/warehouse", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT warehouse_id, name, usable_space FROM warehouse WHERE company_name = $1",
      [req.session.companyName]
    );

    // From each Row We are Creating a new Object. Easy to Work in Frontend and Returns JSON value
    const warehouses = result.rows.map((row, index) => ({
      sno: index + 1,
      name: row.name,
      usable_space: row.usable_space,
      id: row.warehouse_id,
    }));
    res.render("warehousese", { warehouses });
  } catch (err) {
    console.error("Error fetching warehouses:", err);
    res.status(500).send("Internal Server Error");
  }
});



// Product page

app.get("/product", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM products WHERE warehouse = $1",
      [req.session.warehouseName]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("No products found for this warehouse.");
    }

    res.render("productList", {
      products: result.rows,
      warehouse: req.session.warehouseName
    });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).send("Internal Server Error");
  }
});




// --------------------------------------------------------
// Post Routes
// --------------------------------------------------------




const {} = app.listen(3000, () => {
  console.log("Server is Running at Port 3000");
});

