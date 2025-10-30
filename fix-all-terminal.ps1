# ============================================
# FIX ALL - Infinite Recursion + Promote Admin
# Run via Terminal - Full Automation
# ============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FIXING INFINITE RECURSION ERROR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Load .env
$envContent = Get-Content .env -Raw
$SUPABASE_URL = if ($envContent -match 'VITE_SUPABASE_URL=(.+)') { $matches[1].Trim() }
$SUPABASE_ANON_KEY = if ($envContent -match 'VITE_SUPABASE_ANON_KEY=(.+)') { 
    $matches[1].Trim() -replace '"','' -replace "'",''
}

if (-not $SUPABASE_URL -or -not $SUPABASE_ANON_KEY) {
    Write-Host "ERROR: Cannot read Supabase credentials from .env" -ForegroundColor Red
    exit 1
}

Write-Host "Supabase URL: $SUPABASE_URL" -ForegroundColor Green
Write-Host ""

# Read the complete SQL fix file
$sqlFile = "FIX_DAN_PROMOTE_SEKARANG.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "ERROR: $sqlFile not found!" -ForegroundColor Red
    exit 1
}

$sqlContent = Get-Content $sqlFile -Raw

Write-Host "SQL File loaded: $sqlFile" -ForegroundColor Green
Write-Host "Total characters: $($sqlContent.Length)" -ForegroundColor Gray
Write-Host ""

# Prepare for manual execution
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "AUTOMATED FIX VIA API NOT POSSIBLE" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Reason: Supabase REST API cannot execute DDL commands" -ForegroundColor Gray
Write-Host "(CREATE FUNCTION, DROP POLICY, etc. require SQL Editor)" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SOLUTION: AUTO-OPEN SQL EDITOR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Extract project ID from URL
$projectId = if ($SUPABASE_URL -match 'https://([^.]+)\.supabase\.co') { $matches[1] }

$sqlEditorUrl = "https://supabase.com/dashboard/project/$projectId/sql/new"

Write-Host "Opening SQL Editor in browser..." -ForegroundColor Yellow
Write-Host ""
Start-Process $sqlEditorUrl

Start-Sleep -Seconds 2

Write-Host "========================================" -ForegroundColor Green
Write-Host "INSTRUCTIONS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Browser should open automatically." -ForegroundColor White
Write-Host "If not, open this URL manually:" -ForegroundColor White
Write-Host ""
Write-Host "  $sqlEditorUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Then follow these steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. In the SQL Editor that just opened..." -ForegroundColor White
Write-Host ""
Write-Host "2. Press Ctrl+A (select all existing text)" -ForegroundColor White
Write-Host ""
Write-Host "3. PASTE this SQL (copying to clipboard now...):" -ForegroundColor White
Write-Host ""

# Copy SQL to clipboard
Set-Clipboard -Value $sqlContent
Write-Host "   [OK] SQL copied to clipboard!" -ForegroundColor Green
Write-Host ""

Write-Host "4. Paste in SQL Editor (Ctrl+V)" -ForegroundColor White
Write-Host ""
Write-Host "5. Click 'Run' or press Ctrl+Enter" -ForegroundColor White
Write-Host ""
Write-Host "6. Wait for success message (~10 seconds)" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "WHAT THIS FIX DOES:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[OK] Creates is_admin() function (prevents recursion)" -ForegroundColor Green
Write-Host "[OK] Updates all RLS policies" -ForegroundColor Green
Write-Host "[OK] Promotes 2 users to admin:" -ForegroundColor Green
Write-Host "   - 88d321ac-b040-4707-8586-218ced262268" -ForegroundColor Gray
Write-Host "   - 80efaa74-e5dc-46db-84e1-e9df3215f60c" -ForegroundColor Gray
Write-Host "[OK] Fixes infinite recursion error" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "AFTER RUNNING SQL:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. LOGOUT from website" -ForegroundColor White
Write-Host "2. LOGIN again" -ForegroundColor White
Write-Host "3. Admin panel will appear!" -ForegroundColor White
Write-Host ""
Write-Host "This is REQUIRED! Session must refresh." -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "QUICK REFERENCE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "SQL File: FIX_DAN_PROMOTE_SEKARANG.sql" -ForegroundColor White
Write-Host "Status: [OK] Copied to clipboard" -ForegroundColor Green
Write-Host "Browser: [OK] SQL Editor opened" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Paste SQL and click Run!" -ForegroundColor Yellow
Write-Host ""

