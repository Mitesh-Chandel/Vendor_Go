-- ============================================
-- VENDOR GO - DATABASE SCHEMA
-- ============================================
-- This SQL script creates the complete database schema for the Vendor GO application
-- Created for: PostgreSQL v12+
-- Database Name: vendor_go_db
-- Owner: vendor_go_user
--
-- HOW TO RUN THIS SCRIPT:
-- 1. Open pgAdmin or Terminal
-- 2. Connect to vendor_go_db as vendor_go_user
-- 3. Copy and paste all contents, OR use: psql -U vendor_go_user -d vendor_go_db -f schema.sql
-- ============================================

-- ============================================
-- 1. VENDORS TABLE
-- ============================================
-- Stores vendor/seller information
-- Used by: routes/vendor.js
-- Relations: Referenced by products, orders tables
-- 
-- Key Fields:
-- - id: Unique identifier (Primary Key)
-- - email: Vendor login email (UNIQUE for no duplicate accounts)
-- - password: bcrypt hashed password (never store plaintext)
-- - company_name: Vendor's business/company name
-- - phone: Contact phone number
-- - address, city, state, zip_code: Business address details
-- - created_at, updated_at: Timestamps for tracking creation and modifications
--
CREATE TABLE IF NOT EXISTS vendors (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  phone VARCHAR(15),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. CUSTOMERS TABLE
-- ============================================
-- Stores customer/buyer information
-- Used by: routes/customer.js
-- Relations: Referenced by orders table
--
-- Key Fields:
-- - id: Unique identifier (Primary Key)
-- - email: Customer login email (UNIQUE)
-- - password: bcrypt hashed password
-- - full_name: Customer's full name
-- - phone: Customer phone for delivery contact
-- - address, city, state, zip_code: Delivery address
-- - is_verified: Boolean flag for email/OTP verification status
-- - created_at, updated_at: Tracking timestamps
--
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(15),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(10),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. PRODUCTS TABLE
-- ============================================
-- Stores product listings for each vendor
-- Used by: routes/vendor.js (add/edit products), routes/customer.js (browse products)
-- Relations: 
--   - FOREIGN KEY: vendor_id references vendors.id (each product belongs to ONE vendor)
--   - Referenced by: order_items table
--
-- Key Fields:
-- - id: Unique product identifier (Primary Key)
-- - vendor_id: Foreign Key linking to vendors table
-- - name: Product name/title
-- - description: Detailed product description
-- - price: Product selling price (DECIMAL for currency precision)
-- - stock: Current inventory quantity (0 means out of stock)
-- - category: Product category for filtering (e.g., Electronics, Clothing)
-- - image_url: Path to product image file stored in public/uploads
-- - is_active: Boolean to soft-delete products without removing data
-- - created_at, updated_at: Timestamps
--
-- Important:
-- - ON DELETE CASCADE: If a vendor is deleted, all their products are deleted
-- - price uses DECIMAL(10,2) for accurate currency handling
--
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER DEFAULT 0,
  category VARCHAR(100),
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. ORDERS TABLE
-- ============================================
-- Stores order headers/master records
-- Used by: routes/customer.js (place order), routes/vendor.js (view orders), routes/admin.js (monitor orders)
-- Relations:
--   - FOREIGN KEY: customer_id references customers.id
--   - FOREIGN KEY: vendor_id references vendors.id (each order comes from ONE vendor)
--   - Referenced by: order_items table (contains actual products)
--
-- Key Fields:
-- - id: Unique order identifier (Primary Key)
-- - customer_id: Which customer placed the order
-- - vendor_id: Which vendor's products are in this order
-- - order_number: Unique, human-readable order ID (e.g., ORD-20260603-001)
-- - total_amount: Total order value in currency
-- - status: Current order state (pending → confirmed → shipped → delivered OR cancelled)
-- - shipping_address: Delivery address (can differ from customer's address)
-- - created_at, updated_at: Order creation and modification timestamps
--
-- Status Flow:
--   pending    → New order, awaiting vendor confirmation
--   confirmed  → Vendor accepted the order
--   shipped    → Order on its way (Socket.IO notification sent)
--   delivered  → Order received by customer
--   cancelled  → Order cancelled by customer or vendor
--
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  shipping_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. ORDER_ITEMS TABLE
-- ============================================
-- Stores individual items/line items within an order
-- Used by: routes/customer.js (add items to order), order processing logic
-- Relations:
--   - FOREIGN KEY: order_id references orders.id
--   - FOREIGN KEY: product_id references products.id
--
-- Key Fields:
-- - id: Unique line item identifier
-- - order_id: Which order this item belongs to
-- - product_id: Which product was ordered
-- - quantity: How many units of this product
-- - unit_price: Price at time of order (stored separately in case product price changes)
-- - created_at: When item was added to order
--
-- Design Notes:
-- - unit_price is stored separately because product price can change over time
-- - This maintains accurate order history and prevents price discrepancies
-- - Example: Product costs $100, customer orders 2 units, total = $200
--
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. ADMINS TABLE
-- ============================================
-- Stores administrator user accounts
-- Used by: routes/admin.js (authentication, dashboard)
-- Relations: Independent table, referenced by audit logs (future enhancement)
--
-- Key Fields:
-- - id: Unique admin identifier (Primary Key)
-- - email: Admin login email (UNIQUE)
-- - password: bcrypt hashed password
-- - full_name: Administrator's full name
-- - role: Permission level (admin, super_admin)
-- - is_active: Boolean to enable/disable admin accounts without deletion
-- - created_at, updated_at: Account creation and modification timestamps
--
-- Roles:
--   admin       → Can view dashboard, manage some settings
--   super_admin → Full system access, can manage other admins
--
-- Important:
-- - Always use bcrypt to hash passwords before storing
-- - is_active prevents deleted admins from accessing the system
--
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. CREATE INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================
-- Indexes speed up database queries by creating a lookup table
-- Use on columns that are frequently searched, sorted, or joined
--
-- These indexes improve performance for:
-- - User logins (email lookups)
-- - Product searches by vendor
-- - Order searches by customer or vendor
-- - Order item lookups
--
-- Trade-off: Indexes use disk space but dramatically speed up queries
--

-- Index on vendor emails for fast login authentication
CREATE INDEX IF NOT EXISTS idx_vendors_email ON vendors(email);

-- Index on customer emails for fast login authentication
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Index on product vendor lookups (find all products by a vendor)
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);

-- Index on order customer lookups (find all orders by a customer)
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

-- Index on order vendor lookups (find all orders for a vendor)
CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON orders(vendor_id);

-- Index on order items lookups (find items in an order)
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Index on admin emails for fast admin login
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Index on order numbers for quick order tracking
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);

-- Index on order status for filtering by status
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- ============================================
-- 8. VERIFICATION QUERIES
-- ============================================
-- Run these queries after creating the schema to verify setup:
--
-- List all tables:
--   \dt
--
-- Describe vendors table:
--   \d vendors
--
-- Count records in each table:
--   SELECT COUNT(*) FROM vendors;
--   SELECT COUNT(*) FROM customers;
--   SELECT COUNT(*) FROM products;
--   SELECT COUNT(*) FROM orders;
--   SELECT COUNT(*) FROM order_items;
--   SELECT COUNT(*) FROM admins;
--
-- List all indexes:
--   \di
--
-- ============================================
-- 9. SAMPLE DATA FOR TESTING (Optional)
-- ============================================
-- Uncomment and run these queries to add sample data for testing
-- Note: Passwords are hashed using bcrypt (use actual hashed values in production)
--

-- Insert sample vendor
-- INSERT INTO vendors (email, password, company_name, phone, address, city, state, zip_code)
-- VALUES ('vendor1@example.com', '$2b$10$hashedpassword123', 'Tech Store', '555-1234', '123 Main St', 'New York', 'NY', '10001');

-- Insert sample customer
-- INSERT INTO customers (email, password, full_name, phone, address, city, state, zip_code, is_verified)
-- VALUES ('customer1@example.com', '$2b$10$hashedpassword456', 'John Doe', '555-5678', '456 Oak Ave', 'Boston', 'MA', '02101', TRUE);

-- Insert sample admin
-- INSERT INTO admins (email, password, full_name, role)
-- VALUES ('admin@example.com', '$2b$10$hashedpassword789', 'Admin User', 'super_admin');

-- ============================================
-- END OF SCHEMA
-- ============================================
-- Schema version: 1.0
-- Last updated: June 2026
-- 
-- For Route Integration:
-- - /data/db.js: Database connection pool
-- - /data/vendors.js: Vendor queries (SELECT, INSERT, UPDATE, DELETE)
-- - /data/products.js: Product queries
-- - /data/customers.js: Customer queries  
-- - /data/orders.js: Order & order_items queries
--
-- ============================================
