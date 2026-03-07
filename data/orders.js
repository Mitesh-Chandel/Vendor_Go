import db from "./db.js";

export async function createOrder(customerName, customerEmail, customerPhone, totalPrice) {
  const result = await db.query(
    "INSERT INTO orders (customer_name, customer_email, customer_phone, total_price, status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [customerName, customerEmail, customerPhone, totalPrice, "waiting"]
  );
  return result.rows[0];
}

export async function getOrders() {
  const result = await db.query("SELECT * FROM orders ORDER BY id DESC");
  return result.rows;
}

export async function getOrderById(id) {
  const result = await db.query("SELECT * FROM orders WHERE id = $1", [id]);
  return result.rows[0];
}

export async function updateOrderStatus(id, status) {
  const result = await db.query(
    "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
    [status, id]
  );
  return result.rows[0];
}

export async function addOrderItem(orderId, productId, quantity) {
  const result = await db.query(
    "INSERT INTO order_items (order_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *",
    [orderId, productId, quantity]
  );
  return result.rows[0];
}

export async function getOrdersByVendor(vendorId) {
  const result = await db.query(`
    SELECT 
      o.id,
      o.customer_name,
      o.customer_phone,
      o.customer_email,
      o.total_price,
      o.status,
      p.name AS product_name,
      oi.quantity
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
    WHERE p.vendor_id = $1
    ORDER BY o.id DESC
  `, [vendorId]);

  return result.rows;
}