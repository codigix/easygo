-- ============================================================
-- AWS DATABASE DIAGNOSTIC SCRIPT
-- Run this on your AWS MySQL database to verify schema
-- Database: frbilling
-- ============================================================

-- Step 1: Check Bookings Table Structure
PRINT '======================================================';
PRINT 'STEP 1: BOOKINGS TABLE STRUCTURE';
PRINT '======================================================';

DESCRIBE bookings;

-- Step 2: Check Rate Master Table Structure
PRINT '======================================================';
PRINT 'STEP 2: RATE MASTER TABLE STRUCTURE';
PRINT '======================================================';

DESCRIBE rate_master;

-- Step 3: Check Invoices Table Structure
PRINT '======================================================';
PRINT 'STEP 3: INVOICES TABLE STRUCTURE';
PRINT '======================================================';

DESCRIBE invoices;

-- Step 4: Count Records
PRINT '======================================================';
PRINT 'STEP 4: RECORD COUNTS';
PRINT '======================================================';

SELECT 
  'bookings' as table_name,
  COUNT(*) as record_count
FROM bookings
UNION ALL
SELECT 
  'rate_master',
  COUNT(*)
FROM rate_master
UNION ALL
SELECT 
  'invoices',
  COUNT(*)
FROM invoices;

-- Step 5: Sample Booking Data
PRINT '======================================================';
PRINT 'STEP 5: SAMPLE BOOKING DATA (Last 3 records)';
PRINT '======================================================';

SELECT * FROM bookings 
ORDER BY id DESC 
LIMIT 3;

-- Step 6: Sample Rate Master Data
PRINT '======================================================';
PRINT 'STEP 6: SAMPLE RATE MASTER DATA';
PRINT '======================================================';

SELECT * FROM rate_master 
LIMIT 5;

-- Step 7: Show All Column Names for Bookings
PRINT '======================================================';
PRINT 'STEP 7: ALL BOOKINGS COLUMNS';
PRINT '======================================================';

SELECT 
  COLUMN_NAME,
  DATA_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT,
  COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'bookings' 
  AND TABLE_SCHEMA = 'frbilling'
ORDER BY ORDINAL_POSITION;

-- Step 8: Show All Column Names for Rate Master
PRINT '======================================================';
PRINT 'STEP 8: ALL RATE MASTER COLUMNS';
PRINT '======================================================';

SELECT 
  COLUMN_NAME,
  DATA_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT,
  COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'rate_master' 
  AND TABLE_SCHEMA = 'frbilling'
ORDER BY ORDINAL_POSITION;

-- Step 9: Check for Status Values in Bookings
PRINT '======================================================';
PRINT 'STEP 9: BOOKING STATUS VALUES (DISTINCT)';
PRINT '======================================================';

SELECT DISTINCT status 
FROM bookings;

-- Step 10: Check for Invoice Status Values
PRINT '======================================================';
PRINT 'STEP 10: INVOICE STATUS VALUES (DISTINCT)';
PRINT '======================================================';

SELECT DISTINCT payment_status 
FROM invoices;

-- Step 11: Check Rate Master Service Types
PRINT '======================================================';
PRINT 'STEP 11: RATE MASTER SERVICE TYPES';
PRINT '======================================================';

SELECT DISTINCT service_type, COUNT(*) as count
FROM rate_master
GROUP BY service_type;

-- Step 12: Sample Booking with All Fields
PRINT '======================================================';
PRINT 'STEP 12: DETAILED BOOKING SAMPLE';
PRINT '======================================================';

SELECT 
  id,
  franchise_id,
  consignment_number,
  booking_date,
  service_type,
  weight,
  pieces,
  freight_charge,
  gst_amount,
  fuel_surcharge,
  other_charges,
  total_amount,
  status,
  payment_status,
  created_at
FROM bookings 
WHERE id = (SELECT MAX(id) FROM bookings)
LIMIT 1;

-- Step 13: Check if Fields Used in Controller Exist
PRINT '======================================================';
PRINT 'STEP 13: CONTROLLER FIELD CHECK';
PRINT '======================================================';
PRINT 'Checking if bookings table has these fields:';
PRINT '  - customer_id';
PRINT '  - receiver (just receiver, not receiver_name)';
PRINT '  - address (just address, not receiver_address)';
PRINT '  - pincode (just pincode, not receiver_pincode)';
PRINT '  - mode';
PRINT '  - char_wt';
PRINT '  - qty';
PRINT '  - type';
PRINT '  - amount';
PRINT '  - tax_amount';
PRINT '  - fuel_amount';
PRINT '  - invoice_id';
PRINT '';

-- This will show which fields actually exist
SELECT 
  COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'bookings' 
  AND TABLE_SCHEMA = 'frbilling'
  AND COLUMN_NAME IN (
    'customer_id', 'receiver', 'address', 'pincode', 'mode', 
    'char_wt', 'qty', 'type', 'amount', 'tax_amount', 
    'fuel_amount', 'invoice_id'
  );

-- Step 14: Check Data Type Compatibility
PRINT '======================================================';
PRINT 'STEP 14: CRITICAL FIELD DATA TYPES';
PRINT '======================================================';

SELECT 
  COLUMN_NAME,
  DATA_TYPE,
  NUMERIC_PRECISION,
  NUMERIC_SCALE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'bookings' 
  AND TABLE_SCHEMA = 'frbilling'
  AND COLUMN_NAME IN (
    'freight_charge', 'gst_amount', 'fuel_surcharge', 
    'other_charges', 'total_amount', 'weight', 'pieces'
  );

-- Step 15: Foreign Key Check
PRINT '======================================================';
PRINT 'STEP 15: FOREIGN KEY RELATIONSHIPS';
PRINT '======================================================';

SELECT 
  CONSTRAINT_NAME,
  TABLE_NAME,
  COLUMN_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_NAME IN ('bookings', 'rate_master', 'invoices')
  AND TABLE_SCHEMA = 'frbilling'
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- ============================================================
-- INSTRUCTIONS FOR OUTPUT
-- ============================================================
-- Copy the OUTPUT from above and share with support
-- This will show:
-- 1. Exact table structure
-- 2. All field names
-- 3. Data types
-- 4. Current data samples
-- 5. Whether controller field names exist in tables
-- 6. Any schema mismatches
-- ============================================================