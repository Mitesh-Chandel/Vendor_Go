import express from "express";
import { vendors } from "../data/vendors.js";
import { products } from "../data/products.js";
import { getOrders, saveOrders } from "../data/orders.js";
import multer from "multer";
import path from "path";

const router = express.Router();

// LOGIN PAGE
router.get("/login", (req, res) => {
  res.render("vendor/login");
});

// HANDLE LOGIN
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  const vendor = vendors.find(
    (v) => v.username === username && v.password === password
  );

  if (vendor) {
    res.redirect("/vendor/dashboard");
  } else {
    res.render("vendor/login", {
      error: "Invalid credentials"
    });
  }
});

// DASHBOARD
router.get("/dashboard", (req, res) => {
  const vendorProducts = products.filter((p) => p.vendorId === 1);

  const orders = getOrders();
  const waitingOrders = orders.filter(o => o.status === "waiting");

  res.render("vendor/dashboard", {
    products: vendorProducts,
    orders: waitingOrders
  });
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

// ADD PRODUCT PAGE
router.get("/add-product", (req, res) => {
  res.render("vendor/add-product");
});

// ADD PRODUCT
router.post("/add-product", upload.single("image"), (req, res) => {
  const { name, price, description, category } = req.body;

  if (!req.file) {
    return res.send("Image is required.");
  }

  const newProduct = {
    id: products.length + 1,
    name,
    price: parseFloat(price),
    description,
    category,
    image: "/uploads/" + req.file.filename, // ✅ Image path added
    vendorId: 1,
    createdAt: new Date()
  };

  products.push(newProduct);

  res.redirect("/vendor/dashboard");
});

// ACCEPT ORDER
router.post("/accept/:id", (req, res) => {
  const orders = getOrders();
  const order = orders.find(o => o.id == req.params.id);

  if (order) order.status = "accepted";

  saveOrders(orders);
  res.redirect("/vendor/dashboard");
});

// REJECT ORDER
router.post("/reject/:id", (req, res) => {
  const orders = getOrders();
  const order = orders.find(o => o.id == req.params.id);

  if (order) order.status = "rejected";

  saveOrders(orders);
  res.redirect("/vendor/dashboard");
});

export default router;