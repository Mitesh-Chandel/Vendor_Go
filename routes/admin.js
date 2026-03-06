import express from "express";
import { getVendors } from "../data/vendors.js";
import db from "../data/db.js";

const router = express.Router();

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

router.get("/", async (req, res) => {
  if (!req.session.isAdmin) {
    return res.redirect("/admin/login");
  }

  try {
    // Fetch vendors
    const vendors = await getVendors();

    // Fetch orders with order items and products details
    const ordersResult = await db.query(`
      SELECT 
        o.id,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.total_price,
        o.status,
        o.date,
        oi.order_id,
        oi.product_id,
        oi.quantity,
        oi.price,
        p.name as product_name
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      ORDER BY o.id DESC
    `);

    // Group orders by order ID
    const ordersMap = {};
    ordersResult.rows.forEach(row => {
      if (!ordersMap[row.id]) {
        ordersMap[row.id] = {
          id: row.id,
          customerName: row.customer_name,
          customerEmail: row.customer_email,
          customerPhone: row.customer_phone,
          totalPrice: row.total_price,
          status: row.status,
          date: row.date,
          items: []
        };
      }
      
      if (row.product_id) {
        ordersMap[row.id].items.push({
          productId: row.product_id,
          productName: row.product_name,
          quantity: row.quantity,
          price: row.price
        });
      }
    });

    const formattedOrders = Object.values(ordersMap);
    const totalEarnings = formattedOrders.reduce((sum, o) => sum + (parseFloat(o.totalPrice) || 0), 0);

    const vendorCount = await db.query("SELECT COUNT(*) FROM vendors");
    const productCount = await db.query("SELECT COUNT(*) FROM products");

    const stats = {
      totalVendors: parseInt(vendorCount.rows[0].count),
      totalProducts: parseInt(productCount.rows[0].count),
      totalOrders: formattedOrders.length,
      totalRevenue: totalEarnings,
    };

    res.render("admin/dashboard", {
      orders: formattedOrders,
      stats: stats,
      vendors: vendors,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    res.render("admin/dashboard", {
      orders: [],
      stats: { totalVendors: 0, totalProducts: 0, totalOrders: 0, totalRevenue: 0 },
      vendors: [],
      error: error.message
    });
  }
});

router.post("/approve-vendor/:id", async (req, res) => {
  const vendorId = parseInt(req.params.id);

  await db.query(
    "UPDATE vendors SET approved = true WHERE id = $1",
    [vendorId]
  );

  res.json({ success: true });
});

export default router;
