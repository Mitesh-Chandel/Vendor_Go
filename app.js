import express from "express";
import session from "express-session";

import { products } from "./data/db.js";
 

import vendorRoutes from "./routes/vendor.js";
import customerRoutes from "./routes/customer.js";
import adminRoutes from "./routes/admin.js";

const app = express();
app.use(express.static("public")); 



app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use( 
  session({ 
    secret: "vendor-go-secret",
    resave: false,
    saveUninitialized: true, 
  }), 
);
 
app.use((req, res, next) => {
  const cart = req.session.cart || [];
  res.locals.cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  next();
});

app.set("view engine", "ejs");

app.use("/vendor", vendorRoutes);
app.use("/customer", customerRoutes);
app.use("/admin", adminRoutes);
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
  }),
);


app.use((req, res, next) => {
  res.locals.cartCount = req.session.cart ? req.session.cart.length : 0;
  next();
});

app.get("/", (req, res) => {
  res.render("home");
});

app.listen(3000, () => {
  console.log("🚀 Vendor Go running on port 3000");
});
