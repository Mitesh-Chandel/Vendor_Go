// Fake database for Vendor Go

const vendors = [
  { id: 1, username: "vendor1", password: "pass123", shopName: "Fresh Mart", approved: true },
  { id: 2, username: "vendor2", password: "pass123", shopName: "Green Veggies", approved: true },
  { id: 3, username: "vendor3", password: "pass123", shopName: "Daily Needs", approved: true },
  { id: 4, username: "vendor4", password: "pass123", shopName: "Fruit Zone", approved: true },
  { id: 5, username: "vendor5", password: "pass123", shopName: "Local Basket", approved: true },
  { id: 6, username: "vendor6", password: "pass123", shopName: "Veg Corner", approved: true },
  { id: 7, username: "vendor7", password: "pass123", shopName: "Farm Fresh", approved: true },
  { id: 8, username: "vendor8", password: "pass123", shopName: "City Mart", approved: true },
  { id: 9, username: "vendor9", password: "pass123", shopName: "Quick Grocer", approved: true },
  { id: 10, username: "vendor10", password: "pass123", shopName: "Street Fresh", approved: true },
  { id: 11, username: "vendor11", password: "pass123", shopName: "Organic Hub", approved: true },
  { id: 12, username: "vendor12", password: "pass123", shopName: "Fresh Basket", approved: true },
  { id: 13, username: "vendor13", password: "pass123", shopName: "Veggie World", approved: true },
  { id: 14, username: "vendor14", password: "pass123", shopName: "Daily Fresh", approved: true },
  { id: 15, username: "vendor15", password: "pass123", shopName: "Healthy Mart", approved: true },
  { id: 16, username: "vendor16", password: "pass123", shopName: "Market Point", approved: true },
  { id: 17, username: "vendor17", password: "pass123", shopName: "Farm Basket", approved: true },
  { id: 18, username: "vendor18", password: "pass123", shopName: "Nature Fresh", approved: true },
  { id: 19, username: "vendor19", password: "pass123", shopName: "Urban Grocer", approved: true },
  { id: 20, username: "vendor20", password: "pass123", shopName: "Daily Veg", approved: true }
];

const products = [
  { id: 1, name: "Tomato", price: 20, category: "Vegetable", vendorId: 1, image: "/images/tomato.jpg" },
  { id: 2, name: "Potato", price: 25, category: "Vegetable", vendorId: 1, image: "/images/potato.jpg" },
  { id: 3, name: "Onion", price: 30, category: "Vegetable", vendorId: 2, image: "/images/onion.jpg" },
  { id: 4, name: "Carrot", price: 40, category: "Vegetable", vendorId: 2, image: "/images/carrot.jpg" },
  { id: 5, name: "Apple", price: 120, category: "Fruit", vendorId: 3, image: "/images/apple.jpg" },
  { id: 6, name: "Banana", price: 50, category: "Fruit", vendorId: 3, image: "/images/banana.jpg" },
  { id: 7, name: "Orange", price: 80, category: "Fruit", vendorId: 4, image: "/images/orange.jpg" },
  { id: 8, name: "Mango", price: 150, category: "Fruit", vendorId: 4, image: "/images/mango.jpg" },
  { id: 9, name: "Spinach", price: 15, category: "Leafy", vendorId: 5, image: "/images/spinach.jpg" },
  { id: 10, name: "Cabbage", price: 35, category: "Vegetable", vendorId: 5, image: "/images/cabbage.jpg" },
  { id: 11, name: "Lemon", price: 15, category: "Fruit", vendorId: 5, image: "/images/lemon.jpg" },
  { id: 12, name: "Dragon fruit", price: 150, category: "Fruit", vendorId: 5, image: "/images/dragon.jpg" }
];

// Updated Orders structure to support Multiple Items (Cart System)
const orders = [
  { 
    id: 1, 
    customerName: "Mitesh Chandel"   ,
    customerPhone: "9876543210", 
    items: [
      { id: 1, name: "Tomato", price: 20, quantity: 2 },
      { id: 2, name: "Potato", price: 25, quantity: 1 }
    ], 
    totalPrice: 65, 
    status: "Pending", 
    date: new Date("2026-02-18") 
  },
  { 
    id: 2, 
    customerName: "Ram bhai",
    customerPhone: "9123456789",    
    items: [
      { id: 5, name: "Apple", price: 120, quantity: 1 }
    ], 
    totalPrice: 120, 
    status: "Completed", 
    date: new Date("2026-02-19") 
  },
  { 
    id: 3, 
    customerName: "Rahul Kumar", 
    customerPhone: "8888877777", 
    items: [
      { id: 8, name: "Mango", price: 150, quantity: 2 },
      { id: 11, name: "Lemon", price: 15, quantity: 4 }
    ], 
    totalPrice: 360, 
    status: "Cancelled", 
    date: new Date("2026-02-20") 
  }
];

export { vendors, products, orders };