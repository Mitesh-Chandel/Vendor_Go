import db from "./db.js";

/* ================= CREATE ORDER ================= */

export async function createOrder(customerName, customerEmail, customerPhone, totalPrice) {
  const result = await db.query(
    `INSERT INTO orders 
    (customer_name, customer_email, customer_phone, total_price) 
    VALUES ($1,$2,$3,$4) 
    RETURNING *`,
    [customerName, customerEmail, customerPhone, totalPrice]
  );

  return result.rows[0];
}


/* ================= GET ALL ORDERS ================= */

export async function getOrders() {
  const result = await db.query(
    "SELECT * FROM orders ORDER BY id DESC"
  );
  return result.rows;
}


/* ================= GET ORDER BY ID ================= */

export async function getOrderById(id) {
  const result = await db.query(
    "SELECT * FROM orders WHERE id = $1",
    [id]
  );
  return result.rows[0];
}


/* ================= ADD ORDER ITEM ================= */

export async function addOrderItem(orderId, vendorProductId, quantity, price) {
  const result = await db.query(
    `INSERT INTO order_items 
    (order_id, vendor_product_id, quantity, price, status) 
    VALUES ($1,$2,$3,$4,'waiting') 
    RETURNING *`,
    [orderId, vendorProductId, quantity, price]
  );

  return result.rows[0];
}


/* ================= UPDATE ORDER ITEM STATUS ================= */

export async function updateOrderItemStatus(orderItemId, status) {
  const result = await db.query(
    `UPDATE order_items 
     SET status = $1 
     WHERE id = $2 
     RETURNING *`,
    [status, orderItemId]
  );

  return result.rows[0];
}


/* ================= GET ORDERS BY VENDOR ================= */

export async function getOrdersByVendor(vendorId) {
  const result = await db.query(`
    SELECT 
      oi.id AS order_item_id,
      o.id AS order_id,
      o.customer_name,
      o.customer_email,
      o.customer_phone,
      o.total_price,
      oi.quantity,
      oi.price,
      oi.status,
      p.name AS product_name
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN vendor_products vp ON oi.vendor_product_id = vp.id
    JOIN products p ON vp.product_id = p.id
    WHERE vp.vendor_id = $1
    ORDER BY o.id DESC
  `, [vendorId]);

  return result.rows;
}