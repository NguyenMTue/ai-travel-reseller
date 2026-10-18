# Set UTF-8 Output
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$bodyObj = @{
    product_id = "33333333-3333-3333-3333-333333333333"
    merchant_name = "Bà Nà Hills SunWorld"
    product_name = "Vé Cáp Treo Bà Nà Hills + Buffet Trưa Quốc Tế"
    location = "Đà Nẵng"
    verified_facts = "Bao gồm vé cáp treo khứ hồi, tham quan Cầu Vàng, Làng Pháp và buffet trưa hơn 100 món quốc tế tại nhà hàng Beer Plaza."
    confirmed_price_offer = "1.250.000 VND / vé người lớn"
    target_audience = "Gia đình và giới trẻ"
    official_booking_url = "https://banahills.sunworld.vn"
}

$bodyJson = $bodyObj | ConvertTo-Json -Compress
$bytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)

Write-Host "Đang gửi yêu cầu tới n8n webhook (http://127.0.0.1:5678/webhook/ai-travel-review)..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:5678/webhook/ai-travel-review" -Method Post -ContentType "application/json; charset=utf-8" -Body $bytes -TimeoutSec 60
    Write-Host "`n=== KẾT QUẢ TỪ N8N & GEMINI (THÀNH CÔNG) ===" -ForegroundColor Green
    $response | Format-List
    Write-Host "`n=== NỘI DUNG BẢN NHÁP CHI TIẾT ===" -ForegroundColor Yellow
    Write-Host $response.review_draft
} catch {
    Write-Host "`n❌ Lỗi khi gọi webhook n8n: $_" -ForegroundColor Red
}
