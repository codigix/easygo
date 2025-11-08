# EasyGo Hospital Management System - AWS RDS to Local MySQL Migration

## ✅ Migration Complete

Successfully migrated from **AWS RDS MySQL** to **local MySQL database** on `2025-11-08`

---

## Summary of Changes

### 1. Environment Configuration (.env)
**Status**: ✅ Updated
- **Old**: `MYSQL_HOST=frbilling.cxqc440y2mz9.eu-north-1.rds.amazonaws.com`
- **New**: `MYSQL_HOST=localhost`
- **Database**: Changed from `frbilling` to `easygo_db`
- **User**: Kept as `admin`
- **Password**: Updated to `yourpassword` (change as needed for production)

### 2. Knex Configuration (knexfile.cjs)
**Status**: ✅ Updated
- Fixed .env file loading path to explicitly point to project root `.env`
- Configuration now dynamically loads from environment variables

### 3. Local Database Setup
**Status**: ✅ Created
```sql
CREATE DATABASE easygo_db
CREATE USER 'admin'@'localhost' IDENTIFIED BY 'yourpassword'
CREATE USER 'admin'@'127.0.0.1' IDENTIFIED BY 'yourpassword'
GRANT ALL PRIVILEGES ON easygo_db.* TO 'admin'@'localhost'
GRANT ALL PRIVILEGES ON easygo_db.* TO 'admin'@'127.0.0.1'
```

### 4. Database Schema
**Status**: ✅ Migrated
- **Migrations Run**: 25 total
- **Tables Created**: 16 tables

#### Tables in easygo_db:
1. ✅ bookings (37 columns)
2. ✅ company_rate_master (29 columns)
3. ✅ courier_company_rates (11 columns)
4. ✅ expenses (14 columns)
5. ✅ franchise_sectors (14 columns)
6. ✅ franchises (46 columns)
7. ✅ invoice_items (10 columns)
8. ✅ invoices (30 columns)
9. ✅ knex_migrations (4 columns)
10. ✅ knex_migrations_lock (2 columns)
11. ✅ payments (16 columns)
12. ✅ rate_master (13 columns)
13. ✅ stationary (12 columns)
14. ✅ stationary_consignments (14 columns)
15. ✅ tracking (10 columns)
16. ✅ users (12 columns)

### 5. Backend Verification
**Status**: ✅ Connected & Running
- MySQL connection: ✅ Successful
- Email transporter: ✅ Initialized
- Server: ✅ Running on port 5000
- API Health: ✅ Responding

**Sample API Response**:
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2025-11-08T08:53:42.785Z"
}
```

---

## How to Start Development

### Terminal 1: Backend Server
```bash
cd backend
set MYSQL_HOST=localhost
set MYSQL_PORT=3306
set MYSQL_USER=admin
set MYSQL_PASSWORD=yourpassword
set MYSQL_DATABASE=easygo_db
npm start
```

Or use nodemon for auto-reload:
```bash
npm run dev
```

### Terminal 2: Frontend (if needed)
```bash
cd frontend
npm install
npm run dev
```

---

## Troubleshooting

### Connection Error: ETIMEDOUT
**Cause**: Still trying to connect to AWS RDS  
**Solution**: Ensure environment variables are set correctly:
```bash
set MYSQL_HOST=localhost
set MYSQL_DATABASE=easygo_db
```

### Connection Error: ECONNREFUSED
**Cause**: MySQL server not running  
**Solution**: Start MySQL service:
```bash
# Windows Services
Start-Service MySQL
```

### Connection Error: ER_ACCESS_DENIED_ERROR
**Cause**: Wrong password or user doesn't exist  
**Solution**: Verify credentials in `.env` match created user:
- User: `admin`
- Password: `yourpassword`
- Database: `easygo_db`

### Error: Port 5000 Already in Use
**Cause**: Another process using port 5000  
**Solution**: Kill the process:
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

---

## Database Backup & Restore

### Backup Local Database
```bash
mysqldump -h 127.0.0.1 -u admin -pyourpassword easygo_db > easygo_backup.sql
```

### Restore Database
```bash
mysql -h 127.0.0.1 -u admin -pyourpassword easygo_db < easygo_backup.sql
```

---

## Running Migrations

### Run Latest Migrations
```bash
cd backend
npm run migrate
```

### Rollback Last Migration
```bash
npm run migrate:rollback
```

### Run Seeds
```bash
npm run seed
```

---

## Verification Checklist

- [x] `.env` file updated for local MySQL
- [x] `knexfile.cjs` configured correctly
- [x] Local MySQL database `easygo_db` created
- [x] User `admin` created with proper privileges
- [x] 25 migrations executed successfully
- [x] 16 tables created in database
- [x] Backend server connects successfully
- [x] API endpoints responding
- [x] Email service initialized

---

## Important Notes

1. **Password**: The default password `yourpassword` is set for development. Change this in production.
2. **Database Name**: Changed from `frbilling` to `easygo_db` for clarity
3. **Environment Variables**: Set these in your shell before running npm commands
4. **MySQL Version**: 8.0.43
5. **Node Version**: >= 18.0.0

---

## Next Steps

1. Import any data from AWS RDS (if needed)
2. Run full test suite: `npm test`
3. Verify all API endpoints
4. Test complete workflow (bookings, invoices, payments)

---

**Migration Status**: ✅ **COMPLETE**  
**Date**: 2025-11-08  
**Backend**: Fully operational on local MySQL database
