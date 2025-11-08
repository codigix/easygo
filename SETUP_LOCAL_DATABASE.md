# Local Database Setup Guide

## Prerequisites

- **MySQL/MariaDB** 5.7 or higher installed and running
- **Node.js** v16 or higher
- **npm** or **yarn** package manager

---

## Step 1: Create Database

Open MySQL command line or MySQL Workbench and run:

```sql
CREATE DATABASE easygo_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Or use the quick setup script (see below).

---

## Step 2: Configure Environment Variables

Update `.env` file in the project root with your MySQL credentials:

```env
NODE_ENV=development
PORT=5000

# MySQL Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=admin
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=easygo_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRATION=1d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

**Note**: Use app-specific passwords for Gmail if 2FA is enabled.

---

## Step 3: Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies (in another terminal)
cd frontend
npm install
```

---

## Step 4: Run Migrations

The migrations will automatically create all necessary tables:

```bash
# From the backend directory
cd backend

# Run all migrations
npm run migrate

# Or explicitly:
npx knex migrate:latest
```

**Expected Output:**
```
✓ Migration 20240101000001_create_franchises_table.cjs was executed (x.xxx ms)
✓ Migration 20240101000002_create_users_table.cjs was executed (x.xxx ms)
✓ Migration 20240101000003_create_rate_master_table.cjs was executed (x.xxx ms)
[... more migrations ...]
✓ All migrations completed
```

---

## Step 5: Verify Database Tables

Check that all tables were created:

```bash
# Run verification script
node check_all_tables.cjs
```

Or manually in MySQL:

```sql
USE easygo_db;
SHOW TABLES;
```

Expected tables:
- franchises
- users
- rate_master
- stationary
- bookings
- invoices
- invoice_items
- payments
- tracking
- expenses
- franchise_sectors
- company_rate_master
- courier_company_rates
- knex_migrations
- knex_migrations_lock

---

## Step 6: (Optional) Seed Initial Data

To add test data to your database, you can create a seed file:

```bash
# Generate a new seed file
npx knex seed:make add_initial_data

# Run all seeds
npx knex seed:run
```

Or manually insert a test franchise:

```sql
USE easygo_db;

INSERT INTO franchises (
  franchise_code, franchise_name, owner_name, email, phone,
  address, city, state, pincode, gst_number,
  subscription_status, status
) VALUES (
  'FR001', 'Test Franchise', 'John Doe', 'test@example.com', '9876543210',
  '123 Test Road', 'New Delhi', 'Delhi', '110001', '18AABCT1234H1Z0',
  'active', 'active'
);

INSERT INTO users (
  franchise_id, username, email, password, full_name, phone,
  role, status
) VALUES (
  1, 'admin', 'admin@example.com', '$2b$10$...hashed_password...', 'Admin User', '9876543210',
  'admin', 'active'
);
```

---

## Step 7: Start the Application

```bash
# Start backend server (from backend directory)
npm run dev

# In another terminal, start frontend (from frontend directory)
npm run dev

# Frontend will be at: http://localhost:3000
# Backend will be at: http://localhost:5000
```

---

## Database Backup & Restore

### Backup Database

```bash
# Using mysqldump
mysqldump -u admin -p easygo_db > backup.sql

# Or with a specific timestamp
mysqldump -u admin -p easygo_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database

```bash
# Create empty database first
mysql -u admin -p -e "CREATE DATABASE easygo_db;"

# Restore from backup
mysql -u admin -p easygo_db < backup.sql
```

---

## Troubleshooting

### Issue: "Access Denied" when connecting to MySQL

**Solution:**
1. Verify MySQL is running: `mysql -u root -p`
2. Check credentials in `.env` file
3. Ensure user has database creation privileges:
   ```sql
   GRANT ALL PRIVILEGES ON easygo_db.* TO 'admin'@'localhost' IDENTIFIED BY 'your_password';
   FLUSH PRIVILEGES;
   ```

### Issue: "Database does not exist"

**Solution:**
```sql
CREATE DATABASE easygo_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Issue: Migration fails with "Table already exists"

**Solution:**
This happens when running migrations twice. Check migration status:
```bash
npx knex migrate:status
```

### Issue: Port 3306 already in use

**Solution:**
Change `MYSQL_PORT` in `.env` or stop existing MySQL service

### Issue: Cannot connect after migrations

**Solution:**
```bash
# Test database connection
node backend/check_knex_config.cjs
```

---

## Migration Management

### View Migration Status

```bash
npx knex migrate:status
```

### Rollback Last Migration

```bash
npx knex migrate:rollback
```

### Rollback All Migrations

```bash
npx knex migrate:rollback --all
```

### Create New Migration

```bash
npx knex migrate:make add_new_column_to_users
```

New migration files go into `/backend/migrations/` directory.

---

## Database Schema Details

See `DATABASE_SCHEMA.md` for complete documentation of all tables, columns, relationships, and constraints.

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run migrate` | Run all pending migrations |
| `npx knex migrate:latest` | Same as above |
| `npx knex migrate:rollback` | Undo last migration |
| `npx knex migrate:status` | Check migration status |
| `npx knex seed:run` | Run seed files |
| `npm run dev` | Start development server |

---

## MySQL User Permissions

Ensure your MySQL user has these permissions:

```sql
GRANT CREATE, ALTER, DROP ON easygo_db.* TO 'admin'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON easygo_db.* TO 'admin'@'localhost';
GRANT CREATE TEMPORARY TABLES ON easygo_db.* TO 'admin'@'localhost';
FLUSH PRIVILEGES;
```

---

## Performance Tips

1. **Indexes**: All necessary indexes are created by migrations
2. **Connection Pool**: Configured for 2-10 connections (see `knexfile.cjs`)
3. **Character Set**: UTF8MB4 supports emojis and special characters
4. **Collation**: unicode_ci for case-insensitive searches

---

## Data Isolation

Each franchise's data is completely isolated using `franchise_id` as the main partition key. Always include franchise_id in WHERE clauses.

Example:
```javascript
// ✓ Correct - Isolated to franchise
db('bookings').where({ franchise_id: 1, status: 'booked' })

// ✗ Wrong - Could access other franchises' data
db('bookings').where({ status: 'booked' })
```

---

## Next Steps

1. ✅ Set up the database
2. 📊 Review `DATABASE_SCHEMA.md` for table structures
3. 🔑 Configure authentication with test users
4. 📝 Test the application with sample data
5. 🚀 Deploy to production

---

## Support Resources

- **Knex Documentation**: http://knexjs.org/
- **MySQL Documentation**: https://dev.mysql.com/doc/
- **MariaDB Documentation**: https://mariadb.com/kb/

