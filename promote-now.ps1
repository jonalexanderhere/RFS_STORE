# ============================================
# PROMOTE 2 SPECIFIC USERS TO ADMIN - CLI Script
# ============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 PROMOTING USERS TO ADMIN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# User IDs to promote
$user1 = "88d321ac-b040-4707-8586-218ced262268"
$user2 = "80efaa74-e5dc-46db-84e1-e9df3215f60c"

Write-Host "User 1 ID: $user1" -ForegroundColor Yellow
Write-Host "User 2 ID: $user2" -ForegroundColor Yellow
Write-Host ""

# Read environment
$envFile = ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host "   Please make sure you're in the RFS directory" -ForegroundColor Yellow
    exit 1
}

$envContent = Get-Content $envFile -Raw
$SUPABASE_URL = if ($envContent -match 'VITE_SUPABASE_URL=(.+)') { $matches[1].Trim() }
$SUPABASE_KEY = if ($envContent -match 'VITE_SUPABASE_ANON_KEY=(.+)') { 
    # Handle multiline keys
    $key = $matches[1].Trim()
    # Remove any quotes
    $key = $key -replace '"',''
    $key = $key -replace "'",''
    $key
}

if (-not $SUPABASE_URL -or -not $SUPABASE_KEY) {
    Write-Host "❌ Error: Cannot read Supabase credentials" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Supabase URL: $SUPABASE_URL" -ForegroundColor Green
Write-Host "✅ API Key loaded" -ForegroundColor Green
Write-Host ""

# Create SQL query
$sqlQuery = @"
UPDATE public.profiles 
SET role = 'admin'
WHERE id IN (
    '$user1',
    '$user2'
);

SELECT 
    p.id,
    u.email,
    p.full_name,
    p.role
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.id IN (
    '$user1',
    '$user2'
);
"@

Write-Host "📝 SQL Query prepared:" -ForegroundColor Cyan
Write-Host $sqlQuery -ForegroundColor Gray
Write-Host ""

# Prepare headers
$headers = @{
    "apikey" = $SUPABASE_KEY
    "Authorization" = "Bearer $SUPABASE_KEY"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

Write-Host "⚠️  Note: Due to RLS policies, REST API method may not work." -ForegroundColor Yellow
Write-Host "   Recommended: Use SQL Editor in Supabase Dashboard" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📋 MANUAL STEPS (EASIEST WAY):" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Open this link:" -ForegroundColor White
Write-Host "   https://supabase.com/dashboard/project/lzuqfckzboeqwtlqjfgm/sql/new" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Copy and paste this query:" -ForegroundColor White
Write-Host ""
Write-Host "   UPDATE public.profiles" -ForegroundColor Yellow
Write-Host "   SET role = 'admin'" -ForegroundColor Yellow
Write-Host "   WHERE id IN (" -ForegroundColor Yellow
Write-Host "       '$user1'," -ForegroundColor Yellow
Write-Host "       '$user2'" -ForegroundColor Yellow
Write-Host "   );" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Click 'Run' (or press Ctrl+Enter)" -ForegroundColor White
Write-Host ""
Write-Host "4. Verify with this query:" -ForegroundColor White
Write-Host "   SELECT * FROM get_all_admins();" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Try REST API method anyway
Write-Host "🔄 Attempting REST API method..." -ForegroundColor Yellow
Write-Host ""

$success = 0
$failed = 0

foreach ($userId in @($user1, $user2)) {
    try {
        $url = "$SUPABASE_URL/rest/v1/profiles?id=eq.$userId"
        $body = '{"role":"admin"}' 
        
        Write-Host "   Promoting: $userId" -ForegroundColor White
        
        $response = Invoke-RestMethod -Uri $url -Method PATCH -Headers $headers -Body $body -ErrorAction Stop
        
        Write-Host "   ✅ Success!" -ForegroundColor Green
        $success++
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "   ❌ Failed (Status: $statusCode)" -ForegroundColor Red
        $failed++
    }
    
    Start-Sleep -Milliseconds 300
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📊 RESULT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($success -gt 0) {
    Write-Host "✅ Success: $success users promoted" -ForegroundColor Green
}
if ($failed -gt 0) {
    Write-Host "❌ Failed: $failed users (use SQL Editor instead)" -ForegroundColor Red
}

Write-Host ""
if ($failed -gt 0) {
    Write-Host "⚠️  REST API method failed due to RLS policies" -ForegroundColor Yellow
    Write-Host "   Please use the SQL Editor method above" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Quick link: https://supabase.com/dashboard/project/lzuqfckzboeqwtlqjfgm/sql/new" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Press Enter to exit..."
Read-Host

