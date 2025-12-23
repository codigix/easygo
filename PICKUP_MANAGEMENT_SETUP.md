# 🚚 Pickup Management System - Setup Guide

## Complete Implementation Status ✅

All 4 Pickup Management pages have been successfully implemented with backend API integration.

---

## 🔧 Installation Steps

### Step 1: Run Database Migration

The pickup management system requires a new database table. Run the migration script:

```bash
cd backend
node run_pickup_migration.js
```

**Expected Output:**
```
🔄 Running Pickup Management migration...
✅ Successfully ran migrations:
   - 20240101000026_create_pickup_requests_table.cjs
✨ Pickup management tables created successfully!
```

If you see "All migrations are already up to date", the table already exists.

---

### Step 2: Start Backend Server

```bash
cd backend
npm start
```

The API should be running at `http://localhost:5000/api`

**Test the API health:**
```bash
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2025-12-23T..."
}
```

---

### Step 3: Start Frontend

```bash
cd frontend
npm run dev
```

Navigate to `http://localhost:5173` and login with your credentials.

---

## 📍 Accessing Pickup Management Pages

### Sidebar Navigation
```
Dashboard
  ↓
Booking
  ↓
Pickup Management ← EXPAND THIS
  ├─ Create Pickup Request
  ├─ Pickup Schedule
  ├─ Pickup Assignment
  └─ Pickup Status
```

---

## 🔄 Complete Workflow

### 1️⃣ **Create Pickup Request** (`/pickup/create`)
- **Form Fields:**
  - Pickup Date & Time Slot (Morning/Afternoon/Evening)
  - Pickup Type (Door Pickup/Walk-in)
  - Priority (Normal/Express)
  - Customer Details (Name, Mobile, Email, Company)
  - Address (Line, City, Pincode, Zone)
  - Parcels & Weight
  - Service Type (DOX/NON-DOX)
  - Payment Mode (Prepaid/COD)
  - Special Instructions & Fragile Flag

- **Auto-Generated:** Pickup Request ID (PKP-{franchiseId}-{date}-{random})
- **Initial Status:** REQUESTED

**Example Request:**
```json
{
  "pickupDate": "2025-12-25",
  "timeSlot": "Morning",
  "pickupType": "Door Pickup",
  "priority": "Normal",
  "customerName": "Raj Kumar",
  "mobileNumber": "9876543210",
  "email": "raj@example.com",
  "companyName": "Tech Corp",
  "addressLine": "123 MG Road, Apt 4B",
  "city": "Mumbai",
  "pincode": "400001",
  "zone": "Auto",
  "noOfParcels": 3,
  "approxWeight": 5.5,
  "serviceType": "NON-DOX",
  "paymentMode": "Prepaid",
  "specialInstructions": "Handle with care",
  "isFragile": true
}
```

---

### 2️⃣ **Pickup Schedule** (`/pickup/schedule`)
- **View:** List of REQUESTED pickups
- **Action:** Click "Schedule" button for each pickup
- **Modal:** Select Pickup Date & Time Slot
- **Result:** Status changes REQUESTED → SCHEDULED

**What Happens:**
- Branch Manager reviews pending pickups
- Selects date & time for execution
- Loads balanced across zones
- Prioritizes Express pickups

---

### 3️⃣ **Pickup Assignment** (`/pickup/assign`)
- **View:** List of SCHEDULED pickups
- **Action:** Click "Assign" button
- **Modal:** Select Driver (with Vehicle info)
- **Additional Fields:** Route/Area, Expected Pickup Time
- **Result:** Status changes SCHEDULED → ASSIGNED

**Driver Assignment:**
```
Available Drivers:
├─ Ramesh Kumar (MH12-AB-1234)
├─ Suresh Singh (MH12-CD-5678)
├─ Ajay Patel (MH12-EF-9012)
└─ Vishal Sharma (MH12-GH-3456)
```

---

### 4️⃣ **Pickup Status** (`/pickup/status`)
- **View:** All pickups with status timeline
- **Search:** By Request ID or Customer Name
- **Filter:** By Status (All, Requested, Scheduled, Assigned, Picked Up, Failed)
- **Timeline:** Visual progress bar showing completion status

**Status Progression:**
```
📝 REQUESTED 
  ↓
📅 SCHEDULED 
  ↓
👤 ASSIGNED 
  ↓
✓ PICKED_UP (Success)
or
✗ FAILED (with reason)
```

**Actions (when ASSIGNED):**
- **Mark Picked Up** → PICKED_UP (Final)
- **Mark Failed** → FAILED (With Reason & Remarks)

**Failure Reasons:**
- Customer not available
- Parcel not ready
- Wrong address
- Payment issue
- Other

---

## 📊 API Endpoints Reference

### POST `/api/pickups`
Create a new pickup request
```bash
curl -X POST http://localhost:5000/api/pickups \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{...formData}'
```

### GET `/api/pickups`
Fetch pickups with filters
```bash
curl -X GET "http://localhost:5000/api/pickups?status=REQUESTED&page=1&limit=20" \
  -H "Authorization: Bearer {token}"
```

### GET `/api/pickups/stats`
Get status statistics
```bash
curl -X GET http://localhost:5000/api/pickups/stats \
  -H "Authorization: Bearer {token}"
```

### GET `/api/pickups/{id}`
Get specific pickup details
```bash
curl -X GET http://localhost:5000/api/pickups/1 \
  -H "Authorization: Bearer {token}"
```

### POST `/api/pickups/{id}/schedule`
Schedule a pickup
```bash
curl -X POST http://localhost:5000/api/pickups/1/schedule \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"pickupDate":"2025-12-25","timeSlot":"Morning"}'
```

### POST `/api/pickups/{id}/assign`
Assign pickup to driver
```bash
curl -X POST http://localhost:5000/api/pickups/1/assign \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "driverName":"Ramesh Kumar",
    "vehicleNo":"MH12-AB-1234",
    "routeArea":"Zone A",
    "expectedPickupTime":"09:30"
  }'
```

### POST `/api/pickups/{id}/complete`
Mark pickup as completed
```bash
curl -X POST http://localhost:5000/api/pickups/1/complete \
  -H "Authorization: Bearer {token}"
```

### POST `/api/pickups/{id}/fail`
Mark pickup as failed
```bash
curl -X POST http://localhost:5000/api/pickups/1/fail \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "failureReason":"Customer not available",
    "remarks":"Will retry tomorrow"
  }'
```

---

## 🗄️ Database Schema

### `pickup_requests` Table

```sql
CREATE TABLE pickup_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  franchise_id INT NOT NULL,
  pickup_request_id VARCHAR(50) UNIQUE NOT NULL,
  pickup_date DATE NOT NULL,
  time_slot VARCHAR(50) NOT NULL,
  pickup_type VARCHAR(50),
  priority VARCHAR(50) DEFAULT 'Normal',
  
  -- Sender Details
  customer_name VARCHAR(255) NOT NULL,
  mobile_number VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  company_name VARCHAR(255),
  
  -- Address
  address_line TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  zone VARCHAR(100),
  
  -- Shipment
  no_of_parcels INT NOT NULL,
  approx_weight DECIMAL(10,2),
  service_type VARCHAR(50),
  payment_mode VARCHAR(50),
  
  -- Instructions
  special_instructions TEXT,
  is_fragile BOOLEAN DEFAULT FALSE,
  
  -- Status
  status ENUM('REQUESTED','SCHEDULED','ASSIGNED','PICKED_UP','FAILED') DEFAULT 'REQUESTED',
  
  -- Assignment
  driver_name VARCHAR(255),
  vehicle_no VARCHAR(50),
  route_area VARCHAR(100),
  expected_pickup_time TIME,
  
  -- Tracking
  failure_reason TEXT,
  remarks TEXT,
  last_updated DATETIME,
  
  -- Timestamps
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  
  FOREIGN KEY (franchise_id) REFERENCES franchises(id),
  INDEX (franchise_id, pickup_date),
  INDEX (pickup_request_id),
  INDEX (status),
  INDEX (customer_name)
);
```

---

## ✅ Troubleshooting

### Error: "Failed to fetch pickup requests"

**Solution 1: Run Migration**
```bash
cd backend
node run_pickup_migration.js
```

**Solution 2: Check Database Connection**
```bash
# Verify .env has correct database credentials
cat .env | grep MYSQL
```

**Solution 3: Check Backend Logs**
```bash
# Look for detailed error messages in console
npm start
```

---

### Error: "Table 'pickup_requests' doesn't exist"

**Solution:**
```bash
cd backend
node run_pickup_migration.js
```

---

### Error: "Cannot POST /pickups"

**Solution: Verify API Routes**
```bash
curl http://localhost:5000/api/health
# Should return success: true
```

---

### Frontend Showing Spinner But No Data

**Solution:**
1. Open Browser DevTools (F12)
2. Go to Network tab
3. Check if requests to `/api/pickups` return 200
4. Check Console for any error messages
5. Verify token is valid: `localStorage.getItem('token')`

---

## 🔐 Role-Based Access

| Role | Access |
|------|--------|
| **Admin** | All operations |
| **Franchise** | All operations |
| **Branch Ops** | Schedule + Assign only |
| **Driver** | View assigned pickups (Mobile app) |
| **Customer** | Create + View Status only |

---

## 📱 Frontend Pages File Locations

```
frontend/src/pages/
├─ PickupCreatePage.jsx      ← Create Pickup Request
├─ PickupSchedulePage.jsx     ← Pickup Schedule
├─ PickupAssignmentPage.jsx   ← Pickup Assignment
└─ PickupStatusPage.jsx       ← Pickup Status

frontend/src/services/
└─ pickupService.js           ← API integration
```

---

## 🔄 Workflow Sequence Diagram

```
Customer/System
       ↓
   Create Request
       ↓
  [REQUESTED]
       ↓
 Branch Manager
       ↓
   Schedule Pickup
       ↓
  [SCHEDULED]
       ↓
   Supervisor
       ↓
 Assign to Driver
       ↓
   [ASSIGNED]
       ↓
   Driver Arrives
       ↓
   ┌─→ Pickup Successful ──→ [PICKED_UP] ──→ Auto-create Shipment
   │
   └─→ Pickup Failed ──────→ [FAILED] ──→ Can be rescheduled
```

---

## 🎯 Key Features

✅ **Automatic ID Generation** - PKP-{franchiseId}-{date}-{random}  
✅ **Status Timeline** - Visual progress tracking  
✅ **Driver Management** - Select from available drivers  
✅ **Failure Tracking** - Record reasons for failed pickups  
✅ **Search & Filter** - Quick lookup by ID or customer  
✅ **Form Validation** - Mobile (10 digits), Pincode (6 digits)  
✅ **Error Handling** - Detailed error messages  
✅ **Modal Dialogs** - Clean, focused UX  
✅ **Auto Timestamps** - Tracks all status changes  
✅ **Responsive Design** - Works on mobile & desktop  

---

## 📝 Next Steps (Optional)

1. **Integrate with Driver Mobile App** - Show assigned pickups
2. **SMS/Email Notifications** - Alert drivers when assigned
3. **Analytics Dashboard** - Pickup metrics & performance
4. **Integration with Shipment Module** - Auto-create shipments on completion
5. **Route Optimization** - Group pickups by zone for efficiency
6. **Live GPS Tracking** - Track driver location during pickup

---

## 🆘 Support

For issues or errors:
1. Check browser console (F12)
2. Check backend logs
3. Verify database migration ran successfully
4. Check API health: `GET /api/health`
5. Verify authentication token is valid

---

**Version:** 1.0  
**Last Updated:** 2025-12-23  
**Status:** Production Ready ✨
