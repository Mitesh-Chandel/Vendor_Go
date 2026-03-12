import express from "express";
import { getVendors } from "../data/vendors.js";
import db from "../data/db.js";

const router = express.Router();

/* Admin Login Page */
router.get("/login", (req, res) => {
  res.render("admin/login");
});

/* Admin Login */
router.post("/login", (req, res) => {
  const { password } = req.body;

  if (password === "admin123") {
    req.session.isAdmin = true;
    return res.redirect("/admin");
  }

  res.render("admin/login", { error: "Wrong password" });
});


/* Admin Dashboard */
router.get("/", async (req, res) => {

  if (!req.session.isAdmin) {
    return res.redirect("/admin/login");
  }

  try {

    /* Get vendors */
    const vendors = await getVendors();

    /* Get orders with vendor + product info */
    const ordersResult = await db.query(`
      SELECT
        o.id,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.total_price,
        o.status,
        o.date,

        oi.quantity,

        vp.id AS vendor_product_id,
        vp.price,

        p.name AS product_name,

       v.name AS vendor_name

      FROM orders o

      LEFT JOIN order_items oi
        ON o.id = oi.order_id

      LEFT JOIN vendor_products vp
        ON vp.id = oi.vendor_product_id

      LEFT JOIN products p
        ON p.id = vp.product_id

      LEFT JOIN vendors v
        ON v.id = vp.vendor_id

      ORDER BY o.id DESC
    `);


    /* Group orders */
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

      if (row.product_name) {
        ordersMap[row.id].items.push({
          productName: row.product_name,
          vendorName: row.vendor_name,
          quantity: row.quantity,
          price: row.price
        });
      }

    });


    const formattedOrders = Object.values(ordersMap);

    const totalEarnings = formattedOrders.reduce(
      (sum, order) => sum + (parseFloat(order.totalPrice) || 0),
      0
    );


    /* Dashboard stats */

   
    const vendorCount = await db.query(
  "SELECT COUNT(*) FROM vendors"
);

console.log("Vendor Count:", vendorCount.rows);

    const productCount = await db.query(
      "SELECT COUNT(*) FROM products"
    );

    const orderCount = await db.query(
      "SELECT COUNT(*) FROM orders"
    );


    const stats = {
      totalVendors: parseInt(vendorCount.rows[0].count),
      totalProducts: parseInt(productCount.rows[0].count),
      totalOrders: parseInt(orderCount.rows[0].count),
      totalRevenue: totalEarnings
    };


    res.render("admin/dashboard", {
      orders: formattedOrders,
      stats: stats,
      vendors: vendors
    });

  } catch (error) {

    console.error("Admin dashboard error:", error);

    res.render("admin/dashboard", {
      orders: [],
      stats: {
        totalVendors: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0
      },
      vendors: [],
      error: error.message
    });

  }

});


/* Approve Vendor */
router.post("/approve-vendor/:id", async (req, res) => {

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