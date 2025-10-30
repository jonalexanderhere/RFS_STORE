# Promote Users to Admin
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PROMOTING USERS TO ADMIN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$user1 = "88d321ac-b040-4707-8586-218ced262268"
$user2 = "80efaa74-e5dc-46db-84e1-e9df3215f60c"

Write-Host "User 1: $user1" -ForegroundColor Yellow
Write-Host "User 2: $user2" -ForegroundColor Yellow
Write-Host ""

# Read .env
$envContent = Get-Content .env -Raw
$SUPABASE_URL = if ($envContent -match 'VITE_SUPABASE_URL=(.+)') { $matches[1].Trim() }
$SUPABASE_KEY = if ($envContent -match 'VITE_SUPABASE_ANON_KEY=(.+)') { 
    $matches[1].Trim() -replace '"','' -replace "'",''
}

if (-not $SUPABASE_URL -or -not $SUPABASE_KEY) {
    Write-Host "ERROR: Cannot read Supabase credentials" -ForegroundColor Red
    exit 1
}

Write-Host "Supabase URL: $SUPABASE_URL" -ForegroundColor Green
Write-Host ""

$headers = @{
    "apikey" = $SUPABASE_KEY
    "Authorization" = "Bearer $SUPABASE_KEY"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

Write-Host "Attempting to promote users via REST API..." -ForegroundColor Cyan
Write-Host ""

$successCount = 0
foreach ($userId in @($user1, $user2)) {
    try {
        $url = "$SUPABASE_URL/rest/v1/profiles?id=eq.$userId"
        $body = '{"role":"admin"}'
        
        Write-Host "Promoting: $userId" -ForegroundColor White
        $response = Invoke-RestMethod -Uri $url -Method PATCH -Headers $headers -Body $body -ErrorAction Stop
        Write-Host "SUCCESS!" -ForegroundColor Green
        $successCount++
    }
    catch {
        Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 300
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($successCount -eq 2) {
    Write-Host "SUCCESS: Both users promoted!" -ForegroundColor Green
} else {
    Write-Host "FAILED: Use SQL Editor instead" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Open: https://supabase.com/dashboard/project/lzuqfckzboeqwtlqjfgm/sql/new" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Run this SQL:" -ForegroundColor White
    Write-Host "UPDATE public.profiles SET role = 'admin'" -ForegroundColor Yellow
    Write-Host "WHERE id IN ('$user1', '$user2');" -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

