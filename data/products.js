import db from "./db.js";

export async function getProducts() {
  const result = await db.query(`
    SELECT 
      p.name,
      p.description,
      p.category,
      p.image,
      vp.price,
      vp.id AS vendor_product_id,
      v.username AS vendor_name,
      v.email AS vendor_email
    FROM vendor_products vp
    JOIN products p ON vp.product_id = p.id
    JOIN vendors v ON vp.vendor_id = v.id
    ORDER BY vp.id DESC
  `);

  return result.rows;
}

export async function getProductsByVendor(vendorId) {
  const result = await db.query(`
    SELECT 
      p.name,
      p.description,
      p.image,
      vp.price,
      vp.stock,
      vp.id AS vendor_product_id
    FROM vendor_products vp
    JOIN products p ON vp.product_id = p.id
    WHERE vp.vendor_id = $1
  `,[vendorId]);

  return result.rows;
}

export async function getProductById(vendorProductId) {

  const result = await db.query(`
    SELECT 
      p.name,
      p.description,
      p.category,
      p.image,
      vp.price,
      vp.stock,
      v.username AS vendor_name,
      v.email AS vendor_email
    FROM vendor_products vp
    JOIN products p ON vp.product_id = p.id
    JOIN vendors v ON vp.vendor_id = v.id
    WHERE vp.id = $1
  `,[vendorProductId]);

  return result.rows[0];

}

export async function addVendorProduct(productId, vendorId, price, stock) {

  const result =await db.query(
  `INSERT INTO vendor_products (vendor_id, product_id, price, stock)
   VALUES ($1,$2,$3,$4)
   ON CONFLICT (vendor_id, product_id)
   DO UPDATE SET price=$3, stock=$4`,
  [vendorId, productId, price, 10]
);

  return result.rows[0];
}

 