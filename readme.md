# Vendor GO - Multi-Vendor E-Commerce Platform

## 📋 Project Overview

**Vendor GO** is a comprehensive multi-vendor e-commerce platform that connects vendors, customers, and administrators in a unified ecosystem. This Node.js/Express application provides real-time features, secure transactions, and seamless vendor management.

## ✨ Key Features

### For Vendors
- **Vendor Dashboard**: Manage products and orders
- **Product Management**: Add, edit, and manage product inventory
- **Order Processing**: Real-time order notifications and status tracking
- **Vendor Authentication**: Secure login with encrypted passwords

### For Customers
- **Product Browsing**: Shop from multiple vendors
- **Shopping Cart**: Dynamic cart management
- **Order Placement**: Easy checkout process
- **Order Tracking**: Real-time order status updates
- **OTP Verification**: Secure account verification
- **Order History**: View past purchases

### For Administrators
- **Admin Dashboard**: System-wide monitoring and management
- **User Management**: Monitor vendors and customers
- **Order Monitoring**: Track all platform transactions
- **Admin Authentication**: Secure admin panel access

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 5.2.1
- **Database**: PostgreSQL
- **ORM**: Native pg driver
- **Authentication**: bcrypt for password hashing
- **Sessions**: express-session

### Frontend
- **Template Engine**: EJS (Embedded JavaScript)
- **Styling**: CSS
- **Real-time Communication**: Socket.IO
- **HTTP Client**: Axios

### Additional Libraries
- **Security**: Helmet for HTTP headers
- **File Upload**: Multer
- **Email Service**: Nodemailer
- **Environment Config**: dotenv
- **Auto-reload**: nodemon (development)

## 📁 Project Structure

```
vendor_go_project/
├── app.js                    # Main application entry point
├── nodemon.json             # Nodemon development configuration
├── package.json             # Project dependencies and metadata
├── README.md                # Project documentation
├── SETUP_GUIDE.md          # Installation and setup instructions
│
├── data/                    # Database utilities and models
│   ├── db.js               # Database connection configuration
│   ├── orders.js           # Order-related database operations
│   ├── products.js         # Product-related database operations
│   └── vendors.js          # Vendor-related database operations
│
├── routes/                  # Express route definitions
│   ├── vendor.js           # Vendor routes (products, dashboard, login)
│   ├── customer.js         # Customer routes (shop, cart, orders)
│   └── admin.js            # Admin routes (dashboard, management)
│
├── views/                   # EJS template files
│   ├── home.ejs            # Home page
│   ├── admin/
│   │   ├── dashboard.ejs   # Admin dashboard
│   │   └── login.ejs       # Admin login page
│   ├── customer/
│   │   ├── cart.ejs        # Shopping cart
│   │   ├── order-success.ejs
│   │   ├── orders.ejs      # Customer orders history
│   │   ├── product-detail.ejs
│   │   ├── shop.ejs        # Product listing
│   │   └── verify-otp.ejs  # OTP verification
│   ├── vendor/
│   │   ├── add-product.ejs # Add product form
│   │   ├── dashboard.ejs   # Vendor dashboard
│   │   └── login.ejs       # Vendor login page
│   └── partials/
│       ├── footer.ejs      # Footer component
│       └── navbar.ejs      # Navigation bar component
│
└── public/                  # Static assets
    ├── css/
    │   ├── vendoradd.css   # Vendor add product styles
    │   └── vendordash.css  # Vendor dashboard styles
    └── uploads/            # User-uploaded files directory
```

## 🔧 Core Functionality

### Database Layer (`/data`)
- **db.js**: PostgreSQL connection management
- **vendors.js**: Vendor CRUD operations, authentication
- **customers.js**: Customer profile management, order history
- **products.js**: Product inventory, stock management
- **orders.js**: Order creation, status tracking

### API Routes (`/routes`)
- **Vendor Routes**: Registration, login, product management, dashboard
- **Customer Routes**: Shopping, cart management, checkout, order tracking
- **Admin Routes**: Dashboard, user monitoring, order management

### Real-time Features
- Socket.IO integration for:
  - Live order notifications
  - Real-time inventory updates
  - Instant cart synchronization
  - Admin dashboard live updates

## 🔐 Security Features

- **Password Encryption**: bcrypt hashing for user passwords
- **Session Management**: Secure session handling with express-session
- **HTTP Headers**: Helmet for enhanced security
- **Input Validation**: URL-encoded and JSON body parsing
- **CORS**: Controlled cross-origin access
- **Environment Variables**: Sensitive data in .env file

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

### Installation

1. **Clone and navigate to project**
   ```bash
   cd vendor_go_project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup PostgreSQL database**
   - Create a new PostgreSQL database
   - Set up database credentials in .env file

4. **Configure environment variables**
   - Create a `.env` file in the root directory
   - See SETUP_GUIDE.md for detailed configuration

5. **Run the application**
   ```bash
   npm start
   ```

   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

## 📚 Documentation

- **SETUP_GUIDE.md**: Comprehensive setup and installation instructions, database configuration, and environment variables

## 🎯 Development Workflow

1. Make changes to your code
2. nodemon automatically restarts the server
3. View changes at `http://localhost:3000` (or configured port)
4. Check browser console and server logs for debugging

## 📝 Database Schema

The application uses PostgreSQL with the following main entities:

- **Users**: Vendors, Customers, Admins
- **Products**: Vendor products with inventory
- **Orders**: Customer orders with order items
- **Sessions**: User session management

Refer to `/data` directory for detailed database operations.

## 🛡️ Environment Variables

The application requires several environment variables for proper functioning. See `.env.example` or SETUP_GUIDE.md for complete list.

Key variables:
- Database credentials
- Session secret
- Email service credentials (Nodemailer)
- Upload directory configuration
- Application port

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit for review

## 📄 License

ISC - See package.json for details

## 👤 Author

Mitesh Chandel

---

For detailed setup and installation instructions, please refer to [SETUP_GUIDE.md](./SETUP_GUIDE.md).
