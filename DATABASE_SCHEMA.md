# EasyGo Database Schema Documentation

## Database Overview
- **Database Name**: `easygo_db`
- **Database Type**: MySQL/MariaDB
- **Charset**: UTF8MB4
- **Collation**: utf8mb4_unicode_ci

---

## Table Structure

### 1. **franchises**
Master table for franchise/company information
```
- id (INT) - Primary Key, Auto Increment
- franchise_code (VARCHAR 50) - Unique franchise identifier
- franchise_name (VARCHAR 255) - Name of franchise
- owner_name (VARCHAR 255) - Owner name
- email (VARCHAR 255) - Email (Unique)
- phone (VARCHAR 20) - Contact number
- whatsapp (VARCHAR 20) - WhatsApp number
- address (TEXT) - Physical address
- city (VARCHAR 100) - City
- state (VARCHAR 100) - State
- pincode (VARCHAR 10) - Postal code
- gst_number (VARCHAR 50) - GST number
- subscription_start_date (DATE)
- subscription_end_date (DATE)
- subscription_status (ENUM: 'active', 'expired', 'trial') - Default: 'trial'
- subscription_days_remaining (INT)
- status (ENUM: 'active', 'inactive', 'suspended') - Default: 'active'
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Indexes:
- franchise_code (UNIQUE)
- email (UNIQUE)
```

---

### 2. **users**
User authentication and management
```
- id (INT) - Primary Key
- franchise_id (INT) - Foreign Key to franchises
- username (VARCHAR 100) - Unique username
- email (VARCHAR 255) - Unique email
- password (VARCHAR 255) - Hashed password
- full_name (VARCHAR 255) - Full name
- phone (VARCHAR 20) - Contact number
- role (ENUM: 'admin', 'franchisee', 'staff', 'cashier') - Default: 'staff'
- status (ENUM: 'active', 'inactive') - Default: 'active'
- last_login (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Indexes:
- franchise_id (FK)
- username (UNIQUE)
- email (UNIQUE)
```

---

### 3. **rate_master**
Base shipping rates for different routes and service types
```
- id (INT) - Primary Key
- franchise_id (INT) - Foreign Key to franchises
- from_pincode (VARCHAR 10) - Source pincode
- to_pincode (VARCHAR 10) - Destination pincode
- service_type (VARCHAR 50) - 'Surface', 'Air', 'Express'
- weight_from (DECIMAL 10,2) - Weight range from (kg)
- weight_to (DECIMAL 10,2) - Weight range to (kg)
- rate (DECIMAL 10,2) - Base rate
- fuel_surcharge (DECIMAL 5,2) - Fuel surcharge %
- gst_percentage (DECIMAL 5,2) - GST percentage (Default: 18)
- status (ENUM: 'active', 'inactive') - Default: 'active'
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Indexes:
- franchise_id, from_pincode, to_pincode (Combined)
- status
```

---

### 4. **stationary**
Inventory management for stationery items
```
- id (INT) - Primary Key
- franchise_id (INT) - Foreign Key to franchises
- item_name (VARCHAR 255) - Item name
- item_code (VARCHAR 50) - Unique item code
- description (TEXT) - Item description
- quantity (INT) - Current quantity in stock
- unit_price (DECIMAL 10,2) - Price per unit
- unit (VARCHAR 50) - Unit of measurement (Default: 'piece')
- minimum_stock (INT) - Minimum stock level (Default: 10)
- status (ENUM: 'active', 'inactive') - Default: 'active'
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Indexes:
- franchise_id
- Unique: (franchise_id, item_code)
```

---

### 5. **bookings**
Shipment/consignment booking records
```
- id (INT) - Primary Key
- invoice_id (INT) - Foreign Key to invoices (nullable)
- franchise_id (INT) - Foreign Key to franchises
- booking_number (VARCHAR 50) - Unique booking number
- consignment_number (VARCHAR 50) - Unique consignment number
- booking_date (DATE)

SENDER DETAILS:
- sender_name (VARCHAR 255)
- sender_phone (VARCHAR 20)
- sender_address (TEXT)
- sender_pincode (VARCHAR 10)
- sender_city (VARCHAR 100)
- sender_state (VARCHAR 100)

RECEIVER DETAILS:
- receiver_name (VARCHAR 255)
- receiver_phone (VARCHAR 20)
- receiver_address (TEXT)
- receiver_pincode (VARCHAR 10)
- receiver_city (VARCHAR 100)
- receiver_state (VARCHAR 100)

PACKAGE DETAILS:
- service_type (VARCHAR 50) - 'Surface', 'Air', 'Express'
- weight (DECIMAL 10,2) - Weight in kg
- pieces (INT) - Number of pieces
- content_description (TEXT)
- declared_value (DECIMAL 10,2)

BILLING DETAILS:
- amount (DECIMAL 10,2) - Base freight charge
- tax_amount (DECIMAL 10,2) - GST amount
- fuel_amount (DECIMAL 10,2) - Fuel surcharge
- other_charges (DECIMAL 10,2) - Additional charges
- freight_charge (DECIMAL 10,2) - Original freight
- fuel_surcharge (DECIMAL 10,2) - Original fuel surcharge
- gst_amount (DECIMAL 10,2) - Original GST
- total_amount (DECIMAL 10,2)

CALCULATION REFERENCES:
- from_pincode (VARCHAR 10) - Source pincode used
- to_pincode (VARCHAR 10) - Destination pincode used
- rate (DECIMAL 10,2) - Rate applied
- rate_master_id (INT) - Reference to rate_master
- gst_percent (DECIMAL 5,2) - GST % used
- fuel_percent (DECIMAL 5,2) - Fuel % used

PAYMENT DETAILS:
- payment_mode (ENUM: 'cash', 'online', 'card', 'to_pay') - Default: 'cash'
- payment_status (ENUM: 'paid', 'unpaid', 'partial') - Default: 'unpaid'
- paid_amount (DECIMAL 10,2)

STATUS:
- status (ENUM: 'booked', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled') - Default: 'booked'
- remarks (TEXT)

TIMESTAMPS:
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Indexes:
- booking_number (UNIQUE)
- consignment_number (UNIQUE)
- franchise_id, booking_date (Combined)
```

---

### 6. **invoices**
Invoice records for billing
```
- id (INT) - Primary Key
- franchise_id (INT) - Foreign Key to franchises
- invoice_number (VARCHAR 50) - Unique invoice number
- invoice_date (DATE)
- due_date (DATE)

CUSTOMER DETAILS:
- customer_name (VARCHAR 255)
- customer_phone (VARCHAR 20)
- customer_email (VARCHAR 255)
- customer_address (TEXT)
- customer_gst (VARCHAR 50) - Customer GST number

AMOUNTS:
- subtotal (DECIMAL 10,2)
- gst_amount (DECIMAL 10,2)
- discount (DECIMAL 10,2)
- total_amount (DECIMAL 10,2)
- paid_amount (DECIMAL 10,2)
- balance_amount (DECIMAL 10,2)

STATUS:
- payment_status (ENUM: 'paid', 'unpaid', 'partial', 'overdue') - Default: 'unpaid'
- status (ENUM: 'draft', 'sent', 'paid', 'cancelled') - Default: 'draft'

ADDITIONAL:
- notes (TEXT)
- terms_conditions (TEXT)

TIMESTAMPS:
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Indexes:
- invoice_number (UNIQUE)
- franchise_id, invoice_date (Combined)
```

---

### 7. **invoice_items**
Line items for each invoice
```
- id (INT) - Primary Key
- invoice_id (INT) - Foreign Key to invoices
- booking_id (INT) - Foreign Key to bookings (nullable)
- description (VARCHAR 500) - Item description
- quantity (INT) - Quantity (Default: 1)
- unit_price (DECIMAL 10,2)
- gst_percentage (DECIMAL 5,2) - Default: 18
- amount (DECIMAL 10,2) - Total amount for this item
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Indexes:
- invoice_id (FK)
- booking_id (FK)
```

---

### 8. **payments**
Payment records against invoices and bookings
```
- id (INT) - Primary Key
- franchise_id (INT) - Foreign Key to franchises
- invoice_id (INT) - Foreign Key to invoices (nullable)
- booking_id (INT) - Foreign Key to bookings (nullable)
- payment_number (VARCHAR 50) - Unique
- payment_date (DATE)
- amount (DECIMAL 10,2)

PAYMENT MODE:
- payment_mode (ENUM: 'cash', 'online', 'card', 'upi', 'bank_transfer', 'cheque')

TRANSACTION DETAILS:
- transaction_id (VARCHAR 100) - For online payments
- cheque_number (VARCHAR 50)
- cheque_date (DATE)
- bank_name (VARCHAR 100)
- remarks (TEXT)

STATUS:
- status (ENUM: 'completed', 'pending', 'failed', 'refunded') - Default: 'completed'

TIMESTAMPS:
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Indexes:
- payment_number (UNIQUE)
- franchise_id, payment_date (Combined)
```

---

### 9. **tracking**
Shipment tracking updates
```
- id (INT) - Primary Key
- booking_id (INT) - Foreign Key to bookings
- consignment_number (VARCHAR 50)
- status (VARCHAR 100) - Current status
- location (TEXT) - Current location
- remarks (TEXT) - Additional remarks
- status_date (TIMESTAMP) - When status was updated
- updated_by (VARCHAR 100) - User who updated
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Indexes:
- booking_id (FK)
- consignment_number
- booking_id, status_date (Combined)
```

---

### 10. **expenses**
Expense tracking and management
```
- id (INT) - Primary Key
- franchise_id (INT) - Foreign Key to franchises
- user_id (INT) - Foreign Key to users
- expense_date (DATE)
- category (VARCHAR 100) - 'Fuel', 'Rent', 'Salary', 'Utilities', etc.
- description (VARCHAR 500)
- amount (DECIMAL 10,2)

PAYMENT:
- payment_mode (ENUM: 'cash', 'online', 'card', 'bank_transfer') - Default: 'cash'
- bill_number (VARCHAR 50)
- vendor_name (VARCHAR 255)
- remarks (TEXT)

STATUS:
- status (ENUM: 'approved', 'pending', 'rejected') - Default: 'pending'

TIMESTAMPS:
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Indexes:
- franchise_id, expense_date (Combined)
```

---

### 11. **franchise_sectors**
Sector/service configuration for franchises
```
- id (INT) - Primary Key
- franchise_id (INT) - Foreign Key to franchises
- sector_name (VARCHAR 100) - Sector name
- pincodes (TEXT) - Comma-separated pincodes served
- dox (BOOLEAN) - Dox service enabled (Default: false)
- nondox_air (BOOLEAN) - NonDox Air enabled
- nondox_sur (BOOLEAN) - NonDox Surface enabled
- express_cargo (BOOLEAN) - Express Cargo enabled
- priority (BOOLEAN) - Priority service enabled
- ecom_priority (BOOLEAN) - E-Commerce Priority enabled
- ecom_ge (BOOLEAN) - E-Commerce GE enabled
- priority_sequence (INT) - Sequence/priority (Default: 0)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Indexes:
- franchise_id (FK)
```

---

### 12. **company_rate_master**
Company-specific rates and charges
```
- id (INT) - Primary Key
- franchise_id (INT) - Foreign Key to franchises
- company_id (VARCHAR 50)
- company_name (VARCHAR 255)
- company_address (TEXT)
- phone (VARCHAR 20)
- email (VARCHAR 100)

RATES:
- rate (DECIMAL 10,2)
- dox_rk (DECIMAL 10,2)
- minimum_rate_surcharge (DECIMAL 10,2)
- fuel_surcharge (DECIMAL 10,2)
- obs_fuel_surcharge (DECIMAL 10,2)
- royalty_charges (DECIMAL 10,2)
- eco_bl (DECIMAL 10,2)
- dox_roce (DECIMAL 10,2)
- name_average (DECIMAL 10,2)

ADDITIONAL:
- other_remark (TEXT)
- field_u (VARCHAR 100)
- field_v (VARCHAR 100)
- field_w (VARCHAR 100)
- field_h (VARCHAR 100)

STATUS:
- status (ENUM: 'active', 'inactive') - Default: 'active'

TIMESTAMPS:
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Indexes:
- franchise_id, status (Combined)
- company_id
```

---

### 13. **courier_company_rates**
Courier-specific rates for different service types
```
- id (INT) - Primary Key
- franchise_id (INT) - Foreign Key to franchises
- company_id (INT) - Foreign Key to company_rate_master
- courier_type (VARCHAR 50) - 'Dox', 'NonDox', 'Dtdc PLUS', etc.
- row_name (VARCHAR 100) - 'Within City', 'Metro', 'Special Destination', etc.
- sub_type (VARCHAR 50) - For NonDox (air/surface), Dtdc PTP (ptp/ptp2)
- slab_type (ENUM: 'Slab 2', 'Slab 3', 'Slab 4')
- rates (JSON) - {"rate_1": "100", "rate_2": "150", "rate_3": "200"}
- status (ENUM: 'active', 'inactive') - Default: 'active'
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Indexes:
- franchise_id, company_id, courier_type (Combined)
- courier_type, row_name (Combined)
```

---

## Database Relationships

```
franchises (1) ──── (N) users
        ├───────────── (N) bookings
        ├───────────── (N) invoices
        ├───────────── (N) payments
        ├───────────── (N) expenses
        ├───────────── (N) rate_master
        ├───────────── (N) stationary
        ├───────────── (N) franchise_sectors
        ├───────────── (N) company_rate_master
        └───────────── (N) courier_company_rates

users ──────────────── (N) expenses

invoices ───────────── (N) invoice_items
       └───────────── (N) payments

bookings ───────────── (N) invoice_items
       ├───────────── (N) tracking
       └───────────── (N) payments

company_rate_master ─── (N) courier_company_rates
```

---

## Running Migrations

To set up the database with all tables, run:

```bash
# From the backend directory
cd backend

# Run all migrations
npm run migrate

# Or using knex directly
npx knex migrate:latest

# To rollback all migrations
npx knex migrate:rollback --all

# To create a new migration
npx knex migrate:make <migration_name>
```

---

## Database Configuration

Update `.env` file in the project root:
```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=admin
MYSQL_PASSWORD=yourpassword
MYSQL_DATABASE=easygo_db
```

---

## Key Features

1. **Multi-Franchise Support**: All data is isolated by franchise
2. **Comprehensive Booking Management**: Full shipment tracking with detailed charges
3. **Invoice Management**: Automated invoice generation and payment tracking
4. **Rate Management**: Flexible rate structures for different service types
5. **Payment Tracking**: Multiple payment modes and status tracking
6. **Expense Management**: Category-based expense tracking with approval workflow
7. **Sector-based Services**: Different services available per sector
8. **Courier Integration**: Support for multiple courier companies with custom rates

---

## Constraints & Rules

1. **Foreign Keys**: All FK relationships use CASCADE delete for franchise cleanup
2. **Unique Constraints**: booking_number, consignment_number, invoice_number, payment_number
3. **Indexes**: Strategic indexing on frequently queried columns for performance
4. **Timestamps**: All tables have created_at and updated_at for audit trail
5. **Enums**: Predefined values prevent invalid data entry

---

## Data Types Used

- **INT/INCREMENTS**: ID fields
- **VARCHAR(n)**: Text with max length
- **TEXT**: Long text content
- **DECIMAL(10,2)**: Money/price fields
- **DATE**: Date only
- **TIMESTAMP**: Date and time
- **BOOLEAN**: True/False values
- **ENUM**: Predefined values
- **JSON**: Flexible structure (rates)

---

## Best Practices

1. Always use `franchise_id` in WHERE clauses for data isolation
2. Use `created_at` for filtering recent records
3. Reference `status` field for filtering active/inactive records
4. Use `payment_status` and `status` fields for workflow tracking
5. Store calculated amounts separately for audit trail
6. Use indexes for common search patterns
7. Maintain referential integrity with foreign keys

