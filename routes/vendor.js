import express from "express";
import dotenv from "dotenv";
import bcrypt from "bcrypt";              // ✅ import bcrypt
import db from "../data/db.js";           // ✅ import db
import { getVendors, getVendorByName } from "../data/vendors.js"; // ✅ use correct function
import { getProductsByVendor } from "../data/products.js";
import { getOrdersByVendor, updateOrderStatus } from "../data/orders.js";
import multer from "multer";
import path from "path";
import nodemailer from "nodemailer";

dotenv.config();
const router = express.Router();

/* ================================ 📧 EMAIL CONFIG ================================ */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/* ================================ 🔐 LOGIN ================================ */
router.get("/login", (req, res) => {
  res.render("vendor/login");
});


router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // vendors table uses "name"
    const vendor = await getVendorByName(username);

    if (!vendor) {
      return res.render("vendor/login", { error: "User not found" });
    }

    // compare plain text vs hashed password
    // const match = await bcrypt.compare(password, vendor.password);
const match = password === vendor.password;
    if (match) {
      req.session.vendorId = vendor.id;
      req.session.vendor = vendor;
      return res.redirect("/vendor/dashboard");
    } else {
      return res.render("vendor/login", { error: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.render("vendor/login", { error: "Server error" });
  }
});

/* ================================ 📊 DASHBOARD ================================ */
router.get("/dashboard", async (req, res) => {
  try {
    const vendorId = req.session.vendorId;

    if (!vendorId) {
      return res.redirect("/vendor/login");
    }

    const vendorProducts = await getProductsByVendor(vendorId);
    const orders = await getOrdersByVendor(vendorId);

    const waitingOrders = orders.filter((o) => o.status === "waiting");

    res.render("vendor/dashboard", {
      products: vendorProducts,
      orders: waitingOrders,
    });
  } catch (error) {
    console.log(error);
    res.render("vendor/dashboard", { products: [], orders: [] });
  }
});

/* ================================ 📦 PRODUCT IMAGE UPLOAD ================================ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

router.get("/add-product", (req, res) => {
  res.render("vendor/add-product");
});

router.post("/add-product", upload.single("image"), async (req, res) => {
  const { name, price, description, category } = req.body;

  if (!req.file) {
    return res.send("Image is required.");
  }

  try {
    const vendorId = req.session.vendorId;
    if (!vendorId) return res.redirect("/vendor/login");

    const imagePath = "/uploads/" + req.file.filename;

    const productResult = await db.query(
      `INSERT INTO products (name, description, category, image)
       VALUES ($1,$2,$3,$4)
       RETURNING id`,
      [name, description, category, imagePath]
    );

    const productId = productResult.rows[0].id;

    await db.query(
      `INSERT INTO vendor_products (vendor_id, product_id, price, stock)
       VALUES ($1,$2,$3,$4)`,
      [vendorId, productId, price, 10]
    );

    res.redirect("/vendor/dashboard");
  } catch (error) {
    console.log(error);
    res.send("Error adding product");
  }
});

/* ================================ ✅ ACCEPT ORDER + EMAIL ================================ */
router.post("/accept/:id", async (req, res) => {
  try {
    const orderId = req.params.id;
    const updatedOrder = await updateOrderStatus(orderId, "accepted");

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: updatedOrder.customer_email,
      subject: "Order Accepted 🎉",
      html: `
        <h2>Hello ${updatedOrder.customer_name},</h2>
        <p>Your order has been <b style="color:green;">ACCEPTED</b>.</p>
        <p>Total Amount: ₹${updatedOrder.total_price}</p>
        <p>Thank you for shopping with us!</p>
      `,
    });

    res.redirect("/vendor/dashboard");
  } catch (error) {
    res.redirect("/vendor/dashboard");
  }
});

/* ================================ ❌ REJECT ORDER + EMAIL ================================ */
router.post("/reject/:id", async (req, res) => {
  try {
    const orderId = req.params.id;
    const updatedOrder = await updateOrderStatus(orderId, "rejected");

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: updatedOrder.customer_email,
      subject: "Order Rejected ❌",
      html: `
        <h2>Hello ${updatedOrder.customer_name},</h2>
        <p>Your order has been <b style="color:red;">REJECTED</b>.</p>
        <p>If you have any questions, contact support.</p>
      `,
    });

    res.redirect("/vendor/dashboard");
  } catch (error) {
    res.redirect("/vendor/dashboard");
  }
});

export default router;