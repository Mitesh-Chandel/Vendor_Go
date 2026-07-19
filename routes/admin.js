import express from "express";
import db from "../data/db.js";

const router = express.Router();

/* ---------- ADMIN AUTH MIDDLEWARE ---------- */

function requireAdmin(req, res, next) {
  if (req.session.isAdmin) {
    return next();
  }

  return res.redirect("/admin/login");
}

/* ---------- ADMIN LOGIN PAGE ---------- */

router.get("/login", (req, res) => {
  res.render("admin/login", { error: null });
});

/* ---------- ADMIN LOGIN ---------- */

router.post("/login", (req, res) => {
  const { password } = req.body;

  if (password === "admin123") {
    req.session.isAdmin = true;
    return res.redirect("/admin");
  }

  res.render("admin/login", {
    error: "Wrong password",
  });
});

/* ---------- ADMIN LOGOUT ---------- */

router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      return res.redirect("/admin");
    }

    res.redirect("/admin/login");
  });
});

/* ---------- ADMIN DASHBOARD ---------- */

router.get("/", requireAdmin, async (req, res) => {
  try {
    const vendorResult = await db.query("SELECT * FROM vendors");
    const productResult = await db.query("SELECT * FROM products");
    const orderResult = await db.query("SELECT * FROM orders");

    const revenueResult = await db.query(
      "SELECT COALESCE(SUM(total_price), 0) AS revenue FROM orders"
    );

    const stats = {
      totalVendors: vendorResult.rows.length,
      totalProducts: productResult.rows.length,
      totalOrders: orderResult.rows.length,
      totalRevenue: revenueResult.rows[0].revenue,
    };

    const ordersWithItems = await db.query(`
      SELECT
        o.id,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.total_price,
        o.date,
        oi.quantity,
        oi.price,
        p.name AS product_name
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN vendor_products vp ON oi.vendor_product_id = vp.id
      LEFT JOIN products p ON vp.product_id = p.id
      ORDER BY o.id DESC
      LIMIT 10
    `);

    const ordersMap = {};

    ordersWithItems.rows.forEach((row) => {
      if (!ordersMap[row.id]) {
        ordersMap[row.id] = {
          id: row.id,
          customerName: row.customer_name,
          customerEmail: row.customer_email,
          customerPhone: row.customer_phone,
          totalPrice: row.total_price,
          date: row.date,
          status: "waiting",
          items: [],
        };
      }

      if (row.product_name) {
        ordersMap[row.id].items.push({
          productName: row.product_name,
          quantity: row.quantity,
          price: row.price,
        });
      }
    });

    res.render("admin/dashboard", {
      stats,
      vendors: vendorResult.rows,
      orders: Object.values(ordersMap),
    });
  } catch (error) {
    console.error(error);
    res.send("Admin dashboard error");
  }
});

/* ---------- APPROVE VENDOR ---------- */

router.post("/approve-vendor/:id", requireAdmin, async (req, res) => {
  const vendorId = parseInt(req.params.id);

  try {
    await db.query(
      "UPDATE vendors SET approved = true WHERE id = $1",
      [vendorId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.json({ success: false });
  }
});

export default router;