# Chatbot Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Tailwind)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            App.jsx (Main App Component)                 │   │
│  │  ✅ Conditionally renders ChatbotAssistant              │   │
│  │  ✅ Passes authenticated state                           │   │
│  └────────────────┬─────────────────────────────────────────┘   │
│                   │                                              │
│                   ↓                                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │       ChatbotAssistant.jsx (Main Component)             │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │  Header                                            │ │   │
│  │  │  - Title: "Consignment Tracker"                   │ │   │
│  │  │  - Minimize/Maximize toggle                       │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │  Message Area                                      │ │   │
│  │  │  - User messages (right, blue)                    │ │   │
│  │  │  - Bot messages (left, gray)                      │ │   │
│  │  │  - Booking detail cards                           │ │   │
│  │  │  - Loading animations                             │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │  Input Area                                        │ │   │
│  │  │  - Text input field                               │ │   │
│  │  │  - Send button                                    │ │   │
│  │  │  - Quick action buttons (Hi, Help)               │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  └─────┬──────────────────────────────────────────────────────┘   │
│        │                                                          │
│        ↓                                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │      chatbotService.js (API Service Layer)             │   │
│  │  ✅ sendMessage(message)  → POST /api/chatbot/chat     │   │
│  │  ✅ getConsignment(no)    → GET /api/chatbot/:consNo  │   │
│  │  ✅ Handles authentication (token injection)            │   │
│  └─────┬──────────────────────────────────────────────────────┘   │
│        │                                                          │
└────────┼──────────────────────────────────────────────────────────┘
         │
         │  HTTPS
         │  (Bearer Token)
         │
┌────────┼──────────────────────────────────────────────────────────┐
│        ↓                                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           BACKEND (Express.js + Node)                   │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │  API Routes (Express)                              │ │   │
│  │  │  ✅ POST /api/chatbot/chat                         │ │   │
│  │  │  ✅ GET /api/chatbot/:consignmentNo               │ │   │
│  │  │  (Authentication middleware applied)               │ │   │
│  │  └────────┬─────────────────────────────────────────────┘ │   │
│  │           │                                              │   │
│  │           ↓                                              │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │  chatbotController.js (Business Logic)            │ │   │
│  │  │                                                    │ │   │
│  │  │  parseConsignmentNumber()                          │ │   │
│  │  │  - Regex patterns for multiple formats            │ │   │
│  │  │  - Extracts numbers from natural language         │ │   │
│  │  │                                                    │ │   │
│  │  │  isGreeting() / isHelpRequest()                   │ │   │
│  │  │  - Detects user intent                            │ │   │
│  │  │  - Provides contextual responses                  │ │   │
│  │  │                                                    │ │   │
│  │  │  chatWithAssistant()                               │ │   │
│  │  │  - Routes to appropriate handler                  │ │   │
│  │  │  - Queries database for consignments              │ │   │
│  │  │  - Formats response conversationally              │ │   │
│  │  │                                                    │ │   │
│  │  │  formatBookingResponse()                           │ │   │
│  │  │  - Transforms DB row to user-friendly format      │ │   │
│  │  │  - Adds emojis and formatting                     │ │   │
│  │  └────────┬─────────────────────────────────────────────┘ │   │
│  │           │                                              │   │
│  │           ↓                                              │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │  Database Layer                                   │ │   │
│  │  │  ✅ SELECT * FROM bookings WHERE:                 │ │   │
│  │  │     - consignment_number = ? (user input)         │ │   │
│  │  │     - franchise_id = ? (authenticated user)       │ │   │
│  │  │                                                    │ │   │
│  │  │  ✅ Returns booking object with fields:           │ │   │
│  │  │     - consignment_number                           │ │   │
│  │  │     - booking_number                              │ │   │
│  │  │     - sender_name, receiver_name                  │ │   │
│  │  │     - sender_city, receiver_city                  │ │   │
│  │  │     - weight, pieces, service_type                │ │   │
│  │  │     - booking_date, total_amount, paid_amount     │ │   │
│  │  │     - status, payment_status                      │ │   │
│  │  │     - and more...                                 │ │   │
│  │  └────────┬─────────────────────────────────────────────┘ │   │
│  │           │                                              │   │
│  │           ↓                                              │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │  MySQL Database                                   │ │   │
│  │  │  ┌──────────────────────────────────────────────┐ │ │   │
│  │  │  │ bookings table                               │ │ │   │
│  │  │  │ - id (PK)                                    │ │ │   │
│  │  │  │ - franchise_id (FK) → isolation             │ │ │   │
│  │  │  │ - consignment_number (indexed)              │ │ │   │
│  │  │  │ - booking_number (indexed)                  │ │ │   │
│  │  │  │ - sender details (name, phone, address)    │ │ │   │
│  │  │  │ - receiver details (name, phone, address)  │ │ │   │
│  │  │  │ - package details (weight, pieces, type)   │ │ │   │
│  │  │  │ - billing details (amounts, charges)       │ │ │   │
│  │  │  │ - status (booked, in_transit, delivered)   │ │ │   │
│  │  │  │ - payment status (paid, unpaid, partial)   │ │ │   │
│  │  │  │ - timestamps (created_at, updated_at)      │ │ │   │
│  │  │  └──────────────────────────────────────────────┘ │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER INTERACTION                          │
│                    User types in chat input                         │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ↓
         ┌────────────────────────────────────┐
         │  Input Handler (handleSendMessage) │
         │  - Validates input is not empty    │
         │  - Creates user message object     │
         │  - Adds to messages array          │
         │  - Clears input field              │
         │  - Sets loading state              │
         └────────┬─────────────────────────────┘
                  │
                  ↓
         ┌────────────────────────────────────┐
         │  Call chatbotService.sendMessage() │
         │  - Sends POST to /api/chatbot/chat │
         │  - Includes auth token             │
         │  - Shows loading animation         │
         └────────┬─────────────────────────────┘
                  │
         ┌────────┴──────────────────────┐
         │                               │
         ↓ (Network Request)             ↓
    ┌─────────────────────┐      ┌──────────────────┐
    │ Backend Processing  │      │  Loading State   │
    └─────────────────────┘      │  Typing dots     │
         │                        │  Disabled send   │
         ↓                        └──────────────────┘
    ┌─────────────────────────────────────────────┐
    │  chatbotController.chatWithAssistant()      │
    │                                             │
    │  1. Extract message text                    │
    │  2. Validate authentication                 │
    │  3. Check message type:                     │
    │     - isGreeting? → return greeting         │
    │     - isHelpRequest? → return help          │
    │     - Otherwise: continue to parsing        │
    │  4. Parse for consignment number:           │
    │     - Try multiple regex patterns           │
    │     - Extract number if found               │
    │  5. If no number found:                     │
    │     - Return "unclear" response             │
    │  6. If number found:                        │
    │     - Query database for booking            │
    │     - Check franchise_id matches user       │
    │  7. Format response                         │
    │  8. Return to frontend                      │
    └─────┬──────────────────────────────────────┘
          │
          ↓
    ┌─────────────────────────────────┐
    │ Database Query Execution        │
    │ SELECT * FROM bookings WHERE    │
    │   consignment_number = ?        │
    │   AND franchise_id = ?          │
    │                                 │
    │ Results:                        │
    │ - 0 rows: not_found response    │
    │ - 1 row: format and return      │
    │ - >1 row: return first match    │
    └─────┬───────────────────────────┘
          │
    ┌─────┴─────────────────────────────────────┐
    │  formatBookingResponse(booking)           │
    │  - Transform DB fields to display names   │
    │  - Add status emoji                       │
    │  - Format amounts with ₹                  │
    │  - Format dates                           │
    │  - Create formatted message string        │
    └─────┬───────────────────────────────────────┘
          │
          ↓
    ┌──────────────────────────────┐
    │ Return JSON Response         │
    │ {                            │
    │   success: true,             │
    │   data: {                    │
    │     type: 'booking_found',   │
    │     message: "📦 ...",        │
    │     booking: {...}           │
    │   }                          │
    │ }                            │
    └─────┬────────────────────────┘
          │
          ↓ (Response received)
    ┌──────────────────────────────┐
    │  Frontend Handler            │
    │  - Clear loading state       │
    │  - Parse response            │
    │  - Create bot message object │
    │  - Add to messages array     │
    │  - Trigger auto-scroll       │
    └──────┬───────────────────────┘
           │
           ↓
    ┌──────────────────────────────┐
    │  Re-render Component         │
    │  - Show user message         │
    │  - Show bot response         │
    │  - Display booking card      │
    │  - Stop loading animation    │
    │  - Enable send button        │
    └──────┬───────────────────────┘
           │
           ↓
    ┌──────────────────────────────┐
    │  User Sees Result            │
    │  Beautiful booking details   │
    │  in formatted card layout    │
    └──────────────────────────────┘
```

---

## Component Interaction Diagram

```
                    ┌─────────────────┐
                    │   App.jsx       │
                    │ (main entry)    │
                    └────────┬────────┘
                             │
                             ├─ Auth context
                             │
                             ↓
                    ┌─────────────────────┐
                    │ChatbotAssistant.jsx │
                    │   (UI Container)    │
                    └────────┬────────────┘
                             │
                    ┌────────┴──────────┐
                    │                  │
            ┌───────↓──────────┐   ┌───↓────────────────┐
            │ Message Display  │   │ Input Component    │
            │ - User messages  │   │ - Text input       │
            │ - Bot messages   │   │ - Send button      │
            │ - Loading anim   │   │ - Quick buttons    │
            │ - Booking cards  │   │                    │
            └───────┬──────────┘   └───┬────────────────┘
                    │                  │
                    │        ┌─────────┘
                    │        │
                    └────┬───┘
                         │
                    ┌────↓──────────────────┐
                    │chatbotService.jsx     │
                    │ (API calls)           │
                    │ - sendMessage()       │
                    │ - getConsignment()    │
                    │ - Auth header inject  │
                    └────┬──────────────────┘
                         │
                         ↓
                    ┌─────────────────┐
                    │  Backend API    │
                    │ /api/chatbot/*  │
                    └─────┬───────────┘
                          │
                    ┌─────↓────────────┐
                    │   Database       │
                    │   MySQL          │
                    │   bookings table │
                    └──────────────────┘
```

---

## State Management Flow

```
ChatbotAssistant Component State:

┌─────────────────────────────────────────────────────────────┐
│  useState() Hooks                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  messages: Message[]                                        │
│  ├─ Format: { id, text, sender, type, booking? }          │
│  ├─ Initial: [{ greeting message }]                       │
│  └─ Updates: On user input, bot response                  │
│                                                             │
│  inputValue: string                                         │
│  ├─ Format: "user input text"                             │
│  ├─ Initial: ""                                            │
│  └─ Updates: On keystrokes, cleared on send               │
│                                                             │
│  isLoading: boolean                                         │
│  ├─ Format: true/false                                    │
│  ├─ Initial: false                                         │
│  └─ Updates: On send → true, on response → false          │
│                                                             │
│  isMinimized: boolean                                       │
│  ├─ Format: true/false                                    │
│  ├─ Initial: false                                         │
│  └─ Updates: On minimize/maximize click                   │
│                                                             │
│  messageIdRef: useRef(2)                                   │
│  ├─ Purpose: Generate unique message IDs                  │
│  └─ Updates: Incremented for each message                 │
│                                                             │
│  messagesEndRef: useRef(null)                              │
│  ├─ Purpose: Auto-scroll reference                        │
│  └─ Updates: useEffect(() => scrollToBottom())            │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Effects Flow:

┌─────────────────────────────────────────────────────────────┐
│  useEffect(() => scrollToBottom(), [messages])             │
│  - Runs when messages change                               │
│  - Scrolls chat to latest message                          │
│  - Uses smooth scroll behavior                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

```
┌────────────────────────────────────────────────────────────┐
│               User Login (App.jsx)                         │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ↓
        ┌────────────────────────┐
        │  AuthContext           │
        │  - isAuthenticated     │
        │  - user object         │
        │  - token stored        │
        └────────┬───────────────┘
                 │
                 ├─ ChatbotAssistant
                 │  rendered only if
                 │  isAuthenticated
                 │
                 ↓
        ┌────────────────────────┐
        │  API Call from Chat    │
        │  chatbotService.js     │
        └────────┬───────────────┘
                 │
                 ↓
        ┌────────────────────────┐
        │ api.js Interceptor     │
        │ - Gets token from      │
        │   localStorage         │
        │ - Adds to headers:     │
        │   "Authorization:      │
        │    Bearer TOKEN"       │
        └────────┬───────────────┘
                 │
                 ↓
        ┌────────────────────────┐
        │ Backend                │
        │ authenticate           │
        │ middleware             │
        │ - Verifies token       │
        │ - Extracts user data   │
        │ - Sets req.user        │
        └────────┬───────────────┘
                 │
         ┌───────┴────────┐
         │                │
    ✅ Token Valid   ❌ Token Invalid
         │                │
         ↓                ↓
    Continue      Reject (401)
    Processing    Redirect to
                  Login
```

---

## Error Handling Flow

```
┌──────────────────────────────────────┐
│  Frontend Error Scenarios            │
├──────────────────────────────────────┤
│                                      │
│  1. Empty Input                      │
│     → Disabled send button           │
│     → User cannot send               │
│                                      │
│  2. Network Error                    │
│     → Catch in sendMessage()         │
│     → Show: "I'm having trouble..."  │
│     → Chat remains usable            │
│                                      │
│  3. API Returns 401                  │
│     → Interceptor catches            │
│     → Clear auth tokens              │
│     → Redirect to login              │
│                                      │
│  4. API Returns 500                  │
│     → Show generic error message     │
│     → Keep chat history              │
│     → Allow retry                    │
│                                      │
│  5. Booking Not Found                │
│     → API returns success + type     │
│     → Shows user-friendly message    │
│     → Suggests checking number       │
│                                      │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  Backend Error Handling              │
├──────────────────────────────────────┤
│                                      │
│  chatbotController:                  │
│  ├─ Input validation                 │
│  ├─ Auth check (middleware)          │
│  ├─ Database error catching          │
│  ├─ Proper status codes              │
│  └─ Generic error messages           │
│                                      │
│  Global error handler:               │
│  ├─ Logs full error details          │
│  ├─ Returns clean JSON               │
│  ├─ No stack traces to client        │
│  └─ Proper HTTP status codes         │
│                                      │
└──────────────────────────────────────┘
```

---

## Performance Optimization Points

```
┌─────────────────────────────────────┐
│  Frontend Optimizations             │
├─────────────────────────────────────┤
│                                     │
│  ✅ Component memoization (ready)  │
│  ✅ Message history limit (500)    │
│  ✅ Auto-scroll debouncing         │
│  ✅ Loading state efficiency       │
│  ✅ Tailwind CSS optimization      │
│  ✅ No unnecessary re-renders      │
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Backend Optimizations              │
├─────────────────────────────────────┤
│                                     │
│  ✅ Database indexes on:           │
│     - consignment_number           │
│     - franchise_id                 │
│  ✅ Connection pooling             │
│  ✅ Query optimization             │
│  ✅ Response caching (future)      │
│  ✅ Load balancing (future)        │
│                                     │
└─────────────────────────────────────┘
```

---

**This architecture ensures scalability, security, and excellent user experience!**
