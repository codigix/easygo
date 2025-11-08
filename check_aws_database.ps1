# ============================================================
# AWS DATABASE DIAGNOSTIC SCRIPT
# Automatically connects to your AWS RDS and checks schema
# ============================================================

# Color output
function Write-Status($message, $color = "White") {
    Write-Host $message -ForegroundColor $color
}

function Write-Success($message) {
    Write-Host "✅ $message" -ForegroundColor Green
}

function Write-Error-Custom($message) {
    Write-Host "❌ $message" -ForegroundColor Red
}

function Write-Warning-Custom($message) {
    Write-Host "⚠️  $message" -ForegroundColor Yellow
}

Clear-Host
Write-Status "═══════════════════════════════════════════════════════" -Color Cyan
Write-Status "  AWS DATABASE DIAGNOSTIC TOOL" -Color Cyan
Write-Status "═══════════════════════════════════════════════════════" -Color Cyan
Write-Status ""

# Load environment variables
$envFile = "c:\Users\admin\Desktop\easygo\.env"

Write-Status "Reading database credentials from: $envFile"
if (-not (Test-Path $envFile)) {
    Write-Error-Custom "❌ .env file not found at $envFile"
    exit 1
}

Write-Success ".env file found"

# Parse .env file
$envContent = Get-Content $envFile -Raw
$MYSQL_HOST = [regex]::Match($envContent, 'MYSQL_HOST=(.+)').Groups[1].Value.Trim()
$MYSQL_PORT = [regex]::Match($envContent, 'MYSQL_PORT=(.+)').Groups[1].Value.Trim()
$MYSQL_USER = [regex]::Match($envContent, 'MYSQL_USER=(.+)').Groups[1].Value.Trim()
$MYSQL_PASSWORD = [regex]::Match($envContent, 'MYSQL_PASSWORD=(.+)').Groups[1].Value.Trim()
$MYSQL_DATABASE = [regex]::Match($envContent, 'MYSQL_DATABASE=(.+)').Groups[1].Value.Trim()

Write-Status ""
Write-Status "Database Configuration:" -Color Cyan
Write-Status "  Host: $MYSQL_HOST"
Write-Status "  Port: $MYSQL_PORT"
Write-Status "  User: $MYSQL_USER"
Write-Status "  Database: $MYSQL_DATABASE"
Write-Status ""

# Check if MySQL client is available
Write-Status "Checking for MySQL client..."
$mysqlPath = Get-Command mysql.exe -ErrorAction SilentlyContinue

if (-not $mysqlPath) {
    Write-Warning-Custom "MySQL command-line client not found in PATH"
    Write-Status "Trying alternative location..."
    
    # Common MySQL installation paths
    $possiblePaths = @(
        "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
        "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe",
        "C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysql.exe",
        "C:\Tools\mysql\bin\mysql.exe"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $mysqlPath = $path
            Write-Success "Found MySQL at: $path"
            break
        }
    }
    
    if (-not $mysqlPath) {
        Write-Error-Custom "MySQL client not found!"
        Write-Status ""
        Write-Status "Please install MySQL client or add it to PATH"
        Write-Status ""
        Write-Status "Alternative: Use your database GUI client manually and run:"
        Write-Status "  AWS_DATABASE_DIAGNOSTIC.sql"
        exit 1
    }
}

Write-Success "MySQL client found"
Write-Status ""

# Create SQL commands
$sqlCommands = @"
-- STEP 1: Table Structure Check
SELECT '=== BOOKINGS TABLE STRUCTURE ===' as info;
DESC bookings;

-- STEP 2: Rate Master Structure
SELECT '=== RATE MASTER TABLE STRUCTURE ===' as info;
DESC rate_master;

-- STEP 3: Record Count
SELECT '=== RECORD COUNTS ===' as info;
SELECT 
  'bookings' as table_name,
  COUNT(*) as count
FROM bookings
UNION ALL
SELECT 'rate_master', COUNT(*) FROM rate_master
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices;

-- STEP 4: Sample Data
SELECT '=== SAMPLE BOOKING ===' as info;
SELECT * FROM bookings LIMIT 1;

SELECT '=== SAMPLE RATE MASTER ===' as info;
SELECT * FROM rate_master LIMIT 1;

-- STEP 5: Column Check
SELECT '=== BOOKINGS COLUMNS ===' as info;
SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'bookings' AND TABLE_SCHEMA = 'frbilling'
ORDER BY ORDINAL_POSITION;

SELECT '=== RATE MASTER COLUMNS ===' as info;
SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'rate_master' AND TABLE_SCHEMA = 'frbilling'
ORDER BY ORDINAL_POSITION;

-- STEP 6: Check Critical Fields
SELECT '=== CRITICAL FIELD CHECK ===' as info;
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'bookings' AND TABLE_SCHEMA = 'frbilling'
AND COLUMN_NAME IN ('customer_id', 'receiver', 'mode', 'char_wt', 'qty', 'type', 'amount', 'tax_amount', 'fuel_amount', 'invoice_id');
"@

# Save SQL to temporary file
$tempSqlFile = "c:\Users\admin\Desktop\easygo\temp_diagnostic.sql"
$sqlCommands | Out-File -FilePath $tempSqlFile -Encoding UTF8

Write-Status "Connecting to AWS Database..."
Write-Status ""

# Try to connect and run query
try {
    $outputFile = "c:\Users\admin\Desktop\easygo\aws_database_report.txt"
    
    # Build MySQL command
    $mysqlCommand = "mysql.exe"
    $mysqlArgs = @(
        "-h", $MYSQL_HOST,
        "-P", $MYSQL_PORT,
        "-u", $MYSQL_USER,
        "-p$MYSQL_PASSWORD",
        $MYSQL_DATABASE,
        "<", $tempSqlFile
    )
    
    Write-Status "Running diagnostic queries..."
    
    # Execute MySQL command
    & $mysqlCommand @mysqlArgs > $outputFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database diagnostic completed!"
        Write-Status ""
        Write-Status "Report saved to: $outputFile"
        Write-Status ""
        Write-Status "Opening report in text editor..."
        notepad $outputFile
    } else {
        Write-Error-Custom "Failed to connect to database"
        Write-Status "Exit code: $LASTEXITCODE"
        Write-Status ""
        Write-Status "Troubleshooting:"
        Write-Status "1. Check AWS RDS security group allows MySQL (3306)"
        Write-Status "2. Check credentials in .env file"
        Write-Status "3. Verify MySQL is installed and in PATH"
    }
} catch {
    Write-Error-Custom "Error: $_"
    Write-Status ""
    Write-Status "Fallback option:"
    Write-Status "1. Open MySQL Workbench"
    Write-Status "2. Connect to: $MYSQL_HOST`:$MYSQL_PORT"
    Write-Status "3. Use database: $MYSQL_DATABASE"
    Write-Status "4. Run: AWS_DATABASE_DIAGNOSTIC.sql"
}

# Clean up temp file
if (Test-Path $tempSqlFile) {
    Remove-Item $tempSqlFile -ErrorAction SilentlyContinue
}

Write-Status ""
Write-Status "═══════════════════════════════════════════════════════" -Color Cyan
Write-Status "Diagnostic Complete" -Color Cyan
Write-Status "═══════════════════════════════════════════════════════" -Color Cyan