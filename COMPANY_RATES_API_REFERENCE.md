# Company Rates API Reference 📚

## Overview

This document describes the API endpoints for saving and managing courier company rates.

---

## API Endpoint: Save Courier Rates

### Request Details

**Method**: `POST`  
**Endpoint**: `/api/rates/courier`  
**Authentication**: Required (Bearer token)  
**Content-Type**: `application/json`

### Request Headers

```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

### Request Body Structure

```json
{
  "company_id": 1,
  "rates": [
    {
      "courier_type": "Dox",
      "row_name": "Within City",
      "slab_type": "Slab 2",
      "rates": {
        "rate_1": "100",
        "rate_2": "150",
        "rate_3": "200"
      }
    },
    {
      "courier_type": "NonDox",
      "row_name": "Metro",
      "sub_type": "air",
      "slab_type": "Slab 3",
      "rates": {
        "rate_1": "200",
        "rate_2": "300"
      }
    }
  ]
}
```

### Request Body Fields

| Field                  | Type    | Required | Description                                                                 |
| ---------------------- | ------- | -------- | --------------------------------------------------------------------------- |
| `company_id`           | Integer | Yes      | ID of the company (from company_rate_master)                                |
| `rates`                | Array   | Yes      | Array of rate objects                                                       |
| `rates[].courier_type` | String  | Yes      | Type: Dox, NonDox, Dtdc PLUS, Dtdc PTP, Express Cargo, Priority, E-Commerce |
| `rates[].row_name`     | String  | Yes      | Location name: Within City, Metro, Special Destination, etc.                |
| `rates[].sub_type`     | String  | No       | For NonDox (air/surface), Dtdc PTP (ptp/ptp2)                               |
| `rates[].slab_type`    | String  | Yes      | Slab 2, Slab 3, or Slab 4                                                   |
| `rates[].rates`        | Object  | Yes      | Rate values as key-value pairs                                              |

### Courier Types Reference

```
1. Dox
   - No sub_type needed
   - Row names: Within City, Metro, Special Destination, North East, Priority

2. NonDox
   - sub_type: "air" or "surface"
   - Row names: Within City, Metro, Special Destination, North East

3. Dtdc PLUS
   - No sub_type needed
   - Row names: Within City, Metro, Special Destination, North East

4. Dtdc PTP
   - sub_type: "ptp" or "ptp2"
   - Row names: Within City, Metro, Special Destination, North East

5. Express Cargo
   - No sub_type needed
   - Row names: Upto 50 Kg, Upto 100 Kg, Above 100 Kg

6. Priority
   - No sub_type needed
   - Row names: Within City, Metro, Other Cities

7. E-Commerce
   - No sub_type needed
   - Row names: Prepaid, COD
```

---

## Success Response (200 OK)

### Response Structure

```json
{
  "success": true,
  "message": "Courier company rates saved successfully",
  "inserted": 6,
  "warnings": []
}
```

### Response Fields

| Field      | Type    | Description                                  |
| ---------- | ------- | -------------------------------------------- |
| `success`  | Boolean | true if operation succeeded                  |
| `message`  | String  | Human-readable status message                |
| `inserted` | Integer | Number of rate records successfully inserted |
| `warnings` | Array   | Array of warning messages (usually empty)    |

### Success Scenarios

**Scenario 1: All rates saved**

```json
{
  "success": true,
  "message": "Courier company rates saved successfully",
  "inserted": 12,
  "warnings": []
}
```

**Scenario 2: Some rates saved with warnings**

```json
{
  "success": true,
  "message": "Courier company rates saved successfully",
  "inserted": 8,
  "warnings": ["Invalid rate value for Dox Within City Slab 2"]
}
```

---

## Error Responses

### 400 Bad Request

**Cause**: Invalid or missing request data

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "company_id is required and must be a positive integer",
    "rates must be an array"
  ]
}
```

### 401 Unauthorized

**Cause**: Missing or invalid authentication token

```json
{
  "success": false,
  "message": "No authentication token provided"
}
```

### 404 Not Found

**Cause**: Company not found

```json
{
  "success": false,
  "message": "Company not found"
}
```

### 500 Internal Server Error

**Cause**: Database error (most common: table doesn't exist)

```json
{
  "success": false,
  "message": "Error saving rates",
  "error": "Table 'frbilling.courier_company_rates' doesn't exist"
}
```

**Solution**:

```bash
cd backend
npm run migrate
```

### 500 Database Connection Error

```json
{
  "success": false,
  "message": "Database connection error",
  "error": "Cannot connect to MySQL server"
}
```

---

## Complete Example: cURL Request

```bash
curl -X POST http://localhost:3000/api/rates/courier \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": 1,
    "rates": [
      {
        "courier_type": "Dox",
        "row_name": "Within City",
        "slab_type": "Slab 2",
        "rates": {
          "rate_1": "100",
          "rate_2": "150",
          "rate_3": "200"
        }
      }
    ]
  }'
```

---

## Complete Example: JavaScript/Fetch

```javascript
const saveRates = async (companyId, rates) => {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch("/api/rates/courier", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        company_id: companyId,
        rates: rates,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log(`✅ ${data.inserted} rates saved`);
    } else {
      console.error("❌ Failed:", data.error);
    }

    return data;
  } catch (error) {
    console.error("Request error:", error);
  }
};

// Usage
saveRates(1, [
  {
    courier_type: "Dox",
    row_name: "Within City",
    slab_type: "Slab 2",
    rates: {
      rate_1: "100",
      rate_2: "150",
      rate_3: "200",
    },
  },
]);
```

---

## Database Query Examples

### View All Saved Rates

```sql
SELECT * FROM courier_company_rates;
```

### View Rates for Specific Company

```sql
SELECT * FROM courier_company_rates
WHERE company_id = 1;
```

### View Dox Rates

```sql
SELECT * FROM courier_company_rates
WHERE courier_type = 'Dox'
ORDER BY row_name, slab_type;
```

### View Rates by Slab

```sql
SELECT courier_type, row_name, slab_type, COUNT(*) as total
FROM courier_company_rates
WHERE slab_type = 'Slab 2'
GROUP BY courier_type, row_name;
```

### Count Records by Courier Type

```sql
SELECT courier_type, COUNT(*) as count
FROM courier_company_rates
GROUP BY courier_type;
```

### Update Rate Status

```sql
UPDATE courier_company_rates
SET status = 'inactive'
WHERE company_id = 1 AND courier_type = 'Dox';
```

### Delete Rates for Company

```sql
DELETE FROM courier_company_rates
WHERE company_id = 1;
```

---

## Rate Data Structure (JSON)

### Example Rate JSON Values

**Dox/Dtdc PLUS/Priority Rates**:

```json
{
  "rate_1": "100",
  "rate_2": "150",
  "rate_3": "200",
  "rate_4": "250",
  "rate_5": "300"
}
```

**NonDox Rates** (less detailed):

```json
{
  "rate_1": "50",
  "rate_2": "75",
  "rate_3": "100"
}
```

**Express Cargo Rates** (by weight):

```json
{
  "rate": "500"
}
```

---

## Performance Notes

| Metric                   | Value                        |
| ------------------------ | ---------------------------- |
| Time to insert 1 rate    | ~15-20ms                     |
| Time to insert 10 rates  | ~100-150ms                   |
| Time to insert 100 rates | ~1000-1500ms                 |
| Database indexes         | 2 (for fast lookups)         |
| Max batch size           | Limited by HTTP request size |

---

## Validation Rules

1. **company_id**: Must be positive integer, must exist in company_rate_master
2. **courier_type**: Must match predefined list (Dox, NonDox, etc.)
3. **row_name**: No validation, accepts any string
4. **slab_type**: Must be "Slab 2", "Slab 3", or "Slab 4"
5. **rates**: Must be object with string values (or numbers converted to strings)

---

## Common Issues & Solutions

### Issue: "Table doesn't exist"

**Error**: `Table 'frbilling.courier_company_rates' doesn't exist`  
**Solution**: Run migrations

```bash
cd backend && npm run migrate
```

### Issue: "Unauthorized"

**Error**: `401 No authentication token provided`  
**Solution**: Include valid JWT token in Authorization header

```javascript
headers: {
  'Authorization': `Bearer ${localStorage.getItem('token')}`
}
```

### Issue: "Validation error"

**Error**: `Validation error - rates must be an array`  
**Solution**: Ensure rates is an array of objects, not a single object

```javascript
// ❌ Wrong
rates: { courier_type: 'Dox', ... }

// ✅ Correct
rates: [{ courier_type: 'Dox', ... }]
```

### Issue: Rates not saving

**Error**: No error, but `inserted: 0`  
**Solution**: Check if rates pass validation in AddCompanyPage.jsx

```javascript
// Add console.log to see what's being sent
console.log("Sending rates:", ratesArray);
```

---

## Related Endpoints

### Get Company Details

```
GET /api/companies/:id
```

### Update Company

```
PUT /api/companies/:id
```

### Get All Rates for Company

```
GET /api/rates/courier?company_id=1
```

### Delete Rate

```
DELETE /api/rates/courier/:id
```

---

## Summary Table

| Operation   | Method | Endpoint                          | Returns                         |
| ----------- | ------ | --------------------------------- | ------------------------------- |
| Save rates  | POST   | `/api/rates/courier`              | { success, inserted, warnings } |
| Get rates   | GET    | `/api/rates/courier?company_id=1` | { success, data }               |
| Delete rate | DELETE | `/api/rates/courier/:id`          | { success, message }            |

---

**Last Updated**: 2024  
**Database**: MySQL 5.7+  
**API Version**: v1.0
