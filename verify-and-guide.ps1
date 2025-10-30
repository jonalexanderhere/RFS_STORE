# ============================================
# VERIFY FIX & GUIDE USER - Complete CLI Tool
# ============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RFS STORE - VERIFICATION & GUIDE TOOL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Load environment
$envContent = Get-Content .env -Raw
$SUPABASE_URL = if ($envContent -match 'VITE_SUPABASE_URL=(.+)') { $matches[1].Trim() }
$SUPABASE_ANON_KEY = if ($envContent -match 'VITE_SUPABASE_ANON_KEY=(.+)') { 
    $matches[1].Trim() -replace '"','' -replace "'",''
}

if (-not $SUPABASE_URL -or -not $SUPABASE_ANON_KEY) {
    Write-Host "[ERROR] Cannot read Supabase credentials" -ForegroundColor Red
    exit 1
}

$projectId = if ($SUPABASE_URL -match 'https://([^.]+)\.supabase\.co') { $matches[1] }

Write-Host "[OK] Supabase URL: $SUPABASE_URL" -ForegroundColor Green
Write-Host "[OK] Project ID: $projectId" -ForegroundColor Green
Write-Host ""

# Prepare headers
$headers = @{
    "apikey" = $SUPABASE_ANON_KEY
    "Authorization" = "Bearer $SUPABASE_ANON_KEY"
    "Content-Type" = "application/json"
}

# Check 1: Test basic API connection
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "STEP 1: Testing API Connection" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

try {
    $testUrl = "$SUPABASE_URL/rest/v1/"
    $response = Invoke-WebRequest -Uri $testUrl -Method HEAD -Headers $headers -ErrorAction Stop
    Write-Host "[OK] API Connection successful" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] API Connection failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""

# Check 2: Verify if fix has been applied
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "STEP 2: Checking Fix Status" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

try {
    # Try to query services (public table)
    $servicesUrl = "$SUPABASE_URL/rest/v1/services?select=id,name&limit=1"
    $services = Invoke-RestMethod -Uri $servicesUrl -Method GET -Headers $headers -ErrorAction Stop
    Write-Host "[OK] Database queries working" -ForegroundColor Green
    Write-Host "[OK] Infinite recursion FIX APPLIED!" -ForegroundColor Green
} catch {
    $errorMsg = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($errorMsg.code -eq '42P17') {
        Write-Host "[ERROR] Infinite recursion NOT FIXED YET!" -ForegroundColor Red
        Write-Host ""
        Write-Host "ACTION REQUIRED:" -ForegroundColor Yellow
        Write-Host "1. Open: https://supabase.com/dashboard/project/$projectId/sql/new" -ForegroundColor Cyan
        Write-Host "2. Copy & paste SQL from: FIX_DAN_PROMOTE_SEKARANG.sql" -ForegroundColor Cyan
        Write-Host "3. Click 'Run' button" -ForegroundColor Cyan
        Write-Host ""
        
        # Copy SQL to clipboard
        $sqlFile = "FIX_DAN_PROMOTE_SEKARANG.sql"
        if (Test-Path $sqlFile) {
            $sqlContent = Get-Content $sqlFile -Raw
            Set-Clipboard -Value $sqlContent
            Write-Host "[OK] SQL copied to clipboard!" -ForegroundColor Green
            Write-Host "Just paste (Ctrl+V) in SQL Editor" -ForegroundColor Gray
        }
        Write-Host ""
        Write-Host "Press Enter after running SQL..." -ForegroundColor Yellow
        Read-Host
        
        # Re-check after fix
        try {
            $services = Invoke-RestMethod -Uri $servicesUrl -Method GET -Headers $headers -ErrorAction Stop
            Write-Host "[OK] Fix verified! Database working now!" -ForegroundColor Green
        } catch {
            Write-Host "[ERROR] Still not working. Please check SQL execution." -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host ""

# Check 3: Verify user roles
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "STEP 3: Checking User Roles" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

$user1 = "88d321ac-b040-4707-8586-218ced262268"
$user2 = "80efaa74-e5dc-46db-84e1-e9df3215f60c"

Write-Host "Checking users:" -ForegroundColor White
Write-Host "  User 1: $user1" -ForegroundColor Gray
Write-Host "  User 2: $user2" -ForegroundColor Gray
Write-Host ""

# Note: Cannot query profiles directly due to RLS, this is expected
Write-Host "[INFO] User role check requires SQL Editor (RLS protected)" -ForegroundColor Yellow
Write-Host ""

# Check 4: Website status
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "STEP 4: Website Status" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

$websiteUrl = "https://rfs-store.vercel.app"
try {
    $webResponse = Invoke-WebRequest -Uri $websiteUrl -Method HEAD -ErrorAction Stop
    Write-Host "[OK] Website is UP and running!" -ForegroundColor Green
    Write-Host "[OK] URL: $websiteUrl" -ForegroundColor Cyan
} catch {
    Write-Host "[WARNING] Cannot check website status" -ForegroundColor Yellow
}

Write-Host ""

# Final Instructions
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS FOR USER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To see Admin Panel, user MUST:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Go to: $websiteUrl" -ForegroundColor White
Write-Host ""
Write-Host "2. Click 'Logout' button (red button, top right)" -ForegroundColor White
Write-Host ""
Write-Host "3. LOGIN again with same credentials" -ForegroundColor White
Write-Host ""
Write-Host "4. After login, navbar will show:" -ForegroundColor White
Write-Host "   Beranda | Layanan | Dashboard | [ADMIN] | Pesanan Saya | Logout" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "WHY LOGOUT/LOGIN REQUIRED?" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Browser session caches user role." -ForegroundColor Gray
Write-Host "Logout clears old session." -ForegroundColor Gray
Write-Host "Login creates new session with admin role." -ForegroundColor Gray
Write-Host ""

# Quick commands
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "QUICK COMMANDS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Open SQL Editor:" -ForegroundColor White
Write-Host "  Start-Process 'https://supabase.com/dashboard/project/$projectId/sql/new'" -ForegroundColor Gray
Write-Host ""
Write-Host "Open Website:" -ForegroundColor White
Write-Host "  Start-Process '$websiteUrl'" -ForegroundColor Gray
Write-Host ""
Write-Host "Copy Fix SQL:" -ForegroundColor White
Write-Host "  Get-Content FIX_DAN_PROMOTE_SEKARANG.sql | Set-Clipboard" -ForegroundColor Gray
Write-Host ""

# Auto-open website option
Write-Host "========================================" -ForegroundColor Green
Write-Host "READY TO TEST?" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Press 'Y' to open website now, or any key to exit..." -ForegroundColor Yellow
$key = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

if ($key.Character -eq 'y' -or $key.Character -eq 'Y') {
    Write-Host ""
    Write-Host "Opening website..." -ForegroundColor Cyan
    Start-Process $websiteUrl
    Write-Host ""
    Write-Host "Remember: LOGOUT then LOGIN again to see Admin panel!" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VERIFICATION COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

