-- ============================================
-- EasyGo Database Schema - CURRENT (After All Migrations)
-- ============================================
-- Database: frbilling (or easygo_db based on .env)
-- MySQL Version: 5.7+
-- Generated: 2025-11-08
-- Based on: 25 Knex migrations
-- ============================================

-- ============================================
-- CREATE DATABASE
-- ============================================
CREATE DATABASE IF NOT EXISTS frbilling CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE frbilling;

-- ============================================
-- 1. FRANCHISES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS franchises (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  franchise_code VARCHAR(50) NOT NULL UNIQUE,
  franchise_name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  whatsapp VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  gst_number VARCHAR(50),
  subscription_start_date DATE,
  subscription_end_date DATE,
  subscription_status ENUM('active', 'expired', 'trial') DEFAULT 'trial',
  subscription_days_remaining INT DEFAULT 0,
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  invoice_format VARCHAR(100),
  invoice_details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_franchise_code (franchise_code),
  INDEX idx_email (email),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  franchise_id INT UNSIGNED NOT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('admin', 'franchisee', 'staff', 'cashier') DEFAULT 'staff',
  status ENUM('active', 'inactive') DEFAULT 'active',
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (franchise_id) REFERENCES franchises(id) ON DELETE CASCADE,
  INDEX idx_franchise_id (franchise_id),
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. RATE MASTER TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS rate_master (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  franchise_id INT UNSIGNED NOT NULL,
  from_pincode VARCHAR(10) NOT NULL,
  to_pincode VARCHAR(10) NOT NULL,
  service_type VARCHAR(50) NOT NULL,
  weight_from DECIMAL(10, 2) NOT NULL,
  weight_to DECIMAL(10, 2) NOT NULL,
  rate DECIMAL(10, 2) NOT NULL,
  fuel_surcharge DECIMAL(5, 2) DEFAULT 0,
  gst_percentage DECIMAL(5, 2) DEFAULT 18,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (franchise_id) REFERENCES franchises(id) ON DELETE CASCADE,
  INDEX idx_franchise_pincodes (franchise_id, from_pincode, to_pincode),
  INDEX idx_service_type (service_type),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. STATIONARY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stationary (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  franchise_id INT UNSIGNED NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  item_code VARCHAR(50) NOT NULL,
  description TEXT,
  quantity INT DEFAULT 0,
  unit_price DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50) DEFAULT 'piece',
  minimum_stock INT DEFAULT 10,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (franchise_id) REFERENCES franchises(id) ON DELETE CASCADE,
  UNIQUE KEY uk_franchise_item_code (franchise_id, item_code),
  INDEX idx_franchise_id (franchise_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. BOOKINGS TABLE (CURRENT STRUCTURE AFTER ALL MIGRATIONS)
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT UNSIGNED,
  franchise_id INT UNSIGNED NOT NULL,
  booking_date DATE NOT NULL,
  customer_id VARCHAR(50),
  receiver VARCHAR(255),
  address TEXT,
  pincode VARCHAR(10),
  consignment_type ENUM('Domestic', 'International') DEFAULT 'Domestic',
  mode VARCHAR(50) DEFAULT 'AR',
  act_wt DECIMAL(10, 2),
  char_wt DECIMAL(10, 2),
  qty INT,
  type VARCHAR(10) DEFAULT 'D',
  amount DECIMAL(10, 2),
  other_charges DECIMAL(10, 2) DEFAULT 0,
  reference VARCHAR(255),
  dtdc_amt DECIMAL(10, 2) DEFAULT 0,
  insurance DECIMAL(10, 2) DEFAULT 0,
  percentage DECIMAL(10, 2) DEFAULT 0,
  risk_surcharge DECIMAL(10, 2) DEFAULT 0,
  bill_amount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) DEFAULT 0,
  destination VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Booked',
  remarks TEXT,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  fuel_amount DECIMAL(10, 2) DEFAULT 0,
  gst_percent DECIMAL(5, 2) DEFAULT 18,
  fuel_percent DECIMAL(5, 2) DEFAULT 0,
  from_pincode VARCHAR(10),
  to_pincode VARCHAR(10),
  rate DECIMAL(10, 2),
  rate_master_id INT UNSIGNED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (franchise_id) REFERENCES franchises(id) ON DELETE CASCADE,
  INDEX idx_franchise_date (franchise_id, booking_date),
  INDEX idx_customer_id (customer_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. INVOICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  franchise_id INT UNSIGNED NOT NULL,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id VARCHAR(100),
  consignment_no VARCHAR(50),
  invoice_date DATE NOT NULL,
  due_date DATE,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255),
  customer_address TEXT,
  customer_gst VARCHAR(50),
  subtotal DECIMAL(10, 2) NOT NULL,
  gst_amount DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  balance_amount DECIMAL(10, 2) NOT NULL,
  payment_status ENUM('paid', 'unpaid', 'partial', 'overdue') DEFAULT 'unpaid',
  status ENUM('draft', 'sent', 'paid', 'cancelled') DEFAULT 'draft',
  gst_percent DECIMAL(5, 2) DEFAULT 18,
  notes TEXT,
  terms_conditions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (franchise_id) REFERENCES franchises(id) ON DELETE CASCADE,
  UNIQUE KEY uk_invoice_number (invoice_number),
  INDEX idx_franchise_date (franchise_id, invoice_date),
  INDEX idx_payment_status (payment_status),
  INDEX idx_status (status),
  INDEX idx_customer_id (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. INVOICE ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT UNSIGNED NOT NULL,
  booking_id INT UNSIGNED,
  description VARCHAR(500) NOT NULL,
  quantity INT DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  gst_percentage DECIMAL(5, 2) DEFAULT 18,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
  INDEX idx_invoice_id (invoice_id),
  INDEX idx_booking_id (booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  franchise_id INT UNSIGNED NOT NULL,
  invoice_id INT UNSIGNED,
  booking_id INT UNSIGNED,
  payment_number VARCHAR(50) NOT NULL UNIQUE,
  payment_date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_mode ENUM('cash', 'online', 'card', 'upi', 'bank_transfer', 'cheque') NOT NULL,
  transaction_id VARCHAR(100),
  cheque_number VARCHAR(50),
  cheque_date DATE,
  bank_name VARCHAR(100),
  remarks TEXT,
  status ENUM('completed', 'pending', 'failed', 'refunded') DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (franchise_id) REFERENCES franchises(id) ON DELETE CASCADE,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
  UNIQUE KEY uk_payment_number (payment_number),
  INDEX idx_franchise_date (franchise_id, payment_date),
  INDEX idx_payment_mode (payment_mode),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. TRACKING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tracking (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id INT UNSIGNED NOT NULL,
  consignment_number VARCHAR(50) NOT NULL,
  status VARCHAR(100) NOT NULL,
  location TEXT,
  remarks TEXT,
  status_date TIMESTAMP NOT NULL,
  updated_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  INDEX idx_booking_date (booking_id, status_date),
  INDEX idx_consignment_number (consignment_number),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 10. EXPENSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  franchise_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  expense_date DATE NOT NULL,
  category VARCHAR(100) NOT NULL,
  description VARCHAR(500) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_mode ENUM('cash', 'online', 'card', 'bank_transfer') DEFAULT 'cash',
  bill_number VARCHAR(50),
  vendor_name VARCHAR(255),
  remarks TEXT,
  status ENUM('approved', 'pending', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (franchise_id) REFERENCES franchises(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_franchise_date (franchise_id, expense_date),
  INDEX idx_category (category),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 11. FRANCHISE SECTORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS franchise_sectors (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  franchise_id INT UNSIGNED NOT NULL,
  sector_name VARCHAR(100) NOT NULL,
  pincodes TEXT NOT NULL,
  dox BOOLEAN DEFAULT FALSE,
  nondox_air BOOLEAN DEFAULT FALSE,
  nondox_sur BOOLEAN DEFAULT FALSE,
  express_cargo BOOLEAN DEFAULT FALSE,
  priority BOOLEAN DEFAULT FALSE,
  ecom_priority BOOLEAN DEFAULT FALSE,
  ecom_ge BOOLEAN DEFAULT FALSE,
  priority_sequence INT UNSIGNED DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (franchise_id) REFERENCES franchises(id) ON DELETE CASCADE,
  INDEX idx_franchise_id (franchise_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 12. COMPANY RATE MASTER TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS company_rate_master (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  franchise_id INT UNSIGNED NOT NULL,
  company_id VARCHAR(50) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  company_address TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
  dox_rk DECIMAL(10, 2) DEFAULT 0,
  minimum_rate_surcharge DECIMAL(10, 2) DEFAULT 0,
  fuel_surcharge DECIMAL(10, 2) DEFAULT 0,
  obs_fuel_surcharge DECIMAL(10, 2) DEFAULT 0,
  royalty_charges DECIMAL(10, 2) DEFAULT 0,
  eco_bl DECIMAL(10, 2) DEFAULT 0,
  dox_roce DECIMAL(10, 2) DEFAULT 0,
  name_average DECIMAL(10, 2) DEFAULT 0,
  other_remark TEXT,
  field_u VARCHAR(100),
  field_v VARCHAR(100),
  field_w VARCHAR(100),
  field_h VARCHAR(100),
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (franchise_id) REFERENCES franchises(id) ON DELETE CASCADE,
  INDEX idx_franchise_status (franchise_id, status),
  INDEX idx_company_id (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 13. COURIER COMPANY RATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS courier_company_rates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  franchise_id INT UNSIGNED NOT NULL,
  company_id INT UNSIGNED NOT NULL,
  courier_type VARCHAR(50) NOT NULL,
  row_name VARCHAR(100) NOT NULL,
  sub_type VARCHAR(50),
  slab_type ENUM('Slab 2', 'Slab 3', 'Slab 4') NOT NULL,
  rates JSON NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (franchise_id) REFERENCES franchises(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES company_rate_master(id) ON DELETE CASCADE,
  INDEX idx_franchise_company_type (franchise_id, company_id, courier_type),
  INDEX idx_courier_row (courier_type, row_name),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 14. KNEX MIGRATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS knex_migrations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  batch INT,
  migration_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS knex_migrations_lock (
  index INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  is_locked INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SUMMARY OF TABLES
-- ============================================
-- Total Tables: 15
-- 1. franchises - Franchise/Branch information
-- 2. users - Users for each franchise
-- 3. rate_master - Shipping rates by pincode and service
-- 4. stationary - Office supplies inventory
-- 5. bookings - Consignments/Bookings (MAJOR FIELDS FROM MIGRATION 17, 24, 25)
-- 6. invoices - Generated invoices
-- 7. invoice_items - Line items in invoices
-- 8. payments - Payment records
-- 9. tracking - Consignment tracking history
-- 10. expenses - Expense records
-- 11. franchise_sectors - Service areas/sectors
-- 12. company_rate_master - Company/Courier rates
-- 13. courier_company_rates - Detailed courier rates by slab
-- 14. knex_migrations - Migration tracking
-- 15. knex_migrations_lock - Migration lock

-- ============================================
-- KEY RELATIONSHIPS
-- ============================================
-- franchises (1) → (N) users
-- franchises (1) → (N) bookings
-- franchises (1) → (N) invoices
-- franchises (1) → (N) payments
-- franchises (1) → (N) expenses
-- franchises (1) → (N) rate_master
-- franchises (1) → (N) stationary
-- franchises (1) → (N) franchise_sectors
-- franchises (1) → (N) company_rate_master
-- bookings (1) → (N) invoice_items
-- bookings (1) → (1) invoices [via invoice_id]
-- bookings (1) → (N) payments [via booking_id]
-- bookings (1) → (N) tracking [via booking_id]
-- invoices (1) → (N) invoice_items
-- invoices (1) → (N) payments
-- users (1) → (N) expenses

-- ============================================
-- IMPORTANT NOTES
-- ============================================
-- 1. Bookings table has been significantly restructured through migrations
-- 2. Migration 17 completely changed the bookings structure
-- 3. Migration 24 added calculation fields (tax_amount, fuel_amount, etc.)
-- 4. Migration 25 added invoice_id foreign key for linking
-- 5. All tables use InnoDB with proper foreign keys
-- 6. All tables have created_at and updated_at timestamps
-- 7. All numeric fields use DECIMAL for precision
-- 8. Character sets are utf8mb4 for international support

-- ============================================
-- SCHEMA GENERATION DATE
-- ============================================
-- Generated: 2025-11-08
-- Based on migrations 1-25 in knex migrations
-- This schema represents the ACTUAL database structure after all migrations are applied
-- For deployment, run: npm run migrate to apply all migrations
-- ============================================
