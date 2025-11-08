-- ============================================
-- EasyGo Database Schema - SQL Version
-- ============================================
-- Database: easygo_db
-- MySQL Version: 5.7+
-- ============================================

-- Create Database
CREATE DATABASE IF NOT EXISTS easygo_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE easygo_db;

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
-- 5. BOOKINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT UNSIGNED,
  franchise_id INT UNSIGNED NOT NULL,
  booking_number VARCHAR(50) NOT NULL UNIQUE,
  consignment_number VARCHAR(50) NOT NULL UNIQUE,
  booking_date DATE NOT NULL,
  
  -- Sender Details
  sender_name VARCHAR(255) NOT NULL,
  sender_phone VARCHAR(20) NOT NULL,
  sender_address TEXT,
  sender_pincode VARCHAR(10) NOT NULL,
  sender_city VARCHAR(100),
  sender_state VARCHAR(100),
  
  -- Receiver Details
  receiver_name VARCHAR(255) NOT NULL,
  receiver_phone VARCHAR(20) NOT NULL,
  receiver_address TEXT,
  receiver_pincode VARCHAR(10) NOT NULL,
  receiver_city VARCHAR(100),
  receiver_state VARCHAR(100),
  
  -- Package Details
  service_type VARCHAR(50) NOT NULL,
  weight DECIMAL(10, 2) NOT NULL,
  pieces INT DEFAULT 1,
  content_description TEXT,
  declared_value DECIMAL(10, 2) DEFAULT 0,
  
  -- Billing Details
  amount DECIMAL(10, 2),
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  fuel_amount DECIMAL(10, 2) DEFAULT 0,
  other_charges DECIMAL(10, 2) DEFAULT 0,
  freight_charge DECIMAL(10, 2) NOT NULL,
  fuel_surcharge DECIMAL(10, 2) DEFAULT 0,
  gst_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  
  -- Calculation References
  from_pincode VARCHAR(10),
  to_pincode VARCHAR(10),
  rate DECIMAL(10, 2),
  rate_master_id INT UNSIGNED,
  gst_percent DECIMAL(5, 2) DEFAULT 18,
  fuel_percent DECIMAL(5, 2) DEFAULT 0,
  
  -- Payment Details
  payment_mode ENUM('cash', 'online', 'card', 'to_pay') DEFAULT 'cash',
  payment_status ENUM('paid', 'unpaid', 'partial') DEFAULT 'unpaid',
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  
  -- Status
  status ENUM('booked', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled') DEFAULT 'booked',
  remarks TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (franchise_id) REFERENCES franchises(id) ON DELETE CASCADE,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
  UNIQUE KEY uk_booking_number (booking_number),
  UNIQUE KEY uk_consignment_number (consignment_number),
  INDEX idx_franchise_date (franchise_id, booking_date),
  INDEX idx_consignment_number (consignment_number),
  INDEX idx_status (status),
  INDEX idx_payment_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. INVOICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  franchise_id INT UNSIGNED NOT NULL,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  invoice_date DATE NOT NULL,
  due_date DATE,
  
  -- Customer Details
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255),
  customer_address TEXT,
  customer_gst VARCHAR(50),
  
  -- Amounts
  subtotal DECIMAL(10, 2) NOT NULL,
  gst_amount DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  balance_amount DECIMAL(10, 2) NOT NULL,
  
  -- Status
  payment_status ENUM('paid', 'unpaid', 'partial', 'overdue') DEFAULT 'unpaid',
  status ENUM('draft', 'sent', 'paid', 'cancelled') DEFAULT 'draft',
  
  -- Additional
  notes TEXT,
  terms_conditions TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (franchise_id) REFERENCES franchises(id) ON DELETE CASCADE,
  UNIQUE KEY uk_invoice_number (invoice_number),
  INDEX idx_franchise_date (franchise_id, invoice_date),
  INDEX idx_payment_status (payment_status),
  INDEX idx_status (status)
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
  
  -- Payment Mode
  payment_mode ENUM('cash', 'online', 'card', 'upi', 'bank_transfer', 'cheque') NOT NULL,
  
  -- Transaction Details
  transaction_id VARCHAR(100),
  cheque_number VARCHAR(50),
  cheque_date DATE,
  bank_name VARCHAR(100),
  remarks TEXT,
  
  -- Status
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
  
  -- Payment
  payment_mode ENUM('cash', 'online', 'card', 'bank_transfer') DEFAULT 'cash',
  bill_number VARCHAR(50),
  vendor_name VARCHAR(255),
  remarks TEXT,
  
  -- Status
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
  
  -- Rates
  rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
  dox_rk DECIMAL(10, 2) DEFAULT 0,
  minimum_rate_surcharge DECIMAL(10, 2) DEFAULT 0,
  fuel_surcharge DECIMAL(10, 2) DEFAULT 0,
  obs_fuel_surcharge DECIMAL(10, 2) DEFAULT 0,
  royalty_charges DECIMAL(10, 2) DEFAULT 0,
  eco_bl DECIMAL(10, 2) DEFAULT 0,
  dox_roce DECIMAL(10, 2) DEFAULT 0,
  name_average DECIMAL(10, 2) DEFAULT 0,
  
  -- Additional
  other_remark TEXT,
  field_u VARCHAR(100),
  field_v VARCHAR(100),
  field_w VARCHAR(100),
  field_h VARCHAR(100),
  
  -- Status
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
-- 14. KNEX MIGRATIONS TABLE (for Knex.js)
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
-- Verify Database Creation
-- ============================================

-- Show all created tables
SHOW TABLES;

-- Show table structures (uncomment to view)
-- DESCRIBE franchises;
-- DESCRIBE users;
-- DESCRIBE bookings;
-- DESCRIBE invoices;
-- ... and so on for other tables

-- ============================================
-- Database Created Successfully!
-- ============================================
-- All tables have been created with proper:
-- - Foreign key relationships
-- - Indexes for performance
-- - ENUM constraints for data validation
-- - Timestamp fields for audit trail
-- - UTF8MB4 charset for international characters
-- ============================================
