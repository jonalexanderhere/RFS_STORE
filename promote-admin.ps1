# ============================================
# PROMOTE USERS TO ADMIN - PowerShell Script
# ============================================

Write-Host "🚀 Starting Admin Promotion..." -ForegroundColor Cyan
Write-Host ""

# Load environment variables
$envFile = ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^VITE_SUPABASE_URL=(.*)') {
            $SUPABASE_URL = $matches[1]
        }
        if ($_ -match '^VITE_SUPABASE_ANON_KEY=(.*)') {
            $SUPABASE_ANON_KEY = $matches[1]
        }
    }
} else {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    exit 1
}

if (-not $SUPABASE_URL -or -not $SUPABASE_ANON_KEY) {
    Write-Host "❌ Error: Supabase credentials not found in .env" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Loaded Supabase credentials" -ForegroundColor Green
Write-Host "   URL: $SUPABASE_URL" -ForegroundColor Gray
Write-Host ""

# User IDs to promote
$userIds = @(
    "d875e73a-3949-4bfb-8f49-e442eb1a879a",
    "80efaa74-e5dc-46db-84e1-e9df3215f60c"
)

$headers = @{
    "apikey" = $SUPABASE_ANON_KEY
    "Authorization" = "Bearer $SUPABASE_ANON_KEY"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

$successCount = 0
$failCount = 0

foreach ($userId in $userIds) {
    Write-Host "📝 Promoting user: $userId" -ForegroundColor Yellow
    
    try {
        $body = @{
            role = "admin"
        } | ConvertTo-Json
        
        $url = "$SUPABASE_URL/rest/v1/profiles?id=eq.$userId"
        
        $response = Invoke-RestMethod -Uri $url -Method PATCH -Headers $headers -Body $body
        
        Write-Host "   ✅ Successfully promoted to admin!" -ForegroundColor Green
        $successCount++
    }
    catch {
        Write-Host "   ❌ Failed: $_" -ForegroundColor Red
        $failCount++
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "📊 SUMMARY" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Success: $successCount" -ForegroundColor Green
Write-Host "❌ Failed: $failCount" -ForegroundColor Red
Write-Host ""

if ($successCount -gt 0) {
    Write-Host "🎉 Admin promotion completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Logout from website" -ForegroundColor White
    Write-Host "   2. Login again with promoted user" -ForegroundColor White
    Write-Host "   3. Menu 'Admin' will appear!" -ForegroundColor White
    Write-Host ""
    Write-Host "🔍 Verify in SQL Editor:" -ForegroundColor Yellow
    Write-Host "   SELECT * FROM get_all_admins();" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

