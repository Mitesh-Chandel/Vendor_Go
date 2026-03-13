import express from "express";
import session from "express-session";
import http from "http";
import { Server } from "socket.io";

import vendorRoutes from "./routes/vendor.js";
import customerRoutes from "./routes/customer.js";
import adminRoutes from "./routes/admin.js";
 
const app = express();
 
/* ---------- SOCKET SERVER ---------- */
 
const server = http.createServer(app); 
const io = new Server(server);

/* make socket accessible in routes */
app.set("io", io);
  
/* ---------- MIDDLEWARE ---------- */

app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: "vendor-go-secret",  
    resave: false, 
    saveUninitialized: true, 
  })
);
 
/* CART COUNT */

app.use((req, res, next) => {
  const cart = req.session.cart || [];
  res.locals.cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  next();
});

/* ---------- VIEW ENGINE ---------- */

app.set("view engine", "ejs");
 
/* ---------- ROUTES ---------- */

app.use("/vendor", vendorRoutes);
app.use("/customer", customerRoutes);
app.use("/admin", adminRoutes);

app.get("/", (req, res) => { 
  res.render("home");
});

/* ---------- SOCKET CONNECTION ---------- */

io.on("connection", (socket) => {  
  console.log("User connected");

  socket.on("disconnect", () => {
    console.log("User disconnected"); 
  }); 
});

/* ---------- SERVER ---------- */

server.listen(3000, () => {
  console.log("Server running on port 3000");
});    