# PowerShell Test Script: Kiểm thử hệ thống Affiliate Tracking Link & Clicks (BE1-W2)
$baseUrl = "http://localhost:3000"
$resellerId = "22222222-2222-2222-2222-222222222222"
$campaignId = "44444444-4444-4444-4444-444444444444"
$productId = "33333333-3333-3333-3333-333333333333"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  KIỂM THỬ HỆ THỐNG AFFILIATE TRACKING & REDIRECT (BE1-W2) " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

Write-Host "`n1. Kiểm tra API POST /api/tracking/generate (Tạo link mới)..." -ForegroundColor Yellow
$bodyJson = '{"reseller_id":"' + $resellerId + '","campaign_id":"' + $campaignId + '","product_id":"' + $productId + '"}'
$res1 = Invoke-RestMethod -Uri "$baseUrl/api/tracking/generate" -Method Post -ContentType "application/json" -Body $bodyJson
Write-Host " [PASS] Mã link tiếp thị sinh ra:" $res1.data.unique_code -ForegroundColor Green
Write-Host "  -> Short URL:       " $res1.data.short_url
Write-Host "  -> Destination URL: " $res1.data.destination_url
$code = $res1.data.unique_code

Write-Host "`n2. Kiểm tra tính Idempotent (Gọi lại với cùng reseller + campaign + product)..." -ForegroundColor Yellow
$res2 = Invoke-RestMethod -Uri "$baseUrl/api/tracking/generate" -Method Post -ContentType "application/json" -Body $bodyJson
if ($res2.data.unique_code -eq $code -and $res2.data.is_existing -eq $true) {
    Write-Host " [PASS] Idempotent thành công! Trả về đúng link cũ, không sinh bản ghi trùng lặp." -ForegroundColor Green
} else {
    Write-Host " [FAIL] Sai khác dữ liệu khi gọi lại." -ForegroundColor Red
}

Write-Host "`n3. Kiểm tra Router Chuyển hướng HTTP 302: GET /r/$code..." -ForegroundColor Yellow
$headers = curl.exe -s -i "$baseUrl/r/$code"
if ($headers -match "HTTP/1.1 302" -or $headers -match "HTTP/2 302") {
    Write-Host " [PASS] Phản hồi chính xác HTTP 302 Found!" -ForegroundColor Green
    $locationLine = ($headers | Select-String -Pattern "location:").Line
    Write-Host "  -> $locationLine" -ForegroundColor Gray
} else {
    Write-Host " [FAIL] Không nhận được phản hồi 302." -ForegroundColor Red
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  HOÀN THÀNH TEST SUITE BE1-W2 TRACKING & REDIRECT        " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
