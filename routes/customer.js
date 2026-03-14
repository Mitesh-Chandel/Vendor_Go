import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
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

    const result = await db.query(`
      SELECT DISTINCT ON (p.id)
        p.id,
        p.name,
        p.image,
        vp.price,
        vp.id AS vendor_product_id
      FROM products p
      JOIN vendor_products vp ON vp.product_id = p.id
      ORDER BY p.id, vp.price ASC
    `);

    res.render("customer/shop", {
      products: result.rows
    });

  } catch (error) {
    console.log(error);
    res.render("customer/shop", { products: [] });
  }
});

/* ================= PRODUCT DETAIL ================= */

router.get("/product/:id", async (req, res) => {
  try {

    const result = await db.query(`
      SELECT 
        vp.id AS vendor_product_id,
        p.name,
        p.description,
        p.image,
        vp.price,
        v.name AS vendor_name,
        v.email AS vendor_email
    
      FROM vendor_products vp
      JOIN products p ON vp.product_id = p.id
      JOIN vendors v ON vp.vendor_id = v.id
      WHERE p.id = $1
    `,[req.params.id]);

   res.render("customer/product-detail", {
  product: result.rows[0],
  vendors: result.rows
});

  } catch (error) {
    console.log(error);
    res.redirect("/customer/shop");
  }
});

/* ================= VIEW ORDERS ================= */

router.get("/orders", async (req, res) => {


    if (!req.session.customerEmail) {
    return res.render("customer/orders", { orders: [] });
  }

  console.log("Session Email:", req.session.customerEmail);

  if (!req.session.customerEmail) {
    return res.render("customer/orders", { orders: [] });
  }

  const result = await db.query(`
    SELECT 
      o.id,
      o.total_price,
      o.date,
      p.name,
      oi.price,
      oi.quantity,
      oi.status
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN vendor_products vp ON oi.vendor_product_id = vp.id
    JOIN products p ON vp.product_id = p.id
    WHERE o.customer_email = $1
    ORDER BY o.date DESC
  `,[req.session.customerEmail]);

  const ordersMap = {};

  result.rows.forEach(row => {

    if (!ordersMap[row.id]) {
      ordersMap[row.id] = {
        id: row.id,
        totalPrice: row.total_price,
        date: row.date,
        displayItems: []
      };
    }

    ordersMap[row.id].displayItems.push({
      name: row.name,
      quantity: row.quantity,
      price: row.price,
      status: row.status
    });

  });

  res.render("customer/orders", {
    orders: Object.values(ordersMap)
  });

});

/* ================= ADD TO CART ================= */

router.post("/add-to-cart", async (req, res) => {

const vendorProductId = Number(req.body.vendorProductId);
const quantity = Number(req.body.quantity) || 1;

if (!vendorProductId) {
  return res.redirect("/customer/shop");
}

const result = await db.query(`
  SELECT 
    vp.id AS vendor_product_id,
    p.name,
    p.image,
    vp.price,
    v.name AS vendor,
    v.email AS vendor_email
  FROM vendor_products vp
  JOIN products p ON vp.product_id = p.id
  JOIN vendors v ON vp.vendor_id = v.id
  WHERE vp.id = $1
`, [vendorProductId]);

if (!result.rows.length) return res.redirect("/customer/shop");

const product = result.rows[0];

if (!req.session.cart) req.session.cart = [];

const existing = req.session.cart.find(
  i => i.vendor_product_id === vendorProductId
);

if (existing) {
  existing.quantity += quantity;
} else {
  req.session.cart.push({ ...product, quantity });
}

res.redirect("/customer/shop");

});


//   new add ed route
router.get("/vendor-product/:id", async (req, res) => {
  try {
    const vendorProductId = req.params.id;
    
    // Step 1: Get specific vendor product details
    const specificResult = await db.query(`
      SELECT 
        vp.id AS vendor_product_id,
        p.name,
        p.description,
        p.image,
        vp.price,
        v.name AS vendor_name,
        v.email AS vendor_email,
        vp.product_id  -- Need this for step 2
      FROM vendor_products vp
      JOIN products p ON vp.product_id = p.id
      JOIN vendors v ON vp.vendor_id = v.id
      WHERE vp.id = $1
    `, [vendorProductId]);

    if (specificResult.rows.length === 0) {
      return res.redirect("/customer/shop");
    }

    const product = specificResult.rows[0];
    
    // Step 2: Get ALL vendors for the same product
    const allVendorsResult = await db.query(`
      SELECT 
        vp.id AS vendor_product_id,
        vp.price,
        v.name AS vendor_name,
        v.email AS vendor_email
      FROM vendor_products vp
      JOIN vendors v ON vp.vendor_id = v.id
      WHERE vp.product_id = $1
    `, [product.product_id]);

    res.render("customer/product-detail", {
      product,
      vendors: allVendorsResult.rows  // Now has all vendors!
    });
  } catch (error) {
    console.error(error);
    res.redirect("/customer/shop");
  }
});

/* ================= CART PAGE ================= */

router.get("/cart", (req, res) => {

  const cart = req.session.cart || [];

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  );

  res.render("customer/cart", {
    cart,
    total
  });

});

/* ================= QUANTITY CONTROLS ================= */

router.post("/increase-quantity", (req, res) => {

  const productId = parseInt(req.body.productId);
  const cart = req.session.cart || [];

  const item = cart.find(p => p.vendor_product_id === productId);
  if (item) item.quantity++;

  req.session.cart = cart;

  res.redirect("/customer/cart");

});

router.post("/decrease-quantity", (req, res) => {

  const productId = parseInt(req.body.productId);
  const cart = req.session.cart || [];

  const item = cart.find(p => p.vendor_product_id === productId);

  if (item) {
    item.quantity--;

    if (item.quantity <= 0) {
      req.session.cart = cart.filter(
        p => p.vendor_product_id !== productId
      );
    }
  }

  res.redirect("/customer/cart");

});

router.post("/remove-item", (req, res) => {

  const productId = parseInt(req.body.productId);

  req.session.cart =
    (req.session.cart || []).filter(
      p => p.vendor_product_id !== productId
    );

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
      (t, i) => t + i.price * i.quantity, 0
    );

    await db.query("BEGIN");

    // INSERT ORDER
    const orderResult = await db.query(
      `INSERT INTO orders
        (customer_name, customer_phone, customer_email, total_price)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [customerName, customerPhone, customerEmail, grandTotal]
    );

    const newOrder = orderResult.rows[0];

    // INSERT ORDER ITEMS
    for (const item of cart) {

      await db.query(
        `INSERT INTO order_items
          (order_id, vendor_product_id, quantity, price, status)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          newOrder.id,
          item.vendor_product_id,
          item.quantity,
          item.price,
          "waiting"
        ]
      );

    }

    await db.query("COMMIT");

    req.session.cart = [];

    // FETCH ORDER ITEMS
    const items = await db.query(
      `SELECT oi.*, p.name
       FROM order_items oi
       JOIN vendor_products vp ON oi.vendor_product_id = vp.id
       JOIN products p ON vp.product_id = p.id
       WHERE oi.order_id = $1`,
      [newOrder.id]
    );

    const otp = generateOTP();

    // SEND OTP EMAIL
    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: customerEmail,
      subject: "Verify Your Order - OTP",
      html: `
        <h2>Order Verification</h2>
        <p>Hello <b>${customerName}</b></p>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>Valid for 10 minutes</p>
      `
    }).catch(() => {});

    // STORE ORDER IN SESSION
    req.session.pendingOrder = {
      orderData: {
        id: newOrder.id,
        customerName: newOrder.customer_name,
        customerEmail: newOrder.customer_email,
        customerPhone: newOrder.customer_phone,
        totalPrice: newOrder.total_price,
        status: "waiting",
        items: items.rows
      },
      otp,
      attempts: 0,
      timestamp: Date.now()
    };

    req.session.customerEmail = customerEmail;
    req.session.orderId = newOrder.id;

    res.render("customer/verify-otp", {
      orderId: newOrder.id,
      customerEmail
    });

  } catch (error) {

    await db.query("ROLLBACK");
    console.error(error);
    res.send("Error placing order: " + error.message);

  }

});
/* ================= VERIFY OTP ================= */

router.post("/verify-otp", (req, res) => {

  const { otp } = req.body;
  const pending = req.session.pendingOrder;

  const customerEmail = req.session.customerEmail || "";
  const orderId = req.session.orderId || "";

if (!pending || !pending.otp)  {
    return res.render("customer/verify-otp", {
      error: "Session expired",
      orderId,
      customerEmail
    });
  }

  if (Date.now() - pending.timestamp > 10 * 60 * 1000) {

    req.session.pendingOrder = null;

    return res.render("customer/verify-otp", {
      error: "OTP expired",
      orderId,
      customerEmail
    });

  }

  pending.attempts++;

  if (pending.attempts > 5) {

    req.session.pendingOrder = null;

    return res.render("customer/verify-otp", {
      error: "Too many attempts",
      orderId,
      customerEmail
    });

  }
if (otp === pending.otp) {

  const order = pending.orderData;

  // SAVE EMAIL IN SESSION
  req.session.customerEmail = order.customerEmail;

  req.session.pendingOrder = null;
  req.session.orderId = null;

  res.render("customer/order-success", { order });

} else {

    res.render("customer/verify-otp", {
      error: `Incorrect OTP. ${5 - pending.attempts} attempts left`,
      orderId,
      customerEmail
    });

  }

});

export default router;