import express from "express";

import { getOrders } from "../data/orders.js";
import { vendors } from "../data/vendors.js";
import { products } from "../data/products.js";

const router = express.Router();

// ================= LOGIN ROUTES =================
router.get("/login", (req, res) => {
  res.render("admin/login");
});

router.post("/login", (req, res) => {
  const { password } = req.body;
  if (password === "admin123") {
    req.session.isAdmin = true;
    res.redirect("/admin");
  } else {
    res.render("admin/login", { error: "Wrong password" });
  }
});

// ================= DASHBOARD (Protected) =================
router.get("/", (req, res) => {
  if (!req.session.isAdmin) {
    return res.redirect("/admin/login");
  }

  // 🔥 READ ORDERS FROM JSON
  const orders = getOrders();

  // Format orders
  const formattedOrders = orders.map(order => {
    let displayItems = [];

    if (order.items && Array.isArray(order.items)) {
      displayItems = order.items;
    } else if (order.productId) {
      const product = products.find(p => p.id === order.productId);
      displayItems = [{
        name: product ? product.name : "Unknown Product",
        quantity: order.quantity || 1
      }];
    }

    return {
      ...order,
      displayItems
    };
  });

  // 🔥 Recalculate everything from JSON orders
  const totalEarnings = orders.reduce(
    (sum, o) => sum + (o.totalPrice || 0),
    0
  );

  const stats = {
    totalVendors: vendors.length,
    totalProducts: products.length,
    totalOrders: orders.length,
    totalRevenue: totalEarnings
  };

  res.render("admin/dashboard", {
    orders: formattedOrders,
    stats: stats
  });
});

// ================= VENDOR MANAGEMENT =================
router.post("/approve-vendor/:id", (req, res) => {
  const vendorId = parseInt(req.params.id);
  const vendor = vendors.find(v => v.id === vendorId);

  if (vendor) {
    vendor.approved = true;
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

export default router;