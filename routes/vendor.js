import express from "express";
import dotenv from "dotenv";
import { getVendors, getVendorByUsername } from "../data/vendors.js";
import { getProducts, getProductsByVendor, addProduct } from "../data/products.js";
import { getOrders, updateOrderStatus } from "../data/orders.js";
import multer from "multer";
import path from "path";
import nodemailer from "nodemailer";

dotenv.config();

const router = express.Router();

/* ================================
   📧 EMAIL CONFIGURATION
================================ */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/* ================================
   🔐 LOGIN
================================ */

router.get("/login", (req, res) => {
  res.render("vendor/login");
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const vendor = await getVendorByUsername(username);

    if (vendor && vendor.password === password) {
      req.session.vendorId = vendor.id;
      req.session.vendor = vendor;
      res.redirect("/vendor/dashboard");
    } else {
      res.render("vendor/login", {
        error: "Invalid credentials",
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.render("vendor/login", { error: "Server error" });
  }
});

/* ================================
   📊 DASHBOARD
================================ */

router.get("/dashboard", async (req, res) => {
  try {
    const vendorId = req.session.vendorId || 1;  // Default to vendor 1 for now
    const vendorProducts = await getProductsByVendor(vendorId);
    const orders = await getOrders();
    const waitingOrders = orders.filter((o) => o.status === "waiting");

    res.render("vendor/dashboard", {
      products: vendorProducts,
      orders: waitingOrders,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.render("vendor/dashboard", { products: [], orders: [] });
  }
});

/* ================================
   📦 PRODUCT IMAGE UPLOAD
================================ */

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images/uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage: storage });

router.get("/add-product", (req, res) => {
  res.render("vendor/add-product");
});

router.post("/add-product", upload.single("image"), async (req, res) => {
  const { name, price, description, category } = req.body;

  if (!req.file) {
    return res.send("Image is required.");
  }

  try {
    const vendorId = req.session.vendorId || 1;
    const imagePath = "/images/uploads/" + req.file.filename;

    await addProduct(name, parseFloat(price), description, category, imagePath, vendorId);
    res.redirect("/vendor/dashboard");
  } catch (error) {
    console.error("Add product error:", error);
    res.send("Error adding product");
  }
});

/* ================================
   ✅ ACCEPT ORDER + EMAIL
================================ */

router.post("/accept/:id", async (req, res) => {
  try {
    const orderId = req.params.id;
    const updatedOrder = await updateOrderStatus(orderId, "accepted");

    // 📧 Send Email
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
    console.error("Accept order error:", error);
    res.redirect("/vendor/dashboard");
  }
});

/* ================================
   ❌ REJECT ORDER + EMAIL
================================ */

router.post("/reject/:id", async (req, res) => {
  try {
    const orderId = req.params.id;
    const updatedOrder = await updateOrderStatus(orderId, "rejected");

    // 📧 Send Email
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
    console.error("Reject order error:", error);
    res.redirect("/vendor/dashboard");
  }
});

export default router;