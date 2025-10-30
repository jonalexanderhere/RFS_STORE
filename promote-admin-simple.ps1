# Promote Users to Admin - Simple Version

Write-Host "Promoting users to admin..." -ForegroundColor Cyan

# Read .env file
$envContent = Get-Content .env -Raw
$SUPABASE_URL = if ($envContent -match 'VITE_SUPABASE_URL=(.+)') { $matches[1].Trim() }
$SUPABASE_KEY = if ($envContent -match 'VITE_SUPABASE_ANON_KEY=(.+)') { $matches[1].Trim() }

if (-not $SUPABASE_URL -or -not $SUPABASE_KEY) {
    Write-Host "Error: Cannot read Supabase credentials from .env" -ForegroundColor Red
    exit 1
}

$headers = @{
    "apikey" = $SUPABASE_KEY
    "Authorization" = "Bearer $SUPABASE_KEY"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

# Promote User 1
Write-Host "`nPromoting User 1..." -ForegroundColor Yellow
$user1Id = "d875e73a-3949-4bfb-8f49-e442eb1a879a"
$url1 = "$SUPABASE_URL/rest/v1/profiles?id=eq.$user1Id"
$body = '{"role":"admin"}'

try {
    $result1 = Invoke-RestMethod -Uri $url1 -Method PATCH -Headers $headers -Body $body
    Write-Host "✅ User 1 promoted successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Error promoting User 1: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

# Promote User 2
Write-Host "`nPromoting User 2..." -ForegroundColor Yellow
$user2Id = "80efaa74-e5dc-46db-84e1-e9df3215f60c"
$url2 = "$SUPABASE_URL/rest/v1/profiles?id=eq.$user2Id"

try {
    $result2 = Invoke-RestMethod -Uri $url2 -Method PATCH -Headers $headers -Body $body
    Write-Host "✅ User 2 promoted successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Error promoting User 2: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ Promotion Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Logout from website"
Write-Host "2. Login again"
Write-Host "3. Admin menu will appear!`n"

