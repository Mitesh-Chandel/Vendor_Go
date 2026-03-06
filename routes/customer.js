import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { getProducts } from "../data/products.js";
import { getOrders } from "../data/orders.js";
import db from "../data/db.js";

dotenv.config();

const router = express.Router();

// Email configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Function to generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
}

/* ================= SHOP PAGE ================= */
router.get("/shop", async (req, res) => {
  try {
    const products = await getProducts();
    res.render("customer/shop", { products });
  } catch (error) {
    console.error("Shop error:", error);
    res.render("customer/shop", { products: [] });
  }
});

/* ================= VIEW ORDERS ================= */
router.get("/orders", async (req, res) => {
  const result = await db.query(`
    SELECT 
      orders.id,
      orders.customer_name,
      orders.customer_phone,
      orders.total_price,
      orders.status,
      orders.date,
      products.name,
      products.price,
      order_items.quantity
    FROM orders
    JOIN order_items ON orders.id = order_items.order_id
    JOIN products ON order_items.product_id = products.id
    ORDER BY orders.id DESC
  `);

  // Group items by order
  const ordersMap = {};

  result.rows.forEach((row) => {
    if (!ordersMap[row.id]) {
      ordersMap[row.id] = {
        id: row.id,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        totalPrice: row.total_price,
        status: row.status,
        date: row.created_at,
        displayItems: [],
      };
    }

    ordersMap[row.id].displayItems.push({
      name: row.name,
      quantity: row.quantity,
      price: row.price,
    });
  });

  const formattedOrders = Object.values(ordersMap);

  res.render("customer/orders", { orders: formattedOrders });
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

  const existingItem = req.session.cart.find(
    (item) => item.id === productId
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    req.session.cart.push({ ...product, quantity });
  }

  res.redirect("/customer/shop");
});

/* ================= CART PAGE ================= */
router.get("/cart", (req, res) => {
  const cart = req.session.cart || [];

  const grandTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  res.render("customer/cart", {
    cart,
    total: grandTotal,
  });
});

/* ================= QUANTITY CONTROLS ================= */
router.post("/increase-quantity", (req, res) => {
  const productId = parseInt(req.body.productId);
  const cart = req.session.cart || [];

  const item = cart.find((p) => p.id === productId);
  if (item) item.quantity += 1;

  req.session.cart = cart;
  res.redirect("/customer/cart");
});

router.post("/decrease-quantity", (req, res) => {
  const productId = parseInt(req.body.productId);
  const cart = req.session.cart || [];

  const item = cart.find((p) => p.id === productId);

  if (item) {
    item.quantity -= 1;
    if (item.quantity <= 0) {
      req.session.cart = cart.filter((p) => p.id !== productId);
    }
  }

  res.redirect("/customer/cart");
});

router.post("/remove-item", (req, res) => {
  const productId = parseInt(req.body.productId);
  const cart = req.session.cart || [];

  req.session.cart = cart.filter((p) => p.id !== productId);
  res.redirect("/customer/cart");
});

/* ================= PLACE ORDER ================= */
router.post("/place-order", async (req, res) => {
  const { customerName, customerPhone, customerEmail } = req.body;
  const cart = req.session.cart || [];

  console.log("🛒 Place order called");
  console.log("Cart items:", cart.length);

  if (cart.length === 0) {
    console.log("Cart is empty, redirecting to shop");
    return res.redirect("/customer/shop");
  }

  try {
    const grandTotal = cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    console.log("Creating order...");
    // Insert into orders table
    const orderResult = await db.query(
      `INSERT INTO orders 
       (customer_name, customer_phone, customer_email, total_price, status) 
       VALUES ($1,$2,$3,$4,$5) 
       RETURNING *`,
      [customerName, customerPhone, customerEmail, grandTotal, "waiting"]
    );

    const newOrder = orderResult.rows[0];
    console.log("✅ Order created:", newOrder.id);

    // Delete any existing items for this order
    console.log("Clearing old order items...");
    await db.query(`DELETE FROM order_items WHERE order_id = $1`, [newOrder.id]);
    
    // Reset the sequence to be safe
    await db.query(`SELECT setval(pg_get_serial_sequence('order_items', 'id'), (SELECT MAX(id) FROM order_items) + 1)`);
    
    console.log("Adding items to order...");
    for (const item of cart) {
      await db.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES ($1,$2,$3,$4)`,
        [newOrder.id, item.id, item.quantity, item.price]
      );
    }
    console.log("✅ Items added");

    req.session.cart = [];

    // Fetch order items with product details
    console.log("Fetching order items...");
    const itemsResult = await db.query(
      `SELECT oi.*, p.name 
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [newOrder.id]
    );
    console.log("Items fetched:", itemsResult.rows.length);

    // Generate OTP
    const otp = generateOTP();
    console.log("🔐 Generated OTP:", otp);

    // Send OTP via email (non-blocking)
    console.log("📧 Sending OTP email...");
    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: customerEmail,
      subject: "Verify Your Order - OTP ✅",
      html: `
        <h2>Order Verification Required</h2>
        <p>Hello <strong>${customerName}</strong>,</p>
        <p>Your order has been created successfully!</p>
        <p>To complete your order, please enter the verification code below:</p>
        <h1 style="color: #27ae60; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not place this order, please ignore this email.</p>
        <p>Thank you for shopping with Vendor Go!</p>
      `,
    }).catch(error => {
      console.error("⚠️ Email sending failed:", error.message);
    });
    console.log("✅ OTP email queued");

    // Store OTP and order data in session
    req.session.pendingOrder = {
      orderData: {
        id: newOrder.id,
        customerName: newOrder.customer_name,
        customerEmail: newOrder.customer_email,
        customerPhone: newOrder.customer_phone,
        totalPrice: newOrder.total_price,
        status: newOrder.status,
        items: itemsResult.rows
      },
      otp: otp,
      attempts: 0,
      timestamp: Date.now()
    };

    console.log("📄 Rendering OTP verification page");
    res.render("customer/verify-otp", {
      orderId: newOrder.id,
      customerEmail: customerEmail,
    });
  } catch (error) {
    console.error("❌ Order error:", error);
    res.send("Error placing order: " + error.message);
  }
});

/* ================= VERIFY OTP ================= */
router.post("/verify-otp", async (req, res) => {
  const { otp } = req.body;
  const pendingOrder = req.session.pendingOrder;

  console.log("🔐 OTP verification attempted");

  if (!pendingOrder) {
    return res.render("customer/verify-otp", {
      error: "Session expired. Please place your order again.",
    });
  }

  // Check OTP expiry (10 minutes)
  const otpAge = Date.now() - pendingOrder.timestamp;
  if (otpAge > 10 * 60 * 1000) {
    console.log("❌ OTP expired");
    req.session.pendingOrder = null;
    return res.render("customer/verify-otp", {
      error: "OTP expired. Please place your order again.",
    });
  }

  // Check OTP attempts
  pendingOrder.attempts += 1;
  if (pendingOrder.attempts > 5) {
    console.log("❌ Too many OTP attempts");
    req.session.pendingOrder = null;
    return res.render("customer/verify-otp", {
      error: "Too many incorrect attempts. Please place your order again.",
    });
  }

  // Verify OTP
  if (otp === pendingOrder.otp) {
    console.log("✅ OTP verified successfully");
    const orderData = pendingOrder.orderData;
    req.session.pendingOrder = null;

    res.render("customer/order-success", {
      order: orderData,
    });
  } else {
    console.log("❌ Incorrect OTP");
    res.render("customer/verify-otp", {
      error: `Incorrect OTP. ${5 - pendingOrder.attempts} attempts remaining.`,
      orderId: pendingOrder.orderData.id,
      customerEmail: pendingOrder.orderData.customerEmail,
    });
  }
});

export default router;