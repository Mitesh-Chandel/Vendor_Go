# 🛒 Vendor Marketplace Web Application

A full-stack Vendor Marketplace web application built using **Node.js, Express, EJS, and MongoDB**.  
This platform allows vendors to add products with images and customers to browse marketplace listings.

---

## 🚀 Features

### 👨‍🌾 Vendor Features
- Add new products
- Upload product images
- Add product description & category
- Set product pricing
- Accept terms & conditions before submission

### 🛍️ Customer Features
- Browse all products
- View product details
- Clean and responsive interface

### 🛠️ Technical Features
- MVC structured project
- Image upload using Multer
- Server-side rendering with EJS
- Express routing system
- Custom CSS styling
- Environment variable support
- Git ignore configuration

---

## 🧰 Tech Stack

- **Node.js** – Backend runtime
- **Express.js** – Web framework
- **EJS** – Templating engine
- **MongoDB** – Database
- **Mongoose** – ODM
- **Multer** – Image upload middleware
- **CSS3** – UI styling

---

## 📁 Project Structure

Vendor-Marketplace/
│
├── models/
├── routes/
├── views/
│   ├── vendor/
│   ├── customer/
│   └── partials/
│
├── public/
│   ├── css/
│   └── uploads/
│
├── .env
├── .gitignore
├── package.json
└── app.js

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/vendor-marketplace.git
cd vendor-marketplace
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Create Environment File

Create a `.env` file in the root folder and add:

PORT=3000  
MONGO_URI=your_mongodb_connection_string  

### 4️⃣ Run the Application

```bash
npm start
```

or (if using nodemon):

```bash
nodemon app.js
```

Open in browser:

http://localhost:3000

---

## 📸 Image Upload

- Images are handled using **Multer**
- Stored inside: `public/uploads/`
- Accepts image files only
- Clean file handling system

---

## 🔒 Security & Best Practices

- `.env` file is ignored
- `node_modules` ignored
- Uploaded images ignored
- Proper middleware usage
- Clean project structure

---

## 📱 UI Highlights

- Modern gradient background
- Centered form layout
- Responsive design
- Card-style product form
- Smooth button hover effects

---

## 🎯 Future Improvements

- User Authentication (Login/Register)
- Role-based access control
- Edit & Delete products
- Shopping cart system
- Order management
- Admin dashboard
- Deployment to cloud platform

---

## 👨‍💻 Author

**Mitesh Chandel**  
Aspiring Full Stack Developer  
Ahmedabad, India  

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!

---
