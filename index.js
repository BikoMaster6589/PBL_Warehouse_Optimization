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

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "Warehouse_Db",
  password: "mohan",
  port: 5432,
});

db.connect();

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


function knapsack01(items, capacity) {
  const n = items.length;
  const dp = Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(0));

  const weights = items.map(item => item.size * item.quant);
  const values = items.map(item => {
    if (item.priority === 'High') return 2;
    if (item.priority === 'Medium') return 1;
    return 0;
  });

  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      if (weights[i - 1] <= w) {
        dp[i][w] = Math.max(
          values[i - 1] + dp[i - 1][w - weights[i - 1]],
          dp[i - 1][w]
        );
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  const selected = [];
  let w = capacity;
  for (let i = n; i > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      selected.push(items[i - 1]);
      w -= weights[i - 1];
    }
  }

  return selected;
}
app.post("/retrieve-product", async (req, res) => {
  const productName = req.body.productName;
  const q = parseInt(req.body.quannn);
  console.log(q);
  if (isNaN(q) || q <= 0) {
    return res.status(400).send("Invalid quantity entered.");
  }

  try {
    const result = await db.query(
      `SELECT bin_id, rack_id, quantity FROM products
       WHERE name = $1 AND warehouse = $2 AND company_name = $3 LIMIT 1`,
      [productName, req.session.warehouseName, req.session.companyName]
    );

    if (result.rows.length > 0) {
      const { bin_id, rack_id, quantity } = result.rows[0];

      if (quantity >= q) {
        const newQuantity = quantity - q;
        if(newQuantity>0){
        await db.query(
          `UPDATE products
           SET quantity = $1
           WHERE name = $2 AND warehouse = $3 AND company_name = $4`,
          [newQuantity, productName, req.session.warehouseName, req.session.companyName]
        );
      }
      else{
         await db.query(
      `DELETE FROM products
       WHERE name = $1 AND warehouse = $2 AND company_name = $3`,
      [productName, req.session.warehouseName, req.session.companyName]
    );
      }

        res.render("managingInv", {
          rackName: rack_id,
          binName: bin_id,
          warehouseName: req.session.warehouseName
        });
      } else {
        res.send(⁠`Not enough stock. Available: ${quantity}, Requested: ${q}⁠`);
      }

    } else {
      res.send(`⁠❌ Product "${productName}" not found.`);
    }
  } catch (err) {
    console.error("Error retrieving or updating product:", err);
    res.status(500).send("Internal Server Error");
  }
});





const {} = app.listen(3000, () => {
  console.log("Server is Running at Port 3000");
});

