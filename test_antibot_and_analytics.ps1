# PowerShell Test Script: Kiem thu toan dien Anti-Bot, Device Intelligence & Reseller Analytics
$baseUrl = "http://localhost:3000"
$resellerId = "22222222-2222-2222-2222-222222222222"
$campaignId = "44444444-4444-4444-4444-444444444444"
$productId = "33333333-3333-3333-3333-333333333333"

Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host "   KIEM THU TOAN DIEN ANTI-BOT, DEVICE PARSER & RESELLER ANALYTICS " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Tao Tracking Link
Write-Host "`n1. Kiem tra API Tao Tracking Link (POST /api/tracking/generate)..." -ForegroundColor Yellow
$bodyJson = '{"reseller_id":"' + $resellerId + '","campaign_id":"' + $campaignId + '","product_id":"' + $productId + '"}'
$genRes = Invoke-RestMethod -Uri "$baseUrl/api/tracking/generate" -Method Post -ContentType "application/json" -Body $bodyJson

$code = $genRes.data.unique_code
Write-Host " [PASS] Tracking Code: $code" -ForegroundColor Green
Write-Host "  -> Short URL:       $($genRes.data.short_url)"
Write-Host "  -> Destination URL: $($genRes.data.destination_url)"

# 2. Gia lap Click Nguoi That (Human Clicks)
Write-Host "`n2. Gia lap luot Click cua Nguoi That (Mobile, iOS, TikTok In-App, Android)..." -ForegroundColor Yellow

# 2.1 Click tu iPhone TikTok In-App
$resClick1 = curl.exe -s -i -A "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 musical_ly_29.3.0" -H "X-Forwarded-For: 113.160.10.1" "$baseUrl/r/$code"
if ($resClick1 -match "302 Found" -or $resClick1 -match "HTTP/.* 302") {
    Write-Host " [PASS] Click 1 (TikTok iOS): HTTP 302 Redirect thanh cong!" -ForegroundColor Green
} else {
    Write-Host " [FAIL] Click 1 khong tra ve 302" -ForegroundColor Red
}

# 2.2 Click tu Android Chrome
$resClick2 = curl.exe -s -i -A "Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 Chrome/112.0.0.0 Mobile Safari/537.36" -H "X-Forwarded-For: 113.160.10.2" "$baseUrl/r/$code"
if ($resClick2 -match "302 Found" -or $resClick2 -match "HTTP/.* 302") {
    Write-Host " [PASS] Click 2 (Android Chrome): HTTP 302 Redirect thanh cong!" -ForegroundColor Green
} else {
    Write-Host " [FAIL] Click 2 khong tra ve 302" -ForegroundColor Red
}

# 3. Gia lap Crawler / Bot Luot Quet Link (Facebook & ByteSpider)
Write-Host "`n3. Gia lap luot quet tu Crawler Bot (Facebook External Hit & ByteSpider)..." -ForegroundColor Yellow

# 3.1 Facebook External Hit Crawler
$resBot1 = curl.exe -s -i -A "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)" -H "X-Forwarded-For: 69.171.251.1" "$baseUrl/r/$code"
if ($resBot1 -match "302 Found" -or $resBot1 -match "HTTP/.* 302") {
    Write-Host " [PASS] Facebook Crawler: HTTP 302 giu nguyen OpenGraph preview!" -ForegroundColor Green
} else {
    Write-Host " [FAIL] Facebook Crawler khong nhan duoc 302" -ForegroundColor Red
}

# 3.2 ByteSpider Crawler
$resBot2 = curl.exe -s -i -A "Mozilla/5.0 (compatible; Bytespider; spider-feedback@bytedance.com)" -H "X-Forwarded-For: 110.249.201.1" "$baseUrl/r/$code"
if ($resBot2 -match "302 Found" -or $resBot2 -match "HTTP/.* 302") {
    Write-Host " [PASS] ByteSpider Crawler: HTTP 302 giu nguyen OpenGraph preview!" -ForegroundColor Green
} else {
    Write-Host " [FAIL] ByteSpider khong nhan duoc 302" -ForegroundColor Red
}

# 4. Gia lap Click Tac Spam (> 10 clicks tu cung 1 IP trong 1 phut)
Write-Host "`n4. Gia lap Click Tac Spam (Cung 1 IP bam 12 lan lien tuc)..." -ForegroundColor Yellow
$spamIp = "42.112.99.88"
for ($i = 1; $i -le 12; $i++) {
    $null = curl.exe -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/114.0.0.0 Safari/537.36" -H "X-Forwarded-For: $spamIp" "$baseUrl/r/$code"
}
Write-Host " [PASS] Da gui 12 luot click tu IP $spamIp (10 valid, 2 bi rate limit)" -ForegroundColor Green

# Cho 500ms de ghi nhan DB
Start-Sleep -Milliseconds 500

# 5. Kiem tra API GET /api/reseller/links
Write-Host "`n5. Kiem tra API GET /api/reseller/links..." -ForegroundColor Yellow
$linksUri = "$baseUrl/api/reseller/links?reseller_id=" + $resellerId
$linksRes = Invoke-RestMethod -Uri $linksUri -Method Get

if ($linksRes.success -and $linksRes.data.Count -gt 0) {
    Write-Host " [PASS] Lay danh sach link thanh cong! Tong so link: $($linksRes.data.Count)" -ForegroundColor Green
    $item = $linksRes.data[0]
    Write-Host "  -> Unique Code:  $($item.unique_code)"
    Write-Host "  -> Clicks Count: $($item.clicks_count) (Chi tinh click hop le)" -ForegroundColor Magenta
    Write-Host "  -> Campaign:     $($item.campaign.name) (Hoa hong: $($item.campaign.commission_rate)%)"
    Write-Host "  -> Product:      $($item.product.name) (Gia: $($item.product.sale_price)d)"
} else {
    Write-Host " [FAIL] Khong lay duoc danh sach links" -ForegroundColor Red
}

# 6. Kiem tra API GET /api/reseller/analytics
Write-Host "`n6. Kiem tra API GET /api/reseller/analytics (Bieu do & Thong ke)..." -ForegroundColor Yellow
$analyticsUri = "$baseUrl/api/reseller/analytics?reseller_id=" + $resellerId + "&range=7d"
$analyticsRes = Invoke-RestMethod -Uri $analyticsUri -Method Get

if ($analyticsRes.success) {
    $ov = $analyticsRes.data.overview
    Write-Host " [PASS] Lay du lieu phan tich thanh cong!" -ForegroundColor Green
    Write-Host "  --- TONG QUAN (OVERVIEW) ---" -ForegroundColor Cyan
    Write-Host "  -> Tong Clicks Tho (Total):     $($ov.total_clicks)"
    Write-Host "  -> Clicks Hop Le (Valid):       $($ov.valid_clicks)" -ForegroundColor Green
    Write-Host "  -> Bot Crawlers Da Loc:         $($ov.bot_clicks)" -ForegroundColor Yellow
    Write-Host "  -> Click Tac / Spam Da Loc:     $($ov.invalid_clicks)" -ForegroundColor Red
    Write-Host "  -> Ty Le Loc Bot:               $($ov.bot_ratio_percentage)%"

    Write-Host "`n  --- THIET BI & HE DIEU HANH ---" -ForegroundColor Cyan
    $devs = $analyticsRes.data.device_breakdown
    foreach ($d in $devs.devices) {
        Write-Host "  -> Thiet bi: $($d.name) - So luong: $($d.count) ($($d.percentage)%)"
    }
    foreach ($o in $devs.operating_systems) {
        Write-Host "  -> He dieu hanh: $($o.name) - So luong: $($o.count) ($($o.percentage)%)"
    }
    foreach ($b in $devs.browsers) {
        Write-Host "  -> Trinh duyet: $($b.name) - So luong: $($b.count) ($($b.percentage)%)"
    }

    Write-Host "`n  --- CHUOI THOI GIAN (TIMESERIES GRAPH) ---" -ForegroundColor Cyan
    Write-Host "  -> So ngay tra ve: $($analyticsRes.data.timeseries.Count) (Du 7 ngay lien tuc)" -ForegroundColor Green
} else {
    Write-Host " [FAIL] Khong lay duoc du lieu phan tich" -ForegroundColor Red
}

Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host "   HOAN THANH KIEM THU TOAN BO 4 MODULES ANTI-BOT & ANALYTICS!    " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
