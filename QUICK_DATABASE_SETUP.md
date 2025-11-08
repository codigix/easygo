# Quick Database Setup - 5 Minutes

## Option 1: Using Migrations (Recommended)

### 1. Update Environment Variables
Edit `.env`:
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=admin
MYSQL_PASSWORD=yourpassword
MYSQL_DATABASE=easygo_db
```

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Create Database
```bash
mysql -u root -p -e "CREATE DATABASE easygo_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 4. Run Migrations
```bash
npm run migrate
```

Done! All tables are created.

---

## Option 2: Using Direct SQL

### 1. Update Environment Variables (Same as above)

### 2. Create Database and Run SQL
```bash
mysql -u admin -p < database_schema.sql
```

Or manually in MySQL:
```bash
mysql -u root -p
```

Then:
```sql
SOURCE /path/to/database_schema.sql;
```

---

## Verify Setup

### Check All Tables Exist
```bash
cd backend
node check_all_tables.cjs
```

### Or Manual Check
```bash
mysql -u admin -p easygo_db -e "SHOW TABLES;"
```

Expected output:
```
+------------------------+
| Tables_in_easygo_db    |
+------------------------+
| bookings               |
| company_rate_master    |
| courier_company_rates  |
| expenses               |
| franchise_sectors      |
| franchises             |
| invoice_items          |
| invoices               |
| knex_migrations        |
| knex_migrations_lock   |
| payments               |
| rate_master            |
| stationary             |
| tracking               |
| users                  |
+------------------------+
```

---

## Start Application

```bash
# Terminal 1: Start Backend
cd backend
npm run dev

# Terminal 2: Start Frontend
cd frontend
npm run dev
```

Access application at: **http://localhost:3000**

---

## Database Files Reference

- **DATABASE_SCHEMA.md** - Complete schema documentation with all columns and relationships
- **SETUP_LOCAL_DATABASE.md** - Detailed setup guide with troubleshooting
- **database_schema.sql** - SQL file to create all tables directly
- **backend/knexfile.cjs** - Knex configuration
- **backend/migrations/** - All migration files

---

## Command Reference

| Task | Command |
|------|---------|
| Run migrations | `npm run migrate` |
| Check migration status | `npx knex migrate:status` |
| Rollback last migration | `npx knex migrate:rollback` |
| Create new migration | `npx knex migrate:make migration_name` |
| View MySQL tables | `mysql -u admin -p easygo_db -e "SHOW TABLES;"` |
| Backup database | `mysqldump -u admin -p easygo_db > backup.sql` |
| Restore from backup | `mysql -u admin -p easygo_db < backup.sql` |

---

## Common Issues & Fixes

**Issue**: `Access Denied when connecting to MySQL`
```bash
# Fix: Update credentials in .env
MYSQL_USER=admin
MYSQL_PASSWORD=yourpassword
```

**Issue**: `Table already exists error`
```bash
# Fix: Database already migrated, run:
npx knex migrate:status
```

**Issue**: `Port 3306 already in use`
```bash
# Fix: Change port in .env or stop MySQL
MYSQL_PORT=3307
```

---

## Sample Test User (Insert Manually)

After migrations complete:

```sql
USE easygo_db;

-- Insert test franchise
INSERT INTO franchises (
  franchise_code, franchise_name, owner_name, email, phone,
  address, city, state, pincode, gst_number,
  subscription_status, status
) VALUES (
  'TEST001', 'Test Franchise', 'John Doe', 'franchise@test.com', '9876543210',
  '123 Test Street', 'New Delhi', 'Delhi', '110001', '18AABCT1234H1Z0',
  'active', 'active'
);

-- Insert test user (password: hashed 'password123')
INSERT INTO users (
  franchise_id, username, email, password, full_name, phone, role, status
) VALUES (
  1, 'testuser', 'user@test.com', 
  '$2b$10$GtPILEcgHx6j0J0.Nq4hzuWDf5aQp1RxM6h7L5D4Uo4eN8.0DUZhK', 
  'Test User', '9876543210', 'admin', 'active'
);
```

---

## Next: Add Sample Data

Create test rate data:
```sql
INSERT INTO rate_master (
  franchise_id, from_pincode, to_pincode, service_type,
  weight_from, weight_to, rate, fuel_surcharge, gst_percentage
) VALUES (
  1, '110001', '110002', 'Surface',
  0.00, 1.00, 50.00, 5.00, 18.00
);
```

---

## Documentation

For detailed information about:
- Table structures → **DATABASE_SCHEMA.md**
- Migration details → **backend/migrations/**
- Setup troubleshooting → **SETUP_LOCAL_DATABASE.md**

---

**Status**: ✅ Database ready for development

