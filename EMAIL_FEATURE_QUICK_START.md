# 📧 Email Feature - Quick Start Guide

## 🚀 30-Second Setup

### 1. Backend Dependencies

```bash
cd backend
npm install nodemailer  # ✅ Already done
```

### 2. Verify .env Configuration

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
```

### 3. Start Backend

```bash
npm run dev
# You should see: ✅ Email transporter initialized
```

### 4. Start Frontend

```bash
cd frontend
npm run dev
```

---

## 💡 Using the Feature

### **Option 1: Generate Invoice & Send Email**

```
1. Go to: http://localhost:3000/invoices/generate
2. Enter Customer ID
3. Select Period From & Period To dates
4. Click "Show" button → Bookings appear
5. Click "Generate" button → Invoice created
6. Click "Send Invoice From Email" button → Modal opens
7. Review/modify email details
8. Click "Send Invoice" button
9. ✅ "Invoice sent successfully!" message
10. Check your inbox for the PDF
```

### **Option 2: Send from Invoice List**

```
1. Go to: http://localhost:3000/invoices/view
2. Click "Submit" to load invoices (or use filters)
3. Find any invoice in the table
4. Click purple "Email" button (with envelope icon)
5. Modal opens with invoice details
6. Enter recipient email (or use pre-filled)
7. Click "Send Invoice" button
8. ✅ Email sent with PDF attachment
```

---

## ✅ What to Expect

### Email Content

- **Subject:** "Invoice {NUMBER} from {COMPANY}"
- **Body:** Professional HTML with invoice details
- **Attachment:** PDF file (example: `Invoice-INV-2025-0001.pdf`)
- **Sent From:** Email configured in SMTP_EMAIL

### Modal Features

- ✓ Pre-fills customer email from database
- ✓ Auto-fills subject with invoice number
- ✓ Provides default message template
- ✓ Shows loading spinner while sending
- ✓ Auto-closes on success
- ✓ Shows error messages if any

---

## 🧪 Test Scenarios

### Scenario 1: Happy Path

```
✓ Generate invoice successfully
✓ Customer email pre-filled
✓ Send email successfully
✓ PDF received in inbox
```

### Scenario 2: Custom Email

```
✓ Change recipient email to different address
✓ Modify subject line
✓ Add custom message
✓ Send successfully
✓ Verify all changes in received email
```

### Scenario 3: Error Handling

```
✓ Try sending with empty email → Error message
✓ Try sending with invalid email → Error message
✓ Check modal validation before sending
```

### Scenario 4: Multiple Invoices

```
✓ Generate first invoice → Send email
✓ Generate second invoice → Send email
✓ Send from invoice list → All work independently
✓ No conflicts between invoices
```

---

## 🔍 How to Verify Success

### ✅ Backend

```
Check terminal output:
1. "✅ Email transporter initialized" → On startup
2. Request logs → On sending emails
3. No error messages → All successful
```

### ✅ Frontend

```
1. Modal appears when clicking email button
2. Form fields are pre-filled
3. Success message shows
4. Modal closes automatically
5. No console errors
```

### ✅ Email

```
1. Email received in inbox
2. Subject line correct
3. Body shows invoice details
4. PDF attached with correct filename
5. PDF opens correctly
```

---

## 📊 File Structure

```
backend/
├── src/
│   ├── config/
│   │   └── email.js                    ✅ NEW
│   ├── controllers/
│   │   └── invoiceController.js        ✅ UPDATED
│   ├── routes/
│   │   └── invoiceRoutes.js           ✅ UPDATED
│   └── server.js                       ✅ UPDATED
└── package.json                        ✅ UPDATED

frontend/
└── src/
    ├── components/
    │   └── EmailModal.jsx              ✅ NEW
    └── pages/
        ├── GenerateInvoicePage.jsx     ✅ UPDATED
        └── ViewInvoicePage.jsx         ✅ UPDATED
```

---

## 🐛 Quick Troubleshooting

| Problem                        | Fix                                        |
| ------------------------------ | ------------------------------------------ |
| "Email service not configured" | Check SMTP env vars in .env                |
| Email won't send               | Verify SMTP credentials are correct        |
| Modal won't open               | Clear browser cache, refresh page          |
| PDF not attached               | Check backend logs for errors              |
| No email received              | Check spam folder, verify email is correct |

---

## 🎯 Key Components

### EmailModal.jsx

- Professional modal interface
- Email validation
- Loading states
- Success/error messages
- Pre-filled fields

### Backend: sendInvoiceEmail()

- Fetches invoice data
- Generates PDF
- Sends email with attachment
- Returns success message

### Frontend Integration

- GenerateInvoicePage: Send after creating invoice
- ViewInvoicePage: Send from invoice list

---

## 💬 Common Errors & Solutions

### "Please enter recipient email"

**Cause:** Email field is empty
**Fix:** Enter a valid email address

### "Please enter a valid email address"

**Cause:** Email format is incorrect
**Fix:** Use format: name@domain.com

### "Failed to send invoice email"

**Cause:** SMTP credentials wrong or server issue
**Fix:**

1. Check .env file SMTP settings
2. Restart backend server
3. Check Gmail app password (16 chars, no spaces)

### "Invoice not found"

**Cause:** Invoice ID doesn't match franchise
**Fix:** Make sure you're using correct invoice ID

---

## 🔐 Security Checklist

- [x] Authentication required (JWT token)
- [x] Only franchise owner can send their invoices
- [x] Email validation before sending
- [x] SMTP credentials in environment variables
- [x] No sensitive data in code
- [x] Proper error handling

---

## 📱 Browser Compatibility

- ✅ Chrome / Edge (Latest)
- ✅ Firefox (Latest)
- ✅ Safari (Latest)
- ✅ Mobile browsers

---

## 🎓 Learning Resources

1. **Nodemailer Docs:** https://nodemailer.com/
2. **Express Email Routes:** Backend email endpoint patterns
3. **React Modal Patterns:** Modal component best practices
4. **PDF Generation:** Invoice template system

---

## 📞 Quick Links

- **Generate Invoice:** http://localhost:3000/invoices/generate
- **View Invoices:** http://localhost:3000/invoices/view
- **Backend Status:** http://localhost:5000/api/invoices
- **Email Config:** `.env` file in project root

---

## ✨ Features Highlight

🎯 **For Users:**

- One-click invoice email sending
- Professional email templates
- PDF attachments included
- Customizable subject and message

🔧 **For Developers:**

- Clean, modular code structure
- Proper error handling
- Security-first approach
- Easy to extend and maintain

📊 **For Business:**

- Improved customer experience
- Faster invoice delivery
- Professional branding
- Audit trail ready

---

## 🎉 You're All Set!

Everything is implemented and ready to use. Just verify the SMTP credentials in your `.env` file and you're good to go! 🚀

**Test now:**

1. Generate an invoice
2. Click "Send Invoice From Email"
3. Send to your email
4. Check inbox
5. See the professional PDF invoice! 📧✅
