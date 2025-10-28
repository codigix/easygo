# Production OpenSSL Fix for Invoice Email PDF Generation

## Problem

```
html-pdf: Unknown Error Auto configuration failed
error:25066067:DSO support routines:DLFCN_LOAD:could not load the shared library
filename(libproviders.so): libproviders.so: cannot open shared object file
```

This error occurs because the `html-pdf` library depends on OpenSSL 3.x libraries that are missing on the production server.

## Solutions (Choose One)

### ✅ Solution 1: Install Missing OpenSSL Libraries (Recommended for Linux)

If your production server is running Linux/Ubuntu:

```bash
# For Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y libssl-dev libssl3

# For CentOS/RHEL
sudo yum install -y openssl-devel

# For Alpine Linux (Docker)
apk add --no-cache openssl-dev
```

Then restart your Node.js application:

```bash
pm2 restart easygo-backend
# or
systemctl restart easygo-backend
```

---

### ✅ Solution 2: Use Docker with Proper Base Image (Best for Containers)

Update your Dockerfile:

```dockerfile
FROM node:18-alpine

# Install OpenSSL development libraries
RUN apk add --no-cache \
    openssl-dev \
    openssl \
    python3 \
    make \
    g++

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "src/server.js"]
```

---

### ✅ Solution 3: Set OpenSSL Configuration (If Already Installed)

If OpenSSL is installed but not properly configured:

```bash
# Find your OpenSSL configuration
export OPENSSL_CONF=/etc/ssl/openssl.cnf

# Or set it in your Node.js application startup
NODE_OPTIONS="--openssl-config=/etc/ssl/openssl.cnf" npm start
```

Add to your systemd service or PM2 config:

**For systemd:**

```ini
[Service]
Environment="NODE_OPTIONS=--openssl-config=/etc/ssl/openssl.cnf"
ExecStart=/usr/bin/node /path/to/src/server.js
```

**For PM2:**

```json
{
  "apps": [
    {
      "name": "easygo-backend",
      "script": "src/server.js",
      "env": {
        "NODE_OPTIONS": "--openssl-config=/etc/ssl/openssl.cnf"
      }
    }
  ]
}
```

---

### ✅ Solution 4: Use Cloud-Based PDF Service (Alternative)

If you prefer not to deal with system dependencies, switch to a cloud service:

**Install Puppeteer alternative:**

```bash
npm install html-pdf-node cheerio
```

Then update the invoice controller to use a cloud service like:

- AWS Lambda
- Cloud PDF API
- PDFTron Cloud
- IronPDF Cloud

---

## Testing the Fix

After applying the fix, test the email endpoint:

```bash
curl -X POST http://your-production-server:5000/api/invoices/9/send-email \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceId": 9,
    "recipientEmail": "test@example.com",
    "subject": "Your Invoice",
    "message": "Please find your invoice attached"
  }'
```

Expected response:

```json
{
  "success": true,
  "message": "Invoice sent successfully to test@example.com",
  "pdfGenerated": true
}
```

---

## What We Fixed in the Code

1. **Improved Error Handling**: PDF generation failures no longer crash the email sending
2. **Fallback to HTML**: If PDF generation fails, email still sends with HTML version
3. **Better Timeouts**: Extended timeout to handle production delays
4. **Graceful Degradation**: Users get their invoice even if PDF attachment fails

---

## Monitoring

Check logs for PDF generation warnings:

```bash
# View recent logs
tail -f /path/to/app/logs/error.log | grep "PDF generation warning"
```

The system will log:

- `PDF generation warning` = PDF failed but email was sent with HTML
- `Email sending error` = Critical error, email failed completely

---

## Emergency Workaround

If you can't fix the libraries immediately, the system will automatically:

1. Send invoice as HTML email (no PDF attachment)
2. Return success with `"pdfGenerated": false`
3. Log the warning for later investigation

This ensures users receive their invoices even during OpenSSL issues!
