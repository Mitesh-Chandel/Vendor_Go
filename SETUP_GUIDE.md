# Vendor GO - Setup & Installation Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [PostgreSQL Setup](#postgresql-setup)
3. [Project Installation](#project-installation)
4. [Environment Variables](#environment-variables)
5. [Database Initialization](#database-initialization)
6. [Running the Application](#running-the-application)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

Before starting, ensure you have the following installed on your system:

### Required Software
- **Node.js**: v14.0.0 or higher ([Download](https://nodejs.org/))
- **npm**: v6.0.0 or higher (comes with Node.js)
- **PostgreSQL**: v12.0 or higher ([Download](https://www.postgresql.org/download/))
- **Git**: (optional, for cloning repositories)

### Verify Installation
Run these commands to verify your installations:

```bash
node --version      # Should show v14.x.x or higher
npm --version       # Should show 6.x.x or higher
psql --version      # Should show PostgreSQL version
```

---

## 🗄️ PostgreSQL Setup

### Step 1: Install PostgreSQL

#### On Windows
1. Download PostgreSQL installer from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run the installer
3. Note the **password** you set for the `postgres` user (you'll need this)
4. Default port is usually **5432**
5. Complete the installation

#### On macOS
```bash
# Using Homebrew
brew install postgresql@14
brew services start postgresql@14
```

#### On Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Step 2: Create Database and User

Open pgAdmin or use the PostgreSQL terminal:

```bash
# Connect to PostgreSQL
psql -U postgres
```

Then run these SQL commands:

```sql
-- Create a new user (vendor_go_user)
CREATE USER vendor_go_user WITH PASSWORD 'your_secure_password_here';

-- Create a new database
CREATE DATABASE vendor_go_db OWNER vendor_go_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE vendor_go_db TO vendor_go_user;

-- Connect to the database
\c vendor_go_db

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO vendor_go_user;

-- Exit psql
\q
```

### Step 3: Verify Connection

Test the connection:

```bash
psql -U vendor_go_user -d vendor_go_db -h localhost -W
# Enter your password when prompted
```

---

## 📥 Project Installation

### Step 1: Navigate to Project Directory

```bash
cd path/to/vendor_go_project
```

### Step 2: Install Node Dependencies

```bash
npm install
```

This will install all required packages listed in `package.json`:
- express
- postgresql (pg)
- bcrypt
- ejs
- express-session
- socket.io
- multer
- nodemailer
- axios
- dotenv
- helmet

### Step 3: Verify Installation

```bash
npm list
# Should show all installed packages without errors
```

---

## 🔐 Environment Variables (.env File)

### Step 1: Create .env File

In the root directory of your project, create a file named `.env`:

```bash
touch .env    # On macOS/Linux
# or
New-Item -Path .env -ItemType File    # On Windows PowerShell
```

### Step 2: Add Configuration Values

Copy and paste the following into your `.env` file and update with your values:

```env
# ============================================
# DATABASE CONFIGURATION
# ============================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vendor_go_db
DB_USER=vendor_go_user
DB_PASSWORD=your_secure_password_here

# ============================================
# APPLICATION CONFIGURATION
# ============================================
NODE_ENV=development
PORT=3000
HOST=localhost

# ============================================
# SESSION CONFIGURATION
# ============================================
SESSION_SECRET=your-super-secret-key-change-this-in-production
SESSION_RESAVE=false
SESSION_SAVE_UNINITIALIZED=true

# ============================================
# EMAIL CONFIGURATION (Nodemailer)
# ============================================
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
EMAIL_FROM=noreply@vendorgo.com

# Note: For Gmail:
# 1. Enable 2-Factor Authentication in your Google Account
# 2. Generate an App Password: https://myaccount.google.com/apppasswords
# 3. Use the 16-character App Password above

# ============================================
# FILE UPLOAD CONFIGURATION
# ============================================
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE=5242880   # 5MB in bytes

# ============================================
# APPLICATION SETTINGS
# ============================================
OTP_EXPIRY=10           # OTP validity in minutes
OTP_LENGTH=6            # Length of OTP code
SESSION_TIMEOUT=3600    # Session timeout in seconds (1 hour)
```

### Step 3: Environment Variables Explanation

| Variable | Example | Description |
|----------|---------|-------------|
| `DB_HOST` | localhost | PostgreSQL server hostname |
| `DB_PORT` | 5432 | PostgreSQL server port |
| `DB_NAME` | vendor_go_db | Database name |
| `DB_USER` | vendor_go_user | PostgreSQL user |
| `DB_PASSWORD` | secure_pwd | PostgreSQL password |
| `NODE_ENV` | development | Environment (development/production) |
| `PORT` | 3000 | Application port |
| `HOST` | localhost | Application host |
| `SESSION_SECRET` | vendor-secret | Secret key for session encryption |
| `EMAIL_SERVICE` | gmail | Email service provider |
| `EMAIL_USER` | user@gmail.com | Email account for sending emails |
| `EMAIL_PASSWORD` | xxxx xxxx xxxx xxxx | App-specific password |
| `UPLOAD_DIR` | ./public/uploads | Directory for file uploads |
| `MAX_FILE_SIZE` | 5242880 | Max upload size in bytes |
| `OTP_EXPIRY` | 10 | OTP validity period in minutes |
| `OTP_LENGTH` | 6 | OTP code length |
| `SESSION_TIMEOUT` | 3600 | Session validity in seconds |

### Security Notes for .env

```
⚠️  IMPORTANT SECURITY GUIDELINES:

1. NEVER commit .env file to Git
   - Add .env to .gitignore immediately
   - File contains sensitive credentials

2. Use Strong Passwords
   - DB_PASSWORD: Minimum 12 characters with mixed case, numbers, symbols
   - SESSION_SECRET: Generate random string

3. Email Configuration
   - Use App-Specific Passwords, NOT your actual password
   - Gmail: https://myaccount.google.com/apppasswords
   - Other providers: Check their documentation

4. Production Environment
   - Use different values for production
   - Store in secure vault (AWS Secrets Manager, HashiCorp Vault, etc.)
   - Never hardcode credentials

5. File Permissions
   - chmod 600 .env    # Only owner can read/write
```

---

## 🗄️ Database Initialization

### Step 1: Verify Database Connection Code

Navigate to `/data/db.js` and ensure your database connection uses the .env variables:

```javascript
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new pg.Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});
```

### Step 2: Run Schema SQL File

All SQL queries for creating database tables are in the **`schema.sql`** file.

**Using pgAdmin (GUI):**
1. Open pgAdmin
2. Right-click on database `vendor_go_db`
3. Select "Query Tool"
4. Copy and paste contents of `schema.sql`
5. Click "Execute" button

**Using Terminal/Command Line:**

```bash
# Connect and run schema file
psql -U vendor_go_user -d vendor_go_db -f schema.sql

# OR connect manually and paste SQL:
psql -U vendor_go_user -d vendor_go_db
# Then paste the entire schema.sql content
```

### Step 3: Verify Tables

```bash
psql -U vendor_go_user -d vendor_go_db

# List all tables
\dt

# Describe a table structure
\d vendors

# Count records in each table
SELECT COUNT(*) as vendor_count FROM vendors;
SELECT COUNT(*) as customer_count FROM customers;
SELECT COUNT(*) as product_count FROM products;

# Exit
\q
```

---

## 🚀 Running the Application

### Step 1: Install Development Tools (Optional)

For auto-restart on file changes, install nodemon globally:

```bash
npm install -g nodemon
```

### Step 2: Add npm Scripts

Update your `package.json` with these scripts:

```json
"scripts": {
  "start": "node app.js",
  "dev": "nodemon app.js",
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

### Step 3: Start the Application

#### Development Mode (with auto-reload)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

### Step 4: Access the Application

Open your browser and navigate to:
- **Home**: `http://localhost:3000`
- **Vendor Login**: `http://localhost:3000/vendor/login`
- **Customer Shop**: `http://localhost:3000/customer/shop`
- **Admin Login**: `http://localhost:3000/admin/login`

### Expected Output

```
✓ Server running on http://localhost:3000
✓ Database connected successfully
✓ Socket.IO initialized
✓ Session middleware loaded
```

---

## 🔧 Development Workflow

### Using nodemon.json

The `nodemon.json` file should contain:

```json
{
  "watch": ["app.js", "routes", "views", "data", "public"],
  "ignore": ["public/uploads", "node_modules"],
  "ext": "js,ejs,css",
  "delay": 1000
}
```

### File Structure During Development

```
vendor_go_project/
├── node_modules/          # Auto-created, don't commit
├── public/
│   └── uploads/          # User uploads, may create during development
├── .env                  # Create this (DON'T commit)
├── .gitignore            # Create this
└── ... (other files)
```

### Create .gitignore

```
# Dependencies
node_modules/
package-lock.json
yarn.lock

# Environment variables
.env
.env.local
.env.*.local

# Uploads
public/uploads/*
!public/uploads/.gitkeep

# Logs
logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
```

---

## 🔍 Database Connection Troubleshooting

### Connection String Format

If using a connection string instead of individual variables:

```env
DATABASE_URL=postgresql://vendor_go_user:password@localhost:5432/vendor_go_db
```

### Test Connection

```bash
# Windows/macOS/Linux
psql -U vendor_go_user -d vendor_go_db -h localhost

# Enter password when prompted
# If connected successfully, you'll see:
# vendor_go_db=>
```

---

## 🐛 Troubleshooting

### Issue: Database Connection Failed

**Error**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solutions**:
1. Verify PostgreSQL is running:
   - Windows: Check Services → PostgreSQL
   - macOS: `brew services list`
   - Linux: `sudo systemctl status postgresql`
2. Check .env file has correct credentials
3. Verify database user exists: `psql -U postgres` → `\du`
4. Verify database exists: `psql -U postgres` → `\l`

### Issue: .env file not loading

**Error**: `process.env.DB_PASSWORD is undefined`

**Solutions**:
1. Ensure .env file exists in project root
2. Ensure `dotenv` package is installed: `npm install dotenv`
3. Call `dotenv.config()` in app.js before using env variables:
   ```javascript
   import dotenv from 'dotenv';
   dotenv.config();
   ```

### Issue: Email sending fails

**Error**: `Invalid login: 535-5.7.8 Username and password not accepted`

**Solutions**:
1. For Gmail: Use App Password, not regular password
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Ensure 2-Factor Authentication is enabled
4. Verify EMAIL_USER and EMAIL_PASSWORD in .env
5. For other providers, check their SMTP settings

### Issue: PORT already in use

**Error**: `Error: listen EADDRINUSE :::3000`

**Solutions**:
```bash
# Find process using port 3000
# On Windows
netstat -ano | findstr :3000

# On macOS/Linux
lsof -i :3000

# Kill the process
# Windows
taskkill /PID <PID> /F

# macOS/Linux
kill -9 <PID>
```

Or use a different port in .env:
```env
PORT=3001
```

### Issue: Session errors

**Error**: `Error: secret option required for session`

**Solutions**:
1. Ensure SESSION_SECRET is set in .env
2. Make sure .env is loaded before express-session middleware
3. Use a strong random string for SESSION_SECRET

### Issue: multer file upload fails

**Error**: `Error: ENOENT: no such file or directory`

**Solutions**:
1. Create `public/uploads` directory:
   ```bash
   mkdir -p public/uploads
   ```
2. Ensure UPLOAD_DIR in .env matches the directory path
3. Check file permissions (directory should be writable)

---

## 📞 Additional Resources

- [Node.js Documentation](https://nodejs.org/en/docs/)
- [Express Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [EJS Documentation](https://ejs.co/)

---

## ✅ Setup Verification Checklist

Before running the application, ensure all of these are complete:

- [ ] Node.js and npm installed
- [ ] PostgreSQL installed and running
- [ ] Project dependencies installed (`npm install`)
- [ ] PostgreSQL database and user created
- [ ] .env file created with all required variables
- [ ] Database tables created
- [ ] public/uploads directory exists
- [ ] .gitignore created and .env added
- [ ] nodemon.json configured (optional)
- [ ] npm scripts added to package.json
- [ ] Server starts without errors (`npm run dev`)
- [ ] Can access application in browser

---

**You're all set! Happy coding! 🎉**
