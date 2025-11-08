# Database Files Index

## 📋 All Database Documentation Files

Navigate to the file you need based on your task:

---

## 🎯 By Task

### "I need to set up the database right now"
→ **QUICK_DATABASE_SETUP.md** (5 minutes)

### "I'm setting up for the first time and need detailed help"
→ **SETUP_LOCAL_DATABASE.md** (Comprehensive guide)

### "I need to understand the complete schema"
→ **DATABASE_SCHEMA.md** (Complete reference)

### "I want to use direct SQL instead of migrations"
→ **database_schema.sql** (SQL file)

### "I want an overview of everything"
→ **DATABASE_SETUP_COMPLETE.md** (This page)

---

## 📂 File Structure

```
easygo/
├── DATABASE_FILES_INDEX.md (THIS FILE)
│   └─ Quick navigation to all database docs
│
├── QUICK_DATABASE_SETUP.md
│   └─ 5-minute quick start guide
│
├── SETUP_LOCAL_DATABASE.md
│   └─ Detailed setup with troubleshooting
│
├── DATABASE_SCHEMA.md
│   └─ Complete schema documentation
│
├── DATABASE_SETUP_COMPLETE.md
│   └─ Overview and summary
│
├── database_schema.sql
│   └─ Raw SQL to create all tables
│
├── backend/
│   ├── knexfile.cjs
│   │   └─ Knex configuration
│   ├── migrations/
│   │   ├── 20240101000001_create_franchises_table.cjs
│   │   ├── 20240101000002_create_users_table.cjs
│   │   ├── 20240101000003_create_rate_master_table.cjs
│   │   ├── ... (25 migration files total)
│   │   └── 20240101000025_add_invoice_id_to_bookings.cjs
│   ├── seeds/
│   │   └─ (Optional seed files)
│   ├── check_all_tables.cjs
│   │   └─ Verification script
│   └── package.json
│       └─ Contains npm scripts for migrations
│
└── .env
    └─ Database configuration
```

---

## 📖 File Details

### 1. QUICK_DATABASE_SETUP.md
**Purpose**: Fast 5-minute setup  
**When to use**: You need to get started immediately  
**Contains**:
- Two setup options (Migrations vs Direct SQL)
- Quick verification steps
- Common issues & fixes
- Command reference

**Time to complete**: 5-10 minutes  
**Difficulty**: Easy

---

### 2. SETUP_LOCAL_DATABASE.md
**Purpose**: Complete step-by-step setup guide  
**When to use**: First-time setup or need help troubleshooting  
**Contains**:
- Prerequisites
- Step-by-step instructions
- Environment configuration
- Running migrations
- Database backup & restore
- Troubleshooting section
- MySQL user permissions
- Performance tips

**Time to complete**: 20-30 minutes  
**Difficulty**: Medium

---

### 3. DATABASE_SCHEMA.md
**Purpose**: Complete technical reference  
**When to use**: You need to understand table structures, relationships, and constraints  
**Contains**:
- All 13 table structures
- Column names and data types
- Constraints and relationships
- Indexes and best practices
- ER diagram representation
- Sample queries

**Time to complete**: Read as needed  
**Difficulty**: Advanced

---

### 4. DATABASE_SETUP_COMPLETE.md
**Purpose**: Overview and complete guide  
**When to use**: You want a comprehensive overview  
**Contains**:
- Quick start (3 steps)
- Documentation file guide
- Database architecture
- Table summary
- Data flow examples
- Checklist
- Next steps
- Maintenance tasks

**Time to complete**: 30 minutes to read fully  
**Difficulty**: Medium

---

### 5. database_schema.sql
**Purpose**: Raw SQL file for direct database setup  
**When to use**: You prefer direct SQL or as a backup method  
**Contains**:
- `CREATE DATABASE` statement
- All 13 `CREATE TABLE` statements
- Foreign keys and indexes
- Comments and documentation

**How to use**:
```bash
# Option 1: Direct command
mysql -u root -p < database_schema.sql

# Option 2: From MySQL client
SOURCE /path/to/database_schema.sql;

# Option 3: MySQL Workbench
File → Open SQL Script → Select file → Execute
```

**Time to complete**: 2-3 minutes  
**Difficulty**: Easy

---

### 6. backend/migrations/
**Purpose**: Knex.js migration files  
**When to use**: Using npm run migrate command  
**Contains**: 25 migration files for:
- Table creation
- Column additions/modifications
- Index creation
- Constraint additions

**Run with**: `npm run migrate`

**Time to complete**: Automatic  
**Difficulty**: Automatic (Knex handles it)

---

### 7. backend/knexfile.cjs
**Purpose**: Knex configuration file  
**When to use**: Configuring database connection settings  
**Contains**:
- Database client type (mysql2)
- Connection parameters
- Pool configuration
- Migration settings
- Seed directory

**Edit when**: Need to change DB host, port, or credentials

---

### 8. backend/check_all_tables.cjs
**Purpose**: Verification script  
**When to use**: Verify all tables were created successfully  
**Command**: `node backend/check_all_tables.cjs`

**Output**: Lists all tables and their record counts

---

## 🔄 Workflow by Scenario

### Scenario 1: First Time Setup
1. Read: **QUICK_DATABASE_SETUP.md** (first 2 minutes)
2. Do: Follow Option 1 (Migrations)
3. Verify: Run check_all_tables.cjs
4. Read: **DATABASE_SCHEMA.md** (for reference)

### Scenario 2: Production Deployment
1. Read: **SETUP_LOCAL_DATABASE.md** (especially troubleshooting)
2. Customize: `.env` with production credentials
3. Do: Run migrations with proper backups
4. Monitor: Database health checks
5. Backup: Regular mysqldump backups

### Scenario 3: Understanding the System
1. Read: **DATABASE_SETUP_COMPLETE.md** (overview)
2. Review: **DATABASE_SCHEMA.md** (detailed reference)
3. Check: ER diagram in DATABASE_SCHEMA.md
4. Reference: backend/migrations for implementation details

### Scenario 4: Troubleshooting
1. Check: **SETUP_LOCAL_DATABASE.md** → Troubleshooting section
2. Run: `node backend/check_all_tables.cjs`
3. Run: `npx knex migrate:status`
4. Check: MySQL connection with test command

---

## 📊 Database Tables (Quick Reference)

**13 Main Tables:**
1. franchises - Company master data
2. users - Employee accounts  
3. bookings - Shipment records
4. invoices - Billing documents
5. invoice_items - Invoice line items
6. payments - Payment records
7. tracking - Shipment tracking
8. expenses - Operational expenses
9. rate_master - Shipping rates
10. company_rate_master - Company rates
11. courier_company_rates - Courier rates
12. stationary - Inventory items
13. franchise_sectors - Service sectors

**2 System Tables** (created by Knex):
- knex_migrations
- knex_migrations_lock

---

## 🚀 Quick Commands

```bash
# Setup
npm install                          # Install dependencies
npm run migrate                      # Run migrations
node check_all_tables.cjs           # Verify setup

# Development
npm run dev                          # Start development server

# Migrations
npx knex migrate:status             # Check migration status
npx knex migrate:rollback           # Undo last migration
npx knex migrate:make <name>        # Create new migration

# Database
mysql -u admin -p easygo_db         # Connect to database
mysqldump -u admin -p easygo_db > backup.sql  # Backup

# Verification
mysql -u admin -p easygo_db -e "SHOW TABLES;"  # List tables
mysql -u admin -p easygo_db -e "SELECT * FROM franchises;"  # View data
```

---

## 📋 Checklist for Complete Setup

- [ ] Read appropriate setup guide (QUICK or DETAILED)
- [ ] Create database: `CREATE DATABASE easygo_db;`
- [ ] Update `.env` with credentials
- [ ] Run: `npm install` (backend)
- [ ] Run: `npm run migrate`
- [ ] Verify: `node check_all_tables.cjs`
- [ ] Run: `npm run dev` (backend)
- [ ] Run: `npm run dev` (frontend in new terminal)
- [ ] Access: http://localhost:3000
- [ ] Create test user and franchise
- [ ] Test full workflow (booking → invoice → payment)

---

## 🎓 Learning Path

If you're new to this project:

1. **Start**: QUICK_DATABASE_SETUP.md (overview)
2. **Understand**: DATABASE_SCHEMA.md (table structures)
3. **Deep Dive**: SETUP_LOCAL_DATABASE.md (complete details)
4. **Reference**: DATABASE_SETUP_COMPLETE.md (as needed)
5. **Explore**: backend/migrations/ (implementation)

---

## 📞 File Selection Matrix

| Task | File | Time |
|------|------|------|
| Quick setup | QUICK_DATABASE_SETUP.md | 5 min |
| First-time setup | SETUP_LOCAL_DATABASE.md | 20 min |
| Understand schema | DATABASE_SCHEMA.md | 30 min |
| Overview | DATABASE_SETUP_COMPLETE.md | 15 min |
| Direct SQL setup | database_schema.sql | 2 min |
| Verify installation | check_all_tables.cjs | 1 min |
| Troubleshoot | SETUP_LOCAL_DATABASE.md → Troubleshooting | 10 min |

---

## 🔗 Relationship Map

```
DATABASE_FILES_INDEX (START HERE)
├─→ QUICK_DATABASE_SETUP (Get started fast)
│   └─→ SETUP_LOCAL_DATABASE (Need help?)
│       └─→ Troubleshooting section
│
├─→ DATABASE_SCHEMA (Understand tables)
│   └─→ backend/migrations/ (See implementations)
│
├─→ DATABASE_SETUP_COMPLETE (Complete overview)
│   └─→ Checklist & Next steps
│
└─→ database_schema.sql (Alternative setup)
    └─→ Use with: mysql -u root -p < file.sql
```

---

## ✅ Success Indicators

Your setup is complete when:
- ✅ All 13 tables are created
- ✅ Foreign key relationships work
- ✅ Migrations show as completed
- ✅ Backend server runs without DB errors
- ✅ Frontend loads at http://localhost:3000
- ✅ Can create test data

---

## 🆘 Quick Help

**Stuck?**
1. Run: `node backend/check_all_tables.cjs`
2. Check: `.env` credentials
3. Review: SETUP_LOCAL_DATABASE.md → Troubleshooting
4. Run: `npx knex migrate:status`

**Want to reset?**
```bash
npx knex migrate:rollback --all
npm run migrate  # Re-run migrations
```

---

## 📝 Version Info

- **Created**: November 2024
- **Database Version**: MySQL 5.7+
- **Node Version**: 16+
- **Status**: Production Ready

---

**Start with**: QUICK_DATABASE_SETUP.md or SETUP_LOCAL_DATABASE.md

