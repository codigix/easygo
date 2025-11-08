# 🔍 STEP-BY-STEP EXECUTION TRACE

## 📌 How to Follow the Code Execution

### **SCENARIO: User searches for "12345" (Customer ID)**

---

## 🎯 STEP 1: User Types Input

**File:** `frontend/src/components/ChatbotAssistant.jsx`  
**Line:** 41-56 (Component State)

```javascript
const [inputValue, setInputValue] = useState("");  // User types here
const [messages, setMessages] = useState([...]);   // Chat messages
```

**User Action:**

```
Input Box: "12345" + Press Enter/Send
```

---

## 🎯 STEP 2: handleSendMessage Function Triggered

**File:** `frontend/src/components/ChatbotAssistant.jsx`  
**Line:** 138-220

```javascript
const handleSendMessage = async (e) => {
  e.preventDefault();

  if (!inputValue.trim()) return;  // LINE 142: Check not empty

  // LINE 145-150: Create user message object
  const userMessage = {
    id: messageIdRef.current++,
    text: inputValue,        // "12345"
    sender: "user",
    type: "text",
  };

  setMessages((prev) => [...prev, userMessage]);  // Display user message
  setInputValue("");                               // Clear input
  setIsLoading(true);                              // Show loading
```

**What you'll see:** Message appears in chat with "12345" on user side

---

## 🎯 STEP 3: Extract & Store Search Input

**File:** `frontend/src/components/ChatbotAssistant.jsx`  
**Line:** 157-158

```javascript
try {
  const token = localStorage.getItem("token");
  const searchInput = inputValue.trim();  // LINE 158: "12345"
```

**Value Now:** `searchInput = "12345"`

---

## ⭐ STEP 4: AUTO INPUT DETECTION - THE MAGIC!

**File:** `frontend/src/components/ChatbotAssistant.jsx`  
**Line:** 163-167

```javascript
// Check if input is numeric (customer ID) or alphanumeric (consignment)
const params = new URLSearchParams();

if (/^\d+$/.test(searchInput)) {
  // ← TEST: "12345"
  // Line 164: /^\d+$/ = Match ONLY digits?
  // "12345" has only digits! → TRUE ✅

  params.append("customerId", searchInput); // LINE 165: Add customerId param
} else {
  params.append("consignmentNo", searchInput); // Would go here if alphanumeric
}
```

**Regex Test Breakdown:**

```javascript
const regex = /^\d+$/;
const input = "12345";

regex.test(input)  // Step-by-step check:
↓
^       // Start of string
\d      // Check if digit (1) ✅
\d      // Check if digit (2) ✅
\d      // Check if digit (3) ✅
\d      // Check if digit (4) ✅
\d      // Check if digit (5) ✅
$       // End of string ✅
Result: true → Execute FIRST branch → customerId search
```

**Value Now:** `params = "customerId=12345"`

---

## 🎯 STEP 5: Build API URL

**File:** `frontend/src/components/ChatbotAssistant.jsx`  
**Line:** 169-178

```javascript
const response = await fetch(
  `${
    import.meta.env.VITE_API_URL // "http://localhost:5000"
  }/bookings/search-with-invoices?${params.toString()}`,
  // ↓
  // "http://localhost:5000/bookings/search-with-invoices?customerId=12345"

  {
    headers: {
      Authorization: `Bearer ${token}`, // Auth token from localStorage
    },
  }
);
```

**URL Generated:**

```
GET http://localhost:5000/bookings/search-with-invoices?customerId=12345
Header: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## 🎯 STEP 6: Backend Receives Request

**File:** `backend/src/routes/bookingRoutes.js`  
**Line:** 37

```javascript
router.get("/search-with-invoices", authenticate, searchBookingsWithInvoices);
//                                   ↓                 ↓
//                            middleware          controller
```

**Flow:**

1. Request hits GET `/search-with-invoices`
2. `authenticate` middleware checks token ✅
3. Calls `searchBookingsWithInvoices` controller

---

## 🎯 STEP 7: Controller Executes

**File:** `backend/src/controllers/bookingController.js`  
**Line:** 976-980

```javascript
export const searchBookingsWithInvoices = async (req, res) => {
  try {
    // LINE 978: Get franchise from authenticated user
    const franchiseId = req.user.franchise_id;     // From auth token
    // Value: franchiseId = 1

    // LINE 979: Extract query parameters
    const { consignmentNo, customerId } = req.query;
    // Value: customerId = "12345", consignmentNo = undefined
```

**Values Now:**

```javascript
franchiseId = 1;
customerId = "12345";
consignmentNo = undefined;
```

---

## 🎯 STEP 8: Validate Input

**File:** `backend/src/controllers/bookingController.js`  
**Line:** 981-986

```javascript
if (!consignmentNo && !customerId) {
  // Check: !undefined && !"12345"?
  // Check: true && false?
  // Result: false → SKIP ERROR ✅
  return res.status(400).json({...});
}

// Continue execution...
```

**Status:** ✅ Input is valid

---

## 🎯 STEP 9: Build Base SQL Query

**File:** `backend/src/controllers/bookingController.js`  
**Line:** 989-1006

```javascript
const db = getDb();

let query = `
  SELECT DISTINCT
    b.id,
    b.consignment_number,
    b.customer_id,
    b.destination,
    b.act_wt as weight,
    b.mode,
    b.total as amount,
    b.booking_date,
    b.status,
    i.id as invoice_id,
    i.invoice_number
  FROM bookings b
  LEFT JOIN invoice_items ii ON b.id = ii.booking_id
  LEFT JOIN invoices i ON ii.invoice_id = i.id
  WHERE b.franchise_id = ?
`;

const params = [franchiseId]; // params = [1]
```

**Current Query:**

```sql
SELECT ... FROM bookings b
LEFT JOIN invoice_items ii ...
LEFT JOIN invoices i ...
WHERE b.franchise_id = ?
```

**Params Array:** `[1]`

---

## 🎯 STEP 10: Add Conditional WHERE Clause

**File:** `backend/src/controllers/bookingController.js`  
**Line:** 1009-1017

```javascript
// LINE 1009: Check if consignmentNo provided
if (consignmentNo) {
  // Is consignmentNo truthy? undefined → false
  // SKIP THIS BLOCK ❌
  query += ` AND LOWER(b.consignment_number) = LOWER(?)`;
  params.push(consignmentNo.trim());
}

// LINE 1014: Check if customerId provided
if (customerId) {
  // Is customerId truthy? "12345" → true ✅
  // EXECUTE THIS BLOCK ✅
  query += ` AND b.customer_id = ?`; // LINE 1015
  params.push(customerId.trim()); // LINE 1016
}
```

**Query After Modification:**

```sql
SELECT ... FROM bookings b
LEFT JOIN invoice_items ii ...
LEFT JOIN invoices i ...
WHERE b.franchise_id = ?
  AND b.customer_id = ?
```

**Params Array Now:** `[1, "12345"]`

---

## 🎯 STEP 11: Add Sorting

**File:** `backend/src/controllers/bookingController.js`  
**Line:** 1019

```javascript
query += ` ORDER BY b.booking_date DESC`;
```

**Final Query:**

```sql
SELECT ... FROM bookings b
LEFT JOIN invoice_items ii ...
LEFT JOIN invoices i ...
WHERE b.franchise_id = ?
  AND b.customer_id = ?
ORDER BY b.booking_date DESC
```

---

## 🎯 STEP 12: Execute Database Query

**File:** `backend/src/controllers/bookingController.js`  
**Line:** 1021

```javascript
const [bookings] = await db.query(query, params);
// Executes with:
// query = "SELECT ... WHERE b.franchise_id = ? AND b.customer_id = ? ..."
// params = [1, "12345"]
```

**Database executes:**

```sql
SELECT DISTINCT ...
FROM bookings b
LEFT JOIN invoice_items ii ON b.id = ii.booking_id
LEFT JOIN invoices i ON ii.invoice_id = i.id
WHERE b.franchise_id = 1
  AND b.customer_id = '12345'
ORDER BY b.booking_date DESC
```

**Returns:** Array of bookings for customer 12345

---

## 🎯 STEP 13: Check Results

**File:** `backend/src/controllers/bookingController.js`  
**Line:** 1023-1031

```javascript
if (bookings.length === 0) {
  // If NO bookings found
  return res.json({
    success: true,
    data: {
      bookings: [],
      message: "No bookings found for the selected criteria.",
    },
  });
}

// If bookings EXIST, continue...
```

**Assuming bookings found:** Continue to next step ✅

---

## 🎯 STEP 14: Return JSON Response

**File:** `backend/src/controllers/bookingController.js`  
**Line:** 1033-1039

```javascript
res.json({
  success: true,
  data: {
    bookings, // Array of booking records
    count: bookings.length,
  },
});
```

**Response Sent to Frontend:**

```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": 1,
        "consignment_number": "CODIGIIX108",
        "customer_id": "12345",
        "destination": "Mumbai",
        "weight": "5",
        "mode": "Express",
        "amount": "500",
        "booking_date": "2025-01-15",
        "status": "Booked",
        "invoice_id": 101,
        "invoice_number": "INV-2025-001"
      },
      {
        "id": 2,
        "consignment_number": "CODIGIIX109",
        "customer_id": "12345",
        "destination": "Delhi",
        "weight": "3",
        "mode": "Standard",
        "amount": "300",
        "booking_date": "2025-01-14",
        "status": "Booked",
        "invoice_id": 102,
        "invoice_number": "INV-2025-002"
      }
    ],
    "count": 2
  }
}
```

---

## 🎯 STEP 15: Frontend Receives Response

**File:** `frontend/src/components/ChatbotAssistant.jsx`  
**Line:** 180-194

```javascript
if (!response.ok) {
  throw new Error("Search failed"); // If error
}

const result = await response.json(); // Parse JSON
// result = { success: true, data: { bookings: [...], count: 2 } }

if (result.success && result.data.bookings.length > 0) {
  // Check: true && 2 > 0? → true ✅

  const assistantMessage = {
    id: messageIdRef.current++,
    sender: "assistant",
    type: "booking_table",
    bookings: result.data.bookings, // Store bookings array
    text: `Found ${result.data.count} booking(s)`, // "Found 2 booking(s)"
  };

  setMessages((prev) => [...prev, assistantMessage]); // Add to chat
}
```

**Action:** Add booking table message to chat

---

## 🎯 STEP 16: Display Table Component

**File:** `frontend/src/components/ChatbotAssistant.jsx`  
**Line:** 272-361

```javascript
{message.type === "booking_table" && message.bookings && (
  <div className="space-y-2 text-xs">
    <p className="font-semibold text-sm mb-2">
      {message.text}  {/* "Found 2 booking(s)" */}
    </p>
    <div className="overflow-x-auto bg-white text-gray-900 rounded">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200 border-b">
            <th>Consignment</th>
            <th>Destination</th>
            <th>Weight</th>
            <th>Mode</th>
            <th>Amount</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {message.bookings.map((booking, idx) => (  // Loop through bookings
            <tr key={idx} className="border-b hover:bg-gray-100">
              <td>{booking.consignment_number}</td>     {/* CODIGIIX108 */}
              <td>{booking.destination || "N/A"}</td>   {/* Mumbai */}
              <td>{booking.weight || "N/A"} kg</td>     {/* 5 kg */}
              <td>{booking.mode || "N/A"}</td>          {/* Express */}
              <td className="text-right">
                ₹{booking.amount || 0}                 {/* ₹500 */}
              </td>
              <td className="text-center">
                {booking.invoice_id ? (
                  <button
                    onClick={() => handleDownloadInvoice(...)}
                  >
                    Download  {/* Invoice button */}
                  </button>
                ) : (
                  <span>No Invoice</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}
```

**Final Result Rendered:**

```
┌─────────────────────────────────────────────────────────────┐
│ Found 2 booking(s)                                          │
├──────────────┬──────────┬────────┬─────────┬────────┬──────┤
│ Consignment  │ Destin.  │ Weight │ Mode    │ Amount │ Actn │
├──────────────┼──────────┼────────┼─────────┼────────┼──────┤
│ CODIGIIX108  │ Mumbai   │ 5 kg   │ Express │ ₹500   │ ⬇️  │
│ CODIGIIX109  │ Delhi    │ 3 kg   │ Std     │ ₹300   │ ⬇️  │
└──────────────┴──────────┴────────┴─────────┴────────┴──────┘
```

---

## 🎬 COMPLETE EXECUTION FLOW SUMMARY

```
┌──────────────────────────────────────────────────────────────┐
│ 1. User Types "12345"                                        │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. handleSendMessage() triggered                            │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. Auto Detection: /^\d+$/.test("12345") = true            │
│    → Use customerId search                                  │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 4. Build URL: ?customerId=12345                             │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 5. API Call: /bookings/search-with-invoices?customerId=... │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 6. Backend Router matches /search-with-invoices              │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 7. Authenticate middleware validates token                  │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 8. Controller: searchBookingsWithInvoices()                  │
│    - Extract customerId = "12345"                            │
│    - Get franchiseId from user = 1                           │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 9. Build SQL Query with conditional WHERE clause            │
│    WHERE franchise_id = 1 AND customer_id = '12345'        │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 10. Execute: db.query(sql, params)                          │
│     Database joins: bookings + invoice_items + invoices     │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 11. Return: [                                               │
│      { id: 1, consignment_number: "CODIGIIX108", ... },    │
│      { id: 2, consignment_number: "CODIGIIX109", ... }     │
│     ]                                                        │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 12. Send JSON Response                                       │
│     { success: true, data: { bookings: [...], count: 2 } }  │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 13. Frontend: Parse response.json()                          │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 14. Create assistantMessage with type="booking_table"        │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 15. setMessages() - Add table to chat                        │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 16. React renders booking table with download buttons       │
└──────────────────────────────────────────────────────────────┘
```

---

## 📍 FILES TO REVIEW IN ORDER

1. **Frontend Entry:** `frontend/src/components/ChatbotAssistant.jsx` (Lines 138-220)
2. **Backend Route:** `backend/src/routes/bookingRoutes.js` (Line 37)
3. **Backend Logic:** `backend/src/controllers/bookingController.js` (Lines 976-1047)
4. **Frontend Display:** `frontend/src/components/ChatbotAssistant.jsx` (Lines 272-361)

---

## ✅ KEY TAKEAWAYS

✅ **Regex Test** (`/^\d+$/`) decides search type instantly  
✅ **Conditional params** build different API requests  
✅ **Backend detects param** and adds appropriate WHERE clause  
✅ **Single SQL query** handles both scenarios efficiently  
✅ **Frontend renders** results in interactive table format  
✅ **Complete feedback loop** shows results in seconds
