import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { getProducts, getProductById } from "../data/products.js";
import db from "../data/db.js";

dotenv.config();

const router = express.Router();

/* ================= EMAIL SETUP ================= */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/* ================= SHOP PAGE ================= */

router.get("/shop", async (req, res) => {
  try {
    const products = await getProducts();
    res.render("customer/shop", { products });
  } catch {
    res.render("customer/shop", { products: [] });
  }
});

/* ================= PRODUCT DETAIL ================= */

router.get("/product/:id", async (req, res) => {
  try {
    const product = await getProductById(parseInt(req.params.id));

    if (!product) {
      return res.redirect("/customer/shop");
    }

    res.render("customer/product-detail", { product });
  } catch {
    res.redirect("/customer/shop");
  }
});

/* ================= VIEW ORDERS ================= */

router.get("/orders", async (req, res) => {

  if (!req.session.customerEmail) {
    return res.redirect("/customer/shop");
  }

  const result = await db.query(`
    SELECT 
      o.id,
      o.total_price,
      o.status,
      o.date,
      p.name,
      p.price,
      oi.quantity
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE o.customer_email = $1
    ORDER BY o.date DESC
  `,[req.session.customerEmail]);

  const ordersMap = {};

  result.rows.forEach(row => {

    if (!ordersMap[row.id]) {
      ordersMap[row.id] = {
        id: row.id,
        totalPrice: row.total_price,
        status: row.status,
        date: row.date,
        displayItems: []
      };
    }

    ordersMap[row.id].displayItems.push({
      name: row.name,
      quantity: row.quantity,
      price: row.price
    });

  });

  res.render("customer/orders", {
    orders: Object.values(ordersMap)
  });

});

/* ================= ADD TO CART ================= */

router.post("/add-to-cart", async (req, res) => {

  const productId = parseInt(req.body.productId);
  const quantity = parseInt(req.body.quantity) || 1;

  const result = await db.query(
    "SELECT * FROM products WHERE id=$1",
    [productId]
  );

  if (!result.rows.length) return res.redirect("/customer/shop");

  const product = result.rows[0];

  if (!req.session.cart) req.session.cart = [];

  const existing = req.session.cart.find(i => i.id === productId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    req.session.cart.push({ ...product, quantity });
  }

  res.redirect("/customer/shop");

});

/* ================= CART PAGE ================= */

router.get("/cart", (req,res)=>{

  const cart = req.session.cart || [];

  const total = cart.reduce(
    (sum,item)=>sum + item.price * item.quantity,0
  );

  res.render("customer/cart",{
    cart,
    total
  });

});

/* ================= QUANTITY CONTROLS ================= */

router.post("/increase-quantity",(req,res)=>{

  const productId = parseInt(req.body.productId);
  const cart = req.session.cart || [];

  const item = cart.find(p=>p.id === productId);
  if(item) item.quantity++;

  req.session.cart = cart;

  res.redirect("/customer/cart");

});

router.post("/decrease-quantity",(req,res)=>{

  const productId = parseInt(req.body.productId);
  const cart = req.session.cart || [];

  const item = cart.find(p=>p.id === productId);

  if(item){
    item.quantity--;
    if(item.quantity <= 0){
      req.session.cart = cart.filter(p=>p.id !== productId);
    }
  }

  res.redirect("/customer/cart");

});

router.post("/remove-item",(req,res)=>{

  const productId = parseInt(req.body.productId);

  req.session.cart =
    (req.session.cart || []).filter(p=>p.id !== productId);

  res.redirect("/customer/cart");

});

/* ================= PLACE ORDER ================= */

router.post("/place-order", async (req, res) => {

  const { customerName, customerPhone, customerEmail } = req.body;
  const cart = req.session.cart || [];

  if (cart.length === 0) {
    return res.redirect("/customer/shop");
  }

  try {

    const grandTotal = cart.reduce(
      (t,i)=> t + i.price * i.quantity ,0
    );

    /* INSERT ORDER */

    const orderResult = await db.query(
      `INSERT INTO orders
       (customer_name, customer_phone, customer_email, total_price, status)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [customerName,customerPhone,customerEmail,grandTotal,"waiting"]
    );

    const newOrder = orderResult.rows[0];

    /* 🔔 LIVE ORDER EVENT */

    const io = req.app.get("io");

    io.emit("newOrder",{
      orderId:newOrder.id,
      customer:newOrder.customer_name,
      total:newOrder.total_price
    });

    /* INSERT ORDER ITEMS */

    for(const item of cart){

      await db.query(
        `INSERT INTO order_items
         (order_id,product_id,quantity,price)
         VALUES ($1,$2,$3,$4)`,
        [newOrder.id,item.id,item.quantity,item.price]
      );

    }

    req.session.cart = [];

    /* FETCH ITEMS */

    const items = await db.query(
      `SELECT oi.*,p.name
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id=$1`,
      [newOrder.id]
    );

    /* OTP */

    const otp = generateOTP();

    transporter.sendMail({
      from:process.env.EMAIL_USER,
      to:customerEmail,
      subject:"Verify Your Order - OTP",
      html:`
        <h2>Order Verification</h2>
        <p>Hello <b>${customerName}</b></p>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>Valid for 10 minutes</p>
      `
    }).catch(()=>{});

    req.session.pendingOrder = {
      orderData:{
        id:newOrder.id,
        customerName:newOrder.customer_name,
        customerEmail:newOrder.customer_email,
        customerPhone:newOrder.customer_phone,
        totalPrice:newOrder.total_price,
        status:newOrder.status,
        items:items.rows
      },
      otp,
      attempts:0,
      timestamp:Date.now()
    };

    req.session.customerEmail = customerEmail;
    req.session.orderId = newOrder.id;

    res.render("customer/verify-otp",{
      orderId:newOrder.id,
      customerEmail
    });

  } catch(error){

    res.send("Error placing order: "+error.message);

  }

});

/* ================= VERIFY OTP ================= */

router.post("/verify-otp",(req,res)=>{

  const {otp} = req.body;
  const pending = req.session.pendingOrder;

  const customerEmail = req.session.customerEmail || "";
  const orderId = req.session.orderId || "";

  if(!pending){
    return res.render("customer/verify-otp",{
      error:"Session expired",
      orderId,
      customerEmail
    });
  }

  if(Date.now() - pending.timestamp > 10*60*1000){
    req.session.pendingOrder=null;

    return res.render("customer/verify-otp",{
      error:"OTP expired",
      orderId,
      customerEmail
    });
  }

  pending.attempts++;

  if(pending.attempts > 5){
    req.session.pendingOrder=null;

    return res.render("customer/verify-otp",{
      error:"Too many attempts",
      orderId,
      customerEmail
    });
  }

  if(otp === pending.otp){

    const order = pending.orderData;

    req.session.pendingOrder=null;
    req.session.orderId=null;

    res.render("customer/order-success",{order});

  }else{

    res.render("customer/verify-otp",{
      error:`Incorrect OTP. ${5-pending.attempts} attempts left`,
      orderId,
      customerEmail
    });

  }

});

export default router;