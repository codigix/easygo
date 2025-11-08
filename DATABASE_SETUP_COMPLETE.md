# EasyGo Database Setup - Complete Guide

**Status**: ✅ All database schema files are ready for your local database setup

---

## 📋 What's Included

This project includes a complete database schema with **13 tables** for managing:
- **Franchises & Users** - Multi-tenant franchise management
- **Bookings/Consignments** - Shipment tracking and management
- **Invoicing** - Automated invoice generation and tracking
- **Payments** - Payment receipt and tracking
- **Rate Management** - Dynamic pricing for different routes and services
- **Expenses** - Expense tracking and management
- **Stationary/Inventory** - Inventory management
- **Tracking** - Shipment tracking history
- **Courier Rates** - Courier-specific rate management

---

## 🚀 Quick Start (3 Steps)

### Step 1: Configure Environment
Edit `.env` file with your MySQL credentials:
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=admin
MYSQL_PASSWORD=yourpassword
MYSQL_DATABASE=easygo_db
```

### Step 2: Create Database & Run Migrations
```bash
# Option A: Using Migrations (Recommended)
cd backend
npm install
npm run migrate

# Option B: Direct SQL (Alternative)
mysql -u root -p < database_schema.sql
```

### Step 3: Verify Installation
```bash
# Check all tables created
node backend/check_all_tables.cjs

# Or manually:
mysql -u admin -p easygo_db -e "SHOW TABLES;"
```

**Expected tables**: 15 tables (13 + 2 Knex migration tables)

---

## 📚 Documentation Files

### 1. **DATABASE_SCHEMA.md** (DETAILED)
Complete reference for all tables:
- ✅ All column names and types
- ✅ Data types and constraints
- ✅ Relationships and foreign keys
- ✅ Indexes for performance
- ✅ Best practices for querying

**Use this when**: You need to understand the complete schema structure

---

### 2. **SETUP_LOCAL_DATABASE.md** (COMPREHENSIVE)
Complete setup guide with troubleshooting:
- ✅ Prerequisites and installation
- ✅ Step-by-step setup instructions
- ✅ Environment configuration
- ✅ Running migrations
- ✅ Database backup & restore
- ✅ Troubleshooting common issues
- ✅ Permission management

**Use this when**: You're setting up for the first time or need help troubleshooting

---

### 3. **QUICK_DATABASE_SETUP.md** (FAST)
5-minute quick start guide:
- ✅ Two quick setup options
- ✅ Verification commands
- ✅ Common issues & fixes
- ✅ Command reference

**Use this when**: You want to get started quickly

---

### 4. **database_schema.sql** (SQL FILE)
Raw SQL to create all tables:
- ✅ Can be run directly in MySQL
- ✅ Creates database and all 13 tables
- ✅ Includes all constraints and indexes
- ✅ Alternative to using Knex migrations

**Use this when**: You prefer direct SQL or want a backup method

---

## 🏗️ Database Architecture

### Schema Overview
```
easygo_db (Main Database)
├── franchises (Master company data)
│   ├── users (Employees/users per franchise)
│   ├── rate_master (Shipping rates)
│   ├── company_rate_master (Courier rates)
│   ├── courier_company_rates (Detailed courier rates)
│   ├── stationary (Inventory items)
│   ├── franchise_sectors (Service sectors)
│   ├── bookings (Shipments/consignments)
│   │   ├── invoice_items (Line items in invoice)
│   │   └── tracking (Shipment tracking)
│   ├── invoices (Billing documents)
│   │   └── payments (Payment receipts)
│   └── expenses (Operational expenses)
└── knex_migrations (Migration tracking)
```

### Total Tables: 13 Main + 2 System = 15 Tables

---

## 📊 Table Summary

| # | Table | Purpose | Rows | Key Fields |
|---|-------|---------|------|-----------|
| 1 | franchises | Company master data | ~10s | franchise_code, email |
| 2 | users | Employee accounts | ~100s | franchise_id, username, role |
| 3 | bookings | Shipment records | ~1000s+ | consignment_number, booking_date |
| 4 | invoices | Billing documents | ~100s+ | invoice_number, invoice_date |
| 5 | invoice_items | Invoice line items | ~1000s+ | invoice_id, booking_id |
| 6 | payments | Payment records | ~100s+ | payment_number, payment_date |
| 7 | tracking | Shipment tracking | ~10000s+ | booking_id, status_date |
| 8 | expenses | Cost tracking | ~1000s | expense_date, category |
| 9 | rate_master | Base rates | ~1000s | from_pincode, to_pincode |
| 10 | company_rate_master | Company rates | ~100s | company_id, company_name |
| 11 | courier_company_rates | Courier rates | ~1000s+ | company_id, courier_type |
| 12 | stationary | Inventory | ~100s | item_code, quantity |
| 13 | franchise_sectors | Service sectors | ~100s+ | sector_name, pincodes |

---

## 🔑 Key Features

### Multi-Tenant Architecture
- ✅ Complete data isolation by `franchise_id`
- ✅ Each franchise has independent users, bookings, invoices, etc.
- ✅ Secure data separation with foreign key constraints

### Comprehensive Booking System
- ✅ Sender/Receiver details
- ✅ Service type selection (Surface/Air/Express)
- ✅ Weight-based pricing
- ✅ Automatic charge calculation (tax, fuel, other)
- ✅ Payment tracking
- ✅ Shipment status tracking

### Invoice Management
- ✅ Automatic invoice generation from bookings
- ✅ Line-item tracking
- ✅ Multiple payment statuses
- ✅ Tax calculations
- ✅ Payment receipt integration

### Rate Management
- ✅ Dynamic rates based on pincode & weight
- ✅ Service-type specific rates
- ✅ Fuel surcharge support
- ✅ GST percentage configuration
- ✅ Company-specific rates
- ✅ Courier-specific rates with slabs

### Financial Tracking
- ✅ Expense categorization
- ✅ Approval workflow
- ✅ Multiple payment modes
- ✅ Payment reconciliation
- ✅ Balance tracking

---

## 📈 Data Flow Example

```
Create Booking
    ↓
Auto-calculate charges (using rate_master)
    ↓
Store calculated amounts in bookings
    ↓
Generate Invoice (from bookings)
    ↓
Create invoice_items (one per booking)
    ↓
Customer receives invoice
    ↓
Record Payment (create payment record)
    ↓
Update invoice payment_status
    ↓
Track shipment (update tracking table)
    ↓
Mark booking as delivered
```

---

## 🔐 Security Features

- ✅ Foreign key constraints prevent orphaned records
- ✅ Data isolation by franchise_id
- ✅ Timestamps for audit trail (created_at, updated_at)
- ✅ Status enums prevent invalid states
- ✅ Unique constraints on business keys
- ✅ Password hashing (via application)
- ✅ JWT token authentication (via application)

---

## ⚡ Performance Optimizations

### Indexes Created
- Franchise_id indexes for multi-tenant queries
- Composite indexes for common filter combinations
- Status columns indexed for frequent filtering
- Date columns indexed for range queries
- Primary keys and unique constraints

### Database Configuration
- Connection pooling (2-10 connections)
- UTF8MB4 charset for international support
- InnoDB engine for transactions
- Default collation for case-insensitive searches

---

## 🛠️ Maintenance Tasks

### Regular Backups
```bash
# Daily backup
mysqldump -u admin -p easygo_db > backup_$(date +%Y%m%d).sql

# Restore from backup
mysql -u admin -p easygo_db < backup_20240101.sql
```

### Monitor Migrations
```bash
# Check migration status
npx knex migrate:status

# View last 10 completed migrations
npx knex migrate:status | tail -10
```

### Database Health Check
```bash
# Run verification script
node backend/check_all_tables.cjs

# Check table sizes
mysql -u admin -p easygo_db -e "
  SELECT table_name, 
         ROUND((data_length+index_length)/1024/1024, 2) as size_mb 
  FROM information_schema.tables 
  WHERE table_schema='easygo_db' 
  ORDER BY (data_length+index_length) DESC;
"
```

---

## 📋 Checklist

Use this checklist to verify your setup:

- [ ] MySQL/MariaDB installed and running
- [ ] Database created: `easygo_db`
- [ ] `.env` configured with correct credentials
- [ ] Backend dependencies installed: `npm install`
- [ ] Migrations run successfully: `npm run migrate`
- [ ] All 13 tables created and visible
- [ ] Frontend dependencies installed
- [ ] Backend server starts: `npm run dev`
- [ ] Frontend starts: `npm run dev`
- [ ] Can access application: `http://localhost:3000`
- [ ] Created test franchise and user
- [ ] Sample rate data inserted (optional)

---

## 🚀 What's Next

After database setup:

1. **Create Test User** - Login to the application
2. **Add Sample Data** - Test with sample bookings and invoices
3. **Configure Rates** - Set up rate master data
4. **Test Workflows** - Test booking → invoice → payment flow
5. **Deploy** - Move to staging/production

---

## 📞 Support Resources

### Documentation
- Knex.js Docs: http://knexjs.org/
- MySQL Docs: https://dev.mysql.com/doc/
- Express.js: https://expressjs.com/

### Common Commands
```bash
# Migrations
npm run migrate              # Run pending migrations
npm run migrate:rollback     # Undo last migration

# Database
node check_all_tables.cjs   # Verify tables
node check_knex_config.cjs  # Test connection

# Development
npm run dev                 # Start development server
npm run lint                # Run linting
```

---

## 📝 Notes

- **Database Name**: `easygo_db`
- **Charset**: UTF8MB4 (supports emojis and special characters)
- **Tables**: 13 main tables + 2 Knex system tables = 15 total
- **Engine**: InnoDB (transactions support)
- **Backup**: Recommended weekly backups
- **Scaling**: Ready for multi-franchise operation

---

## ✅ Verification Commands

Run these to verify complete setup:

```bash
# 1. Check database exists
mysql -u admin -p -e "SELECT DATABASE();"

# 2. List all tables
mysql -u admin -p easygo_db -e "SHOW TABLES;"

# 3. Check table row count (should be mostly empty initially)
mysql -u admin -p easygo_db -e "
  SELECT table_name, table_rows 
  FROM information_schema.tables 
  WHERE table_schema='easygo_db' 
  ORDER BY table_name;
"

# 4. Test knex migration status
cd backend
npx knex migrate:status
```

---

**Last Updated**: November 2024  
**Status**: Ready for Local Development  
**Version**: 1.0  

For questions, refer to the specific documentation files listed above.

