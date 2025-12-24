# Hub Operations Workflow - Complete Guide

## System Overview

Hub Operations manages the complete logistics workflow from manifest creation through final delivery or return. It handles manifesting, scanning, and RTO (Return-to-Origin) management.

---

## 1. MANIFEST CREATION WORKFLOW

### ✅ Start: Create Manifest
**Location**: Hub Operations → Create Manifest

**Prerequisites**:
- Shipments must exist with status: `CREATED`
- Courier company selected
- Origin hub selected

**Process**:
```
1. Select Courier Company (dropdown)
2. Select Origin Hub (dropdown)
3. Scan/Select Shipments by CN (barcode scanning supported)
4. Submit to Create Manifest
```

**Backend Actions**:
- Database Transaction (Atomic):
  1. Insert manifest record with status `OPEN`
  2. Insert manifest_shipments links
  3. Update all shipments status to `MANIFESTED`
  4. Commit or Rollback

**Output**:
- Manifest created with unique number: `MF-{franchiseId}-{YYYYMMDD}-{randomCode}`
- Example: `MF-6-20251224-7KPPQ9`
- All linked shipments change status → `MANIFESTED`

**Shipment Status Lifecycle at this point**:
```
CREATED → MANIFESTED (atomic update)
```

---

## 2. MANIFEST LIST & MANAGEMENT

### 📋 View Manifests
**Location**: Hub Operations → Manifest List

**Features**:
- View all manifests with pagination (20 per page)
- Filter by Status: ALL, OPEN, CLOSED, PICKUP_ASSIGNED, CANCELLED
- Display columns:
  - Manifest Number
  - Courier Company
  - Shipment Count
  - Total Weight
  - Status

**Manifest Statuses**:
| Status | Meaning |
|--------|---------|
| OPEN | Ready for operations |
| CLOSED | Manifest locked, no changes |
| PICKUP_ASSIGNED | Courier pickup scheduled |
| CANCELLED | Manifest cancelled, no further operations |

### 🔍 View Manifest Details
- Click Eye Icon to see:
  - Manifest information
  - All linked shipments (with CN, status)
  - Ability to remanifest shipments

### ❌ Close Manifest
- Mark manifest as CLOSED
- Prevents further modifications
- Shipments remain MANIFESTED
- **MUST close before Hub In-Scan operations** (manifest status validated during hub scan)

### 🔄 Remanifest Shipments
- Select specific shipments from manifest
- Move them to a NEW manifest
- Shipment status remains `MANIFESTED` (no change)
- Only `manifest_shipments.status` changes to `REMANIFESTED` in original manifest
- Shipment linked to new manifest with `manifest_shipments.status = ADDED`
- New manifest created with moved shipments

**Remanifest Flow**:
```
Original Manifest (OPEN)
├── Shipment A ─→ Stays (status: MANIFESTED, manifest_shipments: ADDED)
├── Shipment B ─→ MOVED (status: MANIFESTED, manifest_shipments: REMANIFESTED → ADDED in new manifest)
└── Shipment C ─→ MOVED (status: MANIFESTED, manifest_shipments: REMANIFESTED → ADDED in new manifest)

New Manifest Created (OPEN)
├── Shipment B (status: MANIFESTED, manifest_shipments: ADDED)
└── Shipment C (status: MANIFESTED, manifest_shipments: ADDED)
```

**Key Difference**:
- **Shipment Status** (`shipments.status`): Always stays `MANIFESTED` during remanifest
- **Manifest-Shipment Link** (`manifest_shipments.status`): Changes to track which manifest version the shipment belongs to

---

## 3. HUB SCAN OPERATIONS

### 🔓 Hub In-Scan
**Purpose**: Record when manifest/shipments arrive at hub

**Prerequisites**:
- Shipment status must be `MANIFESTED`
- Manifest status must be `CLOSED` or `PICKUP_ASSIGNED` (enforced validation)

**Process**:
1. Scan manifest or shipment CN
2. Hub scans incoming packages
3. Update shipment status → `HUB_IN_SCAN`
4. Record scan time, location, device

**Data Recorded**:
- Scan type: IN_SCAN
- Shipment ID
- Hub ID
- Scan time (timestamp)
- Scanned by (user ID)
- Device ID (optional)
- Location (optional)

### 🔐 Hub Out-Scan
**Purpose**: Record when packages leave hub for delivery

**Process**:
1. Scan packages leaving hub
2. Update shipment status → `HUB_OUT_SCAN`
3. Record scan metadata

**Data Recorded**:
- Scan type: OUT_SCAN
- Next Hub ID (if routing to another hub)
- Route code (optional)
- Vehicle ID (optional)

### 📊 Shipment Status After Scans
```
MANIFESTED 
  ↓ (Hub In-Scan)
HUB_IN_SCAN
  ↓ (Hub Out-Scan)
HUB_OUT_SCAN
  ↓ (Transit to delivery)
IN_TRANSIT
  ↓
OUT_FOR_DELIVERY
  ↓
DELIVERED
```

---

## 4. RTO (RETURN-TO-ORIGIN) WORKFLOW

### 📌 RTO Reasons (6 types)
```
1. DELIVERY_FAILED      - Delivery attempt failed
2. CUSTOMER_REFUSED     - Customer refused to accept
3. ADDRESS_UNSERVICEABLE - Address not found/incomplete
4. DAMAGED_PARCEL       - Package damaged in transit
5. LOST_PARCEL          - Package lost
6. PAYMENT_ISSUE        - Payment/COD issues
```

### ✅ Initiate RTO
**Location**: Hub Operations → RTO Management → Initiate RTO Tab

**Prerequisites**:
- Shipments with status: `OUT_FOR_DELIVERY`
- RTO reason selected
- Notes (optional)

**Process**:
```
1. Go to "Initiate RTO" tab
2. Select RTO Reason from dropdown
3. Add notes (optional)
4. Select shipments from list (checkboxes)
5. Click "Initiate RTO"
```

**Backend Actions**:
1. Database Transaction (Atomic):
   - Insert RTO manifest record
   - Update all selected shipments status → `RTO`
   - Commit transaction

**Output**:
- RTO Manifest created: `RTO-{franchiseId}-{YYYYMMDD}-{randomCode}`
- Example: `RTO-6-20251224-A1B2C3`
- All linked shipments change status → `RTO`

### 📋 RTO Manifest List
**Location**: Hub Operations → RTO Management → RTO Manifests Tab

**Features**:
- View all RTO manifests with pagination
- Filter by Status: ALL, INITIATED, IN_TRANSIT, RETURNED, RESOLVED
- Display columns:
  - RTO Number
  - Reason
  - Shipment Count
  - Status
  - Action (Mark Returned button)

**RTO Statuses**:
| Status | Meaning |
|--------|---------|
| INITIATED | RTO created, awaiting transit |
| IN_TRANSIT | Package in reverse logistics |
| RETURNED | Arrived back at origin |
| RESOLVED | Final disposition complete |

### ✔️ Mark RTO as Returned
- Click "Mark Returned" button on RTO manifest
- Updates RTO status → `RETURNED`
- Confirms receipt at origin hub

### 🏁 RTO Complete Workflow
```
OUT_FOR_DELIVERY Shipments
        ↓
  Initiate RTO (select reason)
        ↓
  RTO Manifest Created (Status: INITIATED)
        ↓
  Shipments status → RTO
        ↓
  Reverse Logistics (In-Transit)
        ↓
  Mark Returned (RTO: IN_TRANSIT → RETURNED)
        ↓
  Final Resolution (Status: RESOLVED)
```

---

## 5. EXCEPTION HANDLING

### 📌 Exception Types (Terminal/Blocking Issues Only)

**EXCEPTION status is for terminal or blocking issues that prevent normal delivery workflow:**

| Exception Type | Description | Resolution |
|---|---|---|
| **LOST_PARCEL** | Shipment lost during transit | Initiate insurance claim, refund/re-ship |
| **DAMAGED_PARCEL** | Parcel damaged beyond delivery | Inspect, document, initiate claim |
| **DUPLICATE_CN** | Duplicate CN/barcode detected | Investigate, cancel duplicate |
| **FRAUD_DETECTION** | Shipment flagged as fraudulent | Escalate to compliance, hold shipment |
| **RATE_MISMATCH** | Calculated rate doesn't match actual | Recalculate, adjust charges |
| **WEIGHT_MISMATCH** | Actual weight varies from declared | Recalculate charges, audit sender |

### ❌ What is NOT an Exception
- **Delivery Failed** ← Use RTO (Return-to-Origin) instead
- **Customer Refused** ← Use RTO instead
- **Address Unserviceable** ← Use RTO instead
- **Payment/COD Issues** ← Use RTO instead

**Key Rule**: RTO handles *reversible delivery issues*, EXCEPTION handles *terminal/blocking issues*.

---

## 6. DATABASE RELATIONSHIPS

### Core Tables
```
manifests
├── id (PK)
├── manifest_number (unique)
├── franchise_id (FK)
├── courier_company_id
├── origin_hub_id
├── status (OPEN, CLOSED, PICKUP_ASSIGNED, CANCELLED)
├── total_shipments
├── total_weight
├── total_charge
└── timestamps

manifest_shipments (Junction Table)
├── id (PK)
├── manifest_id (FK)
├── shipment_id (FK)
├── franchise_id (FK)
├── status (ADDED, REMOVED, REMANIFESTED)
└── timestamps

hub_scans
├── id (PK)
├── shipment_id (FK)
├── franchise_id (FK)
├── hub_id
├── scan_type (IN_SCAN, OUT_SCAN)
├── scanned_by (user_id)
├── scan_time
└── timestamps

rto_manifests
├── id (PK)
├── rto_manifest_number (unique)
├── franchise_id (FK)
├── rto_reason (6 enum values)
├── status (INITIATED, IN_TRANSIT, RETURNED, RESOLVED)
├── total_shipments
└── timestamps

shipments
├── id (PK)
├── shipment_cn (unique barcode)
├── status (CREATED, MANIFESTED, HUB_IN_SCAN, HUB_OUT_SCAN, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, RTO, EXCEPTION)
├── weight, receiver info, charges
└── timestamps
```

---

## 7. SHIPMENT STATUS COMPLETE LIFECYCLE

```
START: CREATED
  ↓
  ├─→ [Create Manifest] → MANIFESTED
  │     ↓
  │     ├─→ [Hub In-Scan] → HUB_IN_SCAN
  │     │     ↓
  │     │     ├─→ [Hub Out-Scan] → HUB_OUT_SCAN
  │     │           ↓
  │     │           ├─→ [In Transit] → IN_TRANSIT
  │     │                 ↓
  │     │                 ├─→ [Ready for Delivery] → OUT_FOR_DELIVERY
  │     │                       ↓
  │     │                       ├─→ [Delivery Success] → DELIVERED ✅
  │     │                       │
  │     │                       └─→ [Delivery Fails/Issue] → [Initiate RTO] → RTO
  │     │                             ↓
  │     │                             ├─→ [Mark Returned] → RETURNED (part of RTO status)
  │     │                             └─→ [Final Resolution] → RESOLVED (RTO status)
  │     │
  │     └─→ [Terminal/Blocking Issue] → EXCEPTION
  │           (Lost, Damaged, Duplicate CN, Fraud, Rate Mismatch)
  │
  └─→ [Not Manifested] → Stays CREATED
```

---

## 8. API ENDPOINTS

### Manifests
```
POST   /api/hub-operations/manifests              - Create manifest
GET    /api/hub-operations/manifests              - List manifests (with pagination)
GET    /api/hub-operations/manifests/:id          - Get manifest details
PATCH  /api/hub-operations/manifests/:id/close    - Close manifest
POST   /api/hub-operations/manifests/:id/remanifest - Remanifest shipments
```

### Hub Scans
```
POST   /api/hub-operations/hub-scans/in-scan      - Record hub in-scan
POST   /api/hub-operations/hub-scans/out-scan     - Record hub out-scan
```

### RTO
```
POST   /api/hub-operations/rto                    - Initiate RTO
GET    /api/hub-operations/rto                    - List RTO manifests (with pagination)
PATCH  /api/hub-operations/rto/:id/complete       - Mark RTO as returned
```

---

## 9. TEST DATA SEEDING

### Create Manifest Test Data
```bash
node backend/seed_test_data.js
```
Creates:
- 5 shipments (SHP001-SHP005) with status CREATED
- 1 manifest linking all 5 shipments
- Updates shipments to MANIFESTED

### Create RTO Test Data
```bash
node backend/seed_rto_data.js
```
Creates:
- 3 shipments (RTO001-RTO003) with status OUT_FOR_DELIVERY
- 1 RTO manifest with status INITIATED

---

## 10. TRANSACTION & CONSISTENCY

### Atomic Operations
- **Manifest Creation**: All shipments updated to MANIFESTED in single transaction
- **RTO Initiation**: All shipments updated to RTO in single transaction
- **Remanifest**: Shipments linked to new manifest in single transaction

### Benefits
- Data consistency guaranteed
- No partial updates
- Rollback on any error
- All or nothing principle

---

## 11. COMPLETE WORKFLOW EXAMPLE

### Scenario: 5 Shipments from Create to Delivery

```
DAY 1: MANIFEST CREATION
├─ Shipment SHP001 status: CREATED → MANIFESTED
├─ Shipment SHP002 status: CREATED → MANIFESTED
├─ Shipment SHP003 status: CREATED → MANIFESTED
├─ Shipment SHP004 status: CREATED → MANIFESTED
└─ Shipment SHP005 status: CREATED → MANIFESTED
Manifest MF-6-20251224-7KPPQ9 created (OPEN)

DAY 2: DELIVERY HUB OPERATIONS
├─ HUB IN-SCAN: Scanned at Origin Hub
│  └─ All shipments: MANIFESTED → HUB_IN_SCAN
├─ HUB OUT-SCAN: Scanned leaving hub
│  └─ All shipments: HUB_IN_SCAN → HUB_OUT_SCAN
└─ IN-TRANSIT: Route to destination hub

DAY 3: DELIVERY ATTEMPT
├─ Shipment SHP001 → OUT_FOR_DELIVERY → DELIVERED ✅
├─ Shipment SHP002 → OUT_FOR_DELIVERY → DELIVERED ✅
├─ Shipment SHP003 → OUT_FOR_DELIVERY → Delivery Failed
│  ├─ Status: OUT_FOR_DELIVERY
│  ├─ Initiate RTO (Reason: DELIVERY_FAILED)
│  ├─ RTO Manifest: RTO-6-20251224-A1B2C3 (INITIATED)
│  └─ Status: OUT_FOR_DELIVERY → RTO
├─ Shipment SHP004 → OUT_FOR_DELIVERY → DELIVERED ✅
└─ Shipment SHP005 → OUT_FOR_DELIVERY → Customer Refused
   ├─ Status: OUT_FOR_DELIVERY
   ├─ Initiate RTO (Reason: CUSTOMER_REFUSED)
   ├─ RTO Manifest: RTO-6-20251224-A1B2C3
   └─ Status: OUT_FOR_DELIVERY → RTO

DAY 4: RTO PROCESSING
├─ RTO Manifest Status: INITIATED → IN_TRANSIT
├─ Shipment SHP003: RTO status (reverse logistics)
├─ Shipment SHP005: RTO status (reverse logistics)
└─ Mark Returned: INITIATED → RETURNED

DAY 5: RESOLUTION
├─ SHP003: Final disposition (Refund/Redeliver)
├─ SHP005: Final disposition (Refund/Redeliver)
└─ RTO Status: RETURNED → RESOLVED
```

---

## 12. KEY FEATURES

✅ **Atomic Transactions**: Data consistency guaranteed
✅ **Pagination**: Handle large datasets efficiently
✅ **Barcode Scanning**: Scan CNs during manifest creation
✅ **Status Tracking**: 9 shipment statuses, 4 manifest statuses, 4 RTO statuses
✅ **Audit Trail**: All timestamps recorded
✅ **Franchise Isolation**: Data segregated by franchise
✅ **User Attribution**: Operations tracked to user ID
✅ **Flexible Filtering**: Filter by status, hub, courier, etc.

---

## 13. ERROR HANDLING

### Common Errors
```
"Shipments not in CREATED status" 
→ Only CREATED shipments can be manifested

"Manifest not found"
→ Invalid manifest ID or access denied

"Some shipments not found"
→ Invalid shipment IDs provided

"Manifest already remanifested"
→ Cannot remanifest a REMANIFESTED manifest

"Failed to perform scan"
→ Invalid shipment/hub/scan data
```

---

## Summary Dashboard

| Component | Status |
|-----------|--------|
| Manifest Creation | ✅ Working |
| Manifest List & Filter | ✅ Working |
| Manifest Closure | ✅ Working |
| Remanifest | ✅ Fixed |
| Hub In-Scan | ✅ Working |
| Hub Out-Scan | ✅ Working |
| RTO Initiation | ✅ Fixed |
| RTO List & Filter | ✅ Working |
| RTO Completion | ✅ Working |
| Pagination | ✅ Working |
| Atomic Transactions | ✅ Working |
| Database Schema | ✅ Correct |

**System Status**: 🟢 **FULLY OPERATIONAL**

