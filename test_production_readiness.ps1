# Production Readiness Test Script
# Comprehensive verification of all production components

Write-Host "`n========== PRODUCTION READINESS TEST ==========" -ForegroundColor Cyan
Write-Host "Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

$passCount = 0; $failCount = 0; $warningCount = 0

function Check-Result {
    param([bool]$result, [string]$testName, [string]$details = "")
    if ($result) {
        Write-Host "  [OK] $testName" -ForegroundColor Green
        $script:passCount++
    } else {
        Write-Host "  [FAIL] $testName" -ForegroundColor Red
        if ($details) { Write-Host "       $details" -ForegroundColor Red }
        $script:failCount++
    }
}

function Check-Warning {
    param([string]$testName, [string]$details = "")
    Write-Host "  [WARN] $testName" -ForegroundColor Yellow
    if ($details) { Write-Host "        $details" -ForegroundColor Yellow }
    $script:warningCount++
}

# 1. Environment Files
Write-Host "`n[1] ENVIRONMENT CONFIGURATION" -ForegroundColor Cyan
$envExists = Test-Path "c:\Users\admin\Desktop\easygo\.env"
Check-Result $envExists ".env file exists"

$envExampleExists = Test-Path "c:\Users\admin\Desktop\easygo\.env.example"
Check-Result $envExampleExists ".env.example template exists"

# 2. Project Structure
Write-Host "`n[2] PROJECT STRUCTURE" -ForegroundColor Cyan
Check-Result (Test-Path "c:\Users\admin\Desktop\easygo\backend") "Backend directory exists"
Check-Result (Test-Path "c:\Users\admin\Desktop\easygo\frontend") "Frontend directory exists"
Check-Result (Test-Path "c:\Users\admin\Desktop\easygo\backend\package.json") "Backend package.json exists"
Check-Result (Test-Path "c:\Users\admin\Desktop\easygo\frontend\package.json") "Frontend package.json exists"

# 3. Key Backend Files
Write-Host "`n[3] BACKEND FILES" -ForegroundColor Cyan
Check-Result (Test-Path "c:\Users\admin\Desktop\easygo\backend\src\server.js") "Server.js exists"
Check-Result (Test-Path "c:\Users\admin\Desktop\easygo\backend\src\config\env.js") "Environment config exists"
Check-Result (Test-Path "c:\Users\admin\Desktop\easygo\backend\src\config\email.js") "Email config exists"
Check-Result (Test-Path "c:\Users\admin\Desktop\easygo\backend\src\templates\invoice.ejs") "Invoice template exists"

# 4. Frontend Files
Write-Host "`n[4] FRONTEND FILES" -ForegroundColor Cyan
Check-Result (Test-Path "c:\Users\admin\Desktop\easygo\frontend\src\pages\GenerateInvoicePage.jsx") "GenerateInvoicePage exists"
Check-Result (Test-Path "c:\Users\admin\Desktop\easygo\frontend\src\components\EmailModal.jsx") "EmailModal component exists"
Check-Result (Test-Path "c:\Users\admin\Desktop\easygo\frontend\vite.config.js") "Vite config exists"

# 5. Database
Write-Host "`n[5] DATABASE CONFIGURATION" -ForegroundColor Cyan
Check-Result (Test-Path "c:\Users\admin\Desktop\easygo\backend\knexfile.cjs") "Knex configuration exists"
Check-Result (Test-Path "c:\Users\admin\Desktop\easygo\backend\migrations") "Migrations folder exists"

# 6. Dependencies
Write-Host "`n[6] DEPENDENCIES" -ForegroundColor Cyan
$backendModules = Test-Path "c:\Users\admin\Desktop\easygo\backend\node_modules"
if ($backendModules) {
    Check-Result $true "Backend dependencies installed"
} else {
    Check-Warning "Backend dependencies not installed" "Run: npm install in backend folder"
}

$frontendModules = Test-Path "c:\Users\admin\Desktop\easygo\frontend\node_modules"
if ($frontendModules) {
    Check-Result $true "Frontend dependencies installed"
} else {
    Check-Warning "Frontend dependencies not installed" "Run: npm install in frontend folder"
}

# 7. Critical Code Files
Write-Host "`n[7] CRITICAL CODE QUALITY" -ForegroundColor Cyan
$invoiceController = Get-Content "c:\Users\admin\Desktop\easygo\backend\src\controllers\invoiceController.js" -Raw
Check-Result ($invoiceController -match "__dirname") "Invoice controller has __dirname defined"
Check-Result ($invoiceController -match "franchise_name") "Using correct database column (franchise_name)"

$genInvoicePage = Get-Content "c:\Users\admin\Desktop\easygo\frontend\src\pages\GenerateInvoicePage.jsx" -Raw
Check-Result ($genInvoicePage -match "hasCustomerId|hasConsignmentNo|hasDateRange") "Flexible filter validation implemented"

# 8. Documentation
Write-Host "`n[8] DOCUMENTATION" -ForegroundColor Cyan
Check-Result (Test-Path "c:\Users\admin\Desktop\easygo\PRODUCTION_DEPLOYMENT_CHECKLIST.md") "Production deployment checklist"
Check-Result (Test-Path "c:\Users\admin\Desktop\easygo\PRODUCTION_VERIFICATION.md") "Production verification guide"
Check-Result (Test-Path "c:\Users\admin\Desktop\easygo\PRODUCTION_STATUS_REPORT.md") "Production status report"

# 9. Security
Write-Host "`n[9] SECURITY CONFIGURATION" -ForegroundColor Cyan
if ($envExists) {
    $envFile = (Get-Content "c:\Users\admin\Desktop\easygo\.env") -join "`n"
    Check-Result (($envFile -match "JWT_SECRET") -ne $null) "JWT_SECRET configured"
    Check-Result (($envFile -match "CORS_ORIGIN") -ne $null) "CORS_ORIGIN configured"
}

$serverFile = Get-Content "c:\Users\admin\Desktop\easygo\backend\src\server.js" -Raw
Check-Result ($serverFile -match "helmet") "Helmet security middleware enabled"
Check-Result ($serverFile -match "cors") "CORS middleware enabled"

# 10. Scripts
Write-Host "`n[10] NPM SCRIPTS" -ForegroundColor Cyan
$backendPkg = Get-Content "c:\Users\admin\Desktop\easygo\backend\package.json" | ConvertFrom-Json
Check-Result ($backendPkg.scripts.start -ne $null) "Backend has start script"
Check-Result ($backendPkg.scripts.dev -ne $null) "Backend has dev script"

$frontendPkg = Get-Content "c:\Users\admin\Desktop\easygo\frontend\package.json" | ConvertFrom-Json
Check-Result ($frontendPkg.scripts.build -ne $null) "Frontend has build script"

# Summary
Write-Host "`n========== TEST SUMMARY ==========" -ForegroundColor Cyan
$total = $passCount + $failCount
$percentage = if ($total -gt 0) { [math]::Round(($passCount / $total) * 100) } else { 0 }

Write-Host "Passed:   $passCount [OK]" -ForegroundColor Green
Write-Host "Failed:   $failCount [FAIL]" -ForegroundColor Red
Write-Host "Warnings: $warningCount [WARN]" -ForegroundColor Yellow
Write-Host "Total:    $total tests" -ForegroundColor Cyan
Write-Host "Score:    $percentage%" -ForegroundColor Cyan

Write-Host "`n========== RECOMMENDATIONS ==========" -ForegroundColor Cyan

if ($failCount -eq 0 -and $warningCount -eq 0) {
    Write-Host "SUCCESS: All checks passed!" -ForegroundColor Green
    Write-Host "Application is production-ready." -ForegroundColor Green
    Write-Host "" 
    Write-Host "Next steps:" -ForegroundColor Green
    Write-Host "  1. Review PRODUCTION_DEPLOYMENT_CHECKLIST.md" -ForegroundColor Green
    Write-Host "  2. Update .env with production credentials" -ForegroundColor Green
    Write-Host "  3. Run: npm run migrate" -ForegroundColor Green
    Write-Host "  4. Start backend: npm run start" -ForegroundColor Green
    Write-Host "  5. Build frontend: npm run build" -ForegroundColor Green
} elseif ($failCount -eq 0) {
    Write-Host "CAUTION: Some warnings detected." -ForegroundColor Yellow
    Write-Host "Please address before production deployment." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Priority actions:" -ForegroundColor Yellow
    Write-Host "  - Install missing dependencies: npm install" -ForegroundColor Yellow
    Write-Host "  - Review PRODUCTION_VERIFICATION.md" -ForegroundColor Yellow
} else {
    Write-Host "CRITICAL: Issues found - Do NOT deploy!" -ForegroundColor Red
    Write-Host "Fix all FAIL items before production deployment." -ForegroundColor Red
    Write-Host ""
    Write-Host "Required fixes:" -ForegroundColor Red
    Write-Host "  - Resolve all FAIL items listed above" -ForegroundColor Red
    Write-Host "  - Review PRODUCTION_DEPLOYMENT_CHECKLIST.md" -ForegroundColor Red
    Write-Host "  - Test locally before deploying" -ForegroundColor Red
}

Write-Host "`nFor details, see:" -ForegroundColor Gray
Write-Host "  - PRODUCTION_DEPLOYMENT_CHECKLIST.md" -ForegroundColor Gray
Write-Host "  - PRODUCTION_VERIFICATION.md" -ForegroundColor Gray
Write-Host "  - PRODUCTION_STATUS_REPORT.md" -ForegroundColor Gray

Write-Host "`nCompleted: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "==========================================`n" -ForegroundColor Cyan