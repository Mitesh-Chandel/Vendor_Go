import express from "express";
import { getOrders, saveOrders } from "../data/orders.js";
import { products } from "../data/products.js";

const router = express.Router();


// ================= SHOP PAGE =================
router.get("/shop", (req, res) => {
  res.render("customer/shop", { products });
});


// ================= VIEW ALL ORDERS =================
router.get("/orders", (req, res) => {
  const orders = getOrders();   // ✅ FIXED (was undefined before)

  const formattedOrders = orders.map(order => {
    let displayItems = [];

    // If it is a cart order
    if (order.items && Array.isArray(order.items)) {
      displayItems = order.items;
    } 
    // If it is old single product order
    else if (order.productId) {
      const product = products.find(p => p.id === order.productId);

      displayItems = [{
        name: product ? product.name : "Unknown Product",
        quantity: order.quantity || 1,
        price: product ? product.price : 0
      }];
    }

    return {
      ...order,
      displayItems,
      totalPrice:
        order.totalPrice ||
        displayItems.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        )
    };
  });

  res.render("customer/orders", { orders: formattedOrders });
});


// ================= ADD TO CART =================
router.post("/add-to-cart", (req, res) => {
  const productId = parseInt(req.body.productId);
  const quantity = parseInt(req.body.quantity) || 1;

  const product = products.find(p => p.id === productId);
  if (!product) return res.redirect("/customer/shop");

  if (!req.session.cart) req.session.cart = [];

  const existingItem = req.session.cart.find(
    item => item.id === productId
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    req.session.cart.push({ ...product, quantity });
  }

  res.redirect("/customer/shop");
});


// ================= VIEW CART =================
router.get("/cart", (req, res) => {
  const cart = req.session.cart || [];

  const grandTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  res.render("customer/cart", {
    cart,
    total: grandTotal
  });
});

// ================= INCREASE QUANTITY =================
router.post("/increase-quantity", (req, res) => {
  const productId = parseInt(req.body.productId);

  const cart = req.session.cart || [];

  const item = cart.find(p => p.id === productId);
  if (item) {
    item.quantity += 1;
  }

  req.session.cart = cart;
  res.redirect("/customer/cart");
});
// ================= DECREASE QUANTITY =================
router.post("/decrease-quantity", (req, res) => {
  const productId = parseInt(req.body.productId);

  const cart = req.session.cart || [];

  const item = cart.find(p => p.id === productId);

  if (item) {
    item.quantity -= 1;

    // If quantity becomes 0 → remove item
    if (item.quantity <= 0) {
      req.session.cart = cart.filter(p => p.id !== productId);
    }
  }

  res.redirect("/customer/cart");
});
// ================= REMOVE ITEM =================
router.post("/remove-item", (req, res) => {
  const productId = parseInt(req.body.productId);

  const cart = req.session.cart || [];

  req.session.cart = cart.filter(p => p.id !== productId);

  res.redirect("/customer/cart");
});

// ================= PLACE ORDER =================
router.post("/place-order", (req, res) => {
  const { customerName, customerPhone } = req.body;
  const cart = req.session.cart || [];

  if (cart.length === 0) {
    return res.redirect("/customer/shop");
  }

  const grandTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const finalOrder = {
    id: Date.now(),
    customerName,
    customerPhone,
    items: cart,
    totalPrice: grandTotal,
    status: "waiting",
    date: new Date()
  };

  const orders = getOrders(); // ✅ get existing
  orders.push(finalOrder);
  saveOrders(orders);         // ✅ save back

  req.session.cart = [];

  res.render("customer/order-success", {
    order: finalOrder
  });
});


export default router;