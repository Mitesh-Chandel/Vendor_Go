import express from "express";
import { getOrders, saveOrders } from "../data/orders.js";
import { products } from "../data/products.js";

const router = express.Router();

router.get("/shop", (req, res) => {
  res.render("customer/shop", { products });
});

router.get("/orders", (req, res) => {
  const orders = getOrders();

  const formattedOrders = orders.map((order) => {
    let displayItems = [];

    if (order.items && Array.isArray(order.items)) {
      displayItems = order.items;
    } else if (order.productId) {
      const product = products.find((p) => p.id === order.productId);

      displayItems = [
        {
          name: product ? product.name : "Unknown Product",
          quantity: order.quantity || 1,
          price: product ? product.price : 0,
        },
      ];
    }

    return {
      ...order,
      displayItems,
      totalPrice:
        order.totalPrice ||
        displayItems.reduce(
          (total, item) => total + item.price * item.quantity,
          0,
        ),
    };
  });

  res.render("customer/orders", { orders: formattedOrders });
});

router.post("/add-to-cart", (req, res) => {
  const productId = parseInt(req.body.productId);
  const quantity = parseInt(req.body.quantity) || 1;

  const product = products.find((p) => p.id === productId);
  if (!product) return res.redirect("/customer/shop");

  if (!req.session.cart) req.session.cart = [];

  const existingItem = req.session.cart.find((item) => item.id === productId);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    req.session.cart.push({ ...product, quantity });
  }

  res.redirect("/customer/shop");
});

router.get("/cart", (req, res) => {
  const cart = req.session.cart || [];

  const grandTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  res.render("customer/cart", {
    cart,
    total: grandTotal,
  });
});

router.post("/increase-quantity", (req, res) => {
  const productId = parseInt(req.body.productId);

  const cart = req.session.cart || [];

  const item = cart.find((p) => p.id === productId);
  if (item) {
    item.quantity += 1;
  }

  req.session.cart = cart;
  res.redirect("/customer/cart");
});

router.post("/decrease-quantity", (req, res) => {
  const productId = parseInt(req.body.productId);

  const cart = req.session.cart || [];

  const item = cart.find((p) => p.id === productId);

  if (item) {
    item.quantity -= 1;

    if (item.quantity <= 0) {
      req.session.cart = cart.filter((p) => p.id !== productId);
    }
  }

  res.redirect("/customer/cart");
});

router.post("/remove-item", (req, res) => {
  const productId = parseInt(req.body.productId);

  const cart = req.session.cart || [];

  req.session.cart = cart.filter((p) => p.id !== productId);

  res.redirect("/customer/cart");
});

router.post("/place-order", (req, res) => {
  const { customerName, customerPhone } = req.body;
  const cart = req.session.cart || [];

  if (cart.length === 0) {
    return res.redirect("/customer/shop");
  }

  const grandTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const finalOrder = {
    id: Date.now(),
    customerName,
    customerPhone,
    items: cart,
    totalPrice: grandTotal,
    status: "waiting",
    date: new Date(),
  };

  const orders = getOrders();
  orders.push(finalOrder);
  saveOrders(orders);

  req.session.cart = [];

  res.render("customer/order-success", {
    order: finalOrder,
  });
});

export default router;
