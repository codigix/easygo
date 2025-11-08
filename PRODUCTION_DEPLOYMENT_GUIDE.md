# EasyGo - Production Deployment Guide

**Last Updated**: November 8, 2025  
**Status**: Ready for Deployment

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Troubleshooting](#troubleshooting)
8. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Pre-Deployment Checklist

### Infrastructure Requirements
- [ ] Production server (Linux/Windows with Node.js 18+)
- [ ] MySQL 5.7+ database server (AWS RDS or local)
- [ ] NGINX or Apache for reverse proxy
- [ ] SSL certificate (Let's Encrypt or commercial)
- [ ] Backup solution configured
- [ ] Monitoring tools set up
- [ ] Domain name configured

### Code & Dependencies
- [ ] All code reviewed and tested
- [ ] No hardcoded credentials remaining
- [ ] Dependencies updated and audited
- [ ] Environment variables documented
- [ ] Database migrations tested locally
- [ ] API endpoints tested
- [ ] Frontend build tested
- [ ] Error handling verified

### Security
- [ ] JWT secret generated and secured
- [ ] Database credentials secured (not in git)
- [ ] API keys secured
- [ ] CORS properly configured
- [ ] HTTPS enforced
- [ ] Rate limiting configured
- [ ] Input validation verified
- [ ] SQL injection prevention verified

---

## Environment Configuration

### Backend (.env for Production)

Create `.env` file in the project root with the following content:

```bash
# ============================================
# PRODUCTION ENVIRONMENT VARIABLES
# ============================================

# Node Environment
NODE_ENV=production
PORT=5000

# ============================================
# DATABASE CONFIGURATION
# ============================================
# Use production database credentials
MYSQL_HOST=your-production-db-host.rds.amazonaws.com
MYSQL_PORT=3306
MYSQL_USER=admin
MYSQL_PASSWORD=your_very_strong_password_here_min_16_chars
MYSQL_DATABASE=frbilling_prod

# ============================================
# JWT CONFIGURATION
# ============================================
# Generate a strong random key: openssl rand -base64 32
JWT_SECRET=your_very_long_random_secret_key_minimum_32_characters
JWT_EXPIRATION=7d

# ============================================
# CORS CONFIGURATION
# ============================================
# Set to your production domain
CORS_ORIGIN=https://easygo.yourdomain.com

# ============================================
# SMTP EMAIL CONFIGURATION
# ============================================
# Using Gmail or your SMTP provider
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your_app_specific_password

# Alternative: Using AWS SES
# SMTP_HOST=email-smtp.us-east-1.amazonaws.com
# SMTP_PORT=587
# SMTP_EMAIL=verified-email@yourdomain.com
# SMTP_PASSWORD=your_ses_password

# ============================================
# APPLICATION CONFIGURATION
# ============================================
# Optional: Add more configuration as needed
APP_NAME=EasyGo
APP_URL=https://easygo.yourdomain.com
LOG_LEVEL=info
```

### Frontend (.env.production)

Create or update `frontend/.env.production`:

```bash
# Production API URL - MUST use HTTPS
VITE_API_URL=https://api.easygo.yourdomain.com/api
```

### Environment Variable Security

**DO NOT commit .env files to git!**

```bash
# Add to .gitignore if not already there
echo ".env" >> .gitignore
echo ".env.production" >> .gitignore
echo ".env.local" >> .gitignore
```

---

## Database Setup

### Step 1: Create Production Database

```sql
-- Connect to your production MySQL server
-- Create database
CREATE DATABASE frbilling_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user with appropriate permissions
CREATE USER 'admin'@'%' IDENTIFIED BY 'your_very_strong_password_here';
GRANT ALL PRIVILEGES ON frbilling_prod.* TO 'admin'@'%';
FLUSH PRIVILEGES;
```

### Step 2: Run Migrations

```bash
# In backend directory
cd backend

# Install dependencies
npm install

# Run migrations
npm run migrate

# Verify migrations
mysql -h your-host -u admin -p -D frbilling_prod -e "SELECT * FROM knex_migrations ORDER BY batch DESC LIMIT 5;"
```

### Step 3: Verify Database Structure

```bash
# Check tables
mysql -h your-host -u admin -p -D frbilling_prod -e "SHOW TABLES;"

# Check key tables
mysql -h your-host -u admin -p -D frbilling_prod -e "DESCRIBE bookings;" | head -20
mysql -h your-host -u admin -p -D frbilling_prod -e "DESCRIBE invoices;" | head -20
mysql -h your-host -u admin -p -D frbilling_prod -e "DESCRIBE users;" | head -20
```

### Step 4: Create Initial Admin User

```bash
# Create a script to add admin user (run from backend directory)
node scripts/create_admin_user.js
```

Create `backend/scripts/create_admin_user.js`:

```javascript
import mysql from "mysql2/promise";
import bcryptjs from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function createAdminUser() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });

  try {
    // First, create a default franchise if it doesn't exist
    const [franchises] = await conn.query("SELECT id FROM franchises LIMIT 1");
    
    let franchiseId = 1;
    if (franchises.length === 0) {
      const [result] = await conn.query(
        "INSERT INTO franchises (franchise_code, franchise_name, owner_name, email, phone, status) VALUES (?, ?, ?, ?, ?, ?)",
        ["HEAD_OFFICE", "Main Office", "Administrator", "admin@easygo.com", "9999999999", "active"]
      );
      franchiseId = result.insertId;
      console.log("✅ Created default franchise:", franchiseId);
    }

    // Create admin user
    const hashedPassword = await bcryptjs.hash("password123", 10);
    
    await conn.query(
      "INSERT INTO users (franchise_id, username, email, password, full_name, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [franchiseId, "admin", "admin@easygo.com", hashedPassword, "Administrator", "admin", "active"]
    );

    console.log("✅ Admin user created successfully");
    console.log("Username: admin");
    console.log("Password: password123");
    console.log("⚠️  IMPORTANT: Change password after first login!");

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await conn.end();
  }
}

createAdminUser();
```

---

## Backend Deployment

### Step 1: Install Dependencies

```bash
cd backend
npm install --production
```

### Step 2: Generate SSL Certificate (if using HTTPS)

```bash
# Using Let's Encrypt with Certbot
sudo certbot certonly --standalone -d api.easygo.yourdomain.com

# Certificates will be in /etc/letsencrypt/live/api.easygo.yourdomain.com/
```

### Step 3: Set Up Systemd Service (Linux)

Create `/etc/systemd/system/easygo-backend.service`:

```ini
[Unit]
Description=EasyGo Backend API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/easygo/backend
EnvironmentFile=/var/www/easygo/backend/.env
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=easygo-backend

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable easygo-backend
sudo systemctl start easygo-backend
sudo systemctl status easygo-backend
```

### Step 4: Configure NGINX Reverse Proxy

Create `/etc/nginx/sites-available/easygo-api`:

```nginx
upstream easygo_backend {
    server 127.0.0.1:5000;
}

server {
    listen 80;
    server_name api.easygo.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.easygo.yourdomain.com;

    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/api.easygo.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.easygo.yourdomain.com/privkey.pem;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/easygo-api-access.log;
    error_log /var/log/nginx/easygo-api-error.log;

    # Proxy settings
    location / {
        proxy_pass http://easygo_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files
    location /uploads {
        alias /var/www/easygo/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/easygo-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Frontend Deployment

### Step 1: Build Frontend

```bash
cd frontend
npm install --production
npm run build
```

### Step 2: Configure NGINX for Frontend

Create `/etc/nginx/sites-available/easygo-frontend`:

```nginx
server {
    listen 80;
    server_name easygo.yourdomain.com;
    
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name easygo.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/easygo.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/easygo.yourdomain.com/privkey.pem;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    access_log /var/log/nginx/easygo-frontend-access.log;
    error_log /var/log/nginx/easygo-frontend-error.log;

    root /var/www/easygo/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/easygo-frontend /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

---

## Post-Deployment Verification

### Test Backend API

```bash
# Test login endpoint
curl -X POST https://api.easygo.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'

# Expected response:
# {"success":true,"message":"Login successful","data":{"token":"...","user":{...}}}
```

### Test Frontend

```bash
# Open in browser
https://easygo.yourdomain.com

# Test login with admin/password123
# Navigate through application
```

### Database Connectivity Test

```bash
# Check if migrations are applied
curl -X GET https://api.easygo.yourdomain.com/api/bookings \
  -H "Authorization: Bearer <your_jwt_token>"
```

### Check Logs

```bash
# Backend logs
sudo journalctl -u easygo-backend -f

# NGINX logs
tail -f /var/log/nginx/easygo-api-error.log
tail -f /var/log/nginx/easygo-frontend-access.log

# MySQL logs (if local)
tail -f /var/log/mysql/error.log
```

---

## Troubleshooting

### Issue: Database Connection Failed

**Solution:**
```bash
# Verify MySQL connectivity
mysql -h your-host -u admin -p -D frbilling_prod -e "SELECT 1;"

# Check firewall rules
sudo ufw allow 3306  # if using ufw

# Verify credentials in .env
grep MYSQL_ .env
```

### Issue: Backend Service Not Starting

**Solution:**
```bash
# Check service status
sudo systemctl status easygo-backend

# View detailed error logs
sudo journalctl -u easygo-backend -n 50

# Check if port 5000 is already in use
sudo lsof -i :5000

# Verify Node.js version
node --version  # Should be 18+
```

### Issue: Frontend Shows Blank Page

**Solution:**
```bash
# Check build output
ls -la frontend/dist/

# Verify VITE_API_URL in .env.production
cat frontend/.env.production

# Check NGINX configuration
sudo nginx -t

# Check browser console for errors (F12)
```

### Issue: CORS Errors

**Solution:**
```bash
# Update CORS_ORIGIN in .env
CORS_ORIGIN=https://easygo.yourdomain.com

# Restart backend
sudo systemctl restart easygo-backend

# Check API response headers
curl -i https://api.easygo.yourdomain.com/api/auth/login
```

### Issue: Email Not Sending

**Solution:**
```bash
# Verify SMTP configuration
grep SMTP_ .env

# Test SMTP connection
telnet smtp.gmail.com 587

# For Gmail: Use App Passwords (not regular password)
# For AWS SES: Verify sender email address

# Check application logs for email errors
sudo journalctl -u easygo-backend | grep -i email
```

---

## Monitoring & Maintenance

### Daily Checks

```bash
# Check service status
sudo systemctl status easygo-backend

# Monitor disk space
df -h

# Check database size
mysql -h your-host -u admin -p -e "SELECT table_name, round(((data_length + index_length) / 1024 / 1024), 2) AS size_mb FROM information_schema.TABLES WHERE table_schema = 'frbilling_prod' ORDER BY size_mb DESC;"

# Check error logs
tail -20 /var/log/nginx/easygo-api-error.log
```

### Weekly Tasks

```bash
# Database backup
mysqldump -h your-host -u admin -p frbilling_prod > backup_$(date +%Y%m%d).sql

# Check SSL certificate expiry
sudo certbot certificates

# Review application logs for errors
sudo journalctl -u easygo-backend --since "1 week ago" | grep ERROR
```

### Monthly Tasks

```bash
# SSL certificate renewal (automatic with certbot)
sudo certbot renew --dry-run

# Update dependencies
cd backend && npm update
cd frontend && npm update

# Database optimization
mysql -h your-host -u admin -p frbilling_prod -e "OPTIMIZE TABLE franchises, users, bookings, invoices, payments;"
```

### Backup Strategy

```bash
# Daily database backup
0 2 * * * mysqldump -h localhost -u admin -p'password' frbilling_prod | gzip > /backups/frbilling_prod_$(date +\%Y\%m\%d).sql.gz

# Upload to cloud storage (AWS S3)
0 3 * * * aws s3 cp /backups/frbilling_prod_$(date +\%Y\%m\%d).sql.gz s3://your-backup-bucket/easygo/
```

### Performance Monitoring

```bash
# Monitor system resources
watch -n 1 'free -h; echo "---"; df -h; echo "---"; ps aux | grep node'

# Monitor NGINX
watch -n 1 'netstat -an | grep :443 | grep -c ESTABLISHED'

# Database connections
mysql -h your-host -u admin -p -e "SHOW PROCESSLIST;"
```

---

## Rollback Procedure

If deployment fails:

```bash
# Stop backend
sudo systemctl stop easygo-backend

# Restore previous version from git
git checkout previous_version_tag

# Revert database migrations (if needed)
npm run migrate:rollback

# Restart
sudo systemctl start easygo-backend

# Verify
sudo systemctl status easygo-backend
```

---

## Success Indicators

✅ All these should be true after successful deployment:

1. Backend API responds to requests with HTTPS
2. Frontend loads without errors
3. Login with admin/password123 works
4. Can create a booking successfully
5. Can generate invoice from booking
6. Email notifications send (if configured)
7. Database backups run automatically
8. Logs show no errors
9. SSL certificate is valid
10. Application scales with load

---

## Support & Contact

For deployment issues:
1. Check logs: `sudo journalctl -u easygo-backend -f`
2. Review this guide
3. Contact: support@easygo.com

---

**Last Updated**: 2025-11-08  
**Version**: 1.0  
**Status**: Production Ready  
