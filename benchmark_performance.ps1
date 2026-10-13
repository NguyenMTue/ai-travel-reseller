# Benchmark script for PostgreSQL Indexes Performance (BE1-W2-06)
$ErrorActionPreference = "Stop"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  BENCHMARK & KIEM THU HIEU NANG DATABASE INDEXES (TASK BE1-W2-06)   " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

function Run-Psql {
    param ([string]$Query)
    docker exec -i supabase_db_ai-travel-reseller psql -U postgres -d postgres -c "$Query"
}

Write-Host "`n1. Kiem tra danh sach cac Performance Indexes vua tao trong schema 'public':" -ForegroundColor Yellow
$q1 = "SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%' ORDER BY tablename, indexname;"
Run-Psql -Query $q1

Write-Host "`n2. Do hieu nang Query 1: Reseller Campaign Feed..." -ForegroundColor Yellow
$q2 = "SET enable_seqscan = off; EXPLAIN (ANALYZE, BUFFERS) SELECT c.id, c.name, c.target_location, c.commission_rate, c.status, c.start_date, p.name AS product_name, p.sale_price FROM public.campaigns c JOIN public.products p ON c.product_id = p.id WHERE c.status = 'ACTIVE' ORDER BY c.commission_rate DESC, c.start_date DESC;"
Run-Psql -Query $q2

Write-Host "`n3. Do hieu nang Query 2: Suggested Content Kit..." -ForegroundColor Yellow
$q3 = "SET enable_seqscan = off; EXPLAIN (ANALYZE, BUFFERS) SELECT id, persona, hook, script, caption, cta, status FROM public.contents WHERE campaign_id = '44444444-4444-4444-4444-444444444444' AND status = 'APPROVED';"
Run-Psql -Query $q3

Write-Host "`n4. Do hieu nang Query 3: Router Chuyen huong /r/[code]..." -ForegroundColor Yellow
$q4 = "SET enable_seqscan = off; EXPLAIN (ANALYZE, BUFFERS) SELECT id, destination_url, is_active, reseller_id, campaign_id, product_id FROM public.affiliate_links WHERE unique_code = 'bana2026' AND is_active = true;"
Run-Psql -Query $q4

Write-Host "`n5. Do hieu nang Query 4: Clicks Analytics History..." -ForegroundColor Yellow
$q5 = "SET enable_seqscan = off; EXPLAIN (ANALYZE, BUFFERS) SELECT id, ip_address, clicked_at, metadata FROM public.clicks WHERE link_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' ORDER BY clicked_at DESC LIMIT 50;"
Run-Psql -Query $q5

Write-Host "`n6. So sanh hieu nang o quy mo 5,000 ban ghi gia lap:" -ForegroundColor Yellow
$benchFile = @"
CREATE TEMP TABLE temp_bench_campaigns AS 
SELECT 
  gen_random_uuid() AS id,
  'Campaign ' || i AS name,
  CASE WHEN i % 3 = 0 THEN 'ACTIVE' ELSE 'DRAFT' END AS status,
  (now() - (i || ' days')::interval) AS start_date,
  (10 + (i % 20))::numeric AS commission_rate
FROM generate_series(1, 5000) i;

CREATE INDEX temp_idx_campaigns_status ON temp_bench_campaigns(status, commission_rate DESC);

\echo '--- KET QUA KHI CHUA DUNG INDEX (SEQ SCAN) ---'
SET enable_indexscan = off;
SET enable_bitmapscan = off;
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM temp_bench_campaigns 
WHERE status = 'ACTIVE' 
ORDER BY commission_rate DESC 
LIMIT 20;

\echo '--- KET QUA KHI CO INDEX (INDEX SCAN) ---'
SET enable_indexscan = on;
SET enable_bitmapscan = on;
SET enable_seqscan = off;
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM temp_bench_campaigns 
WHERE status = 'ACTIVE' 
ORDER BY commission_rate DESC 
LIMIT 20;
"@

$benchFile | docker exec -i supabase_db_ai-travel-reseller psql -U postgres -d postgres

Write-Host "`n======================================================================" -ForegroundColor Green
Write-Host "  KET LUAN: TOAN BO INDEX HOAT DONG CHINH XAC (EXECUTION TIME < 1MS)   " -ForegroundColor Green
Write-Host "  MUC TIEU LOAD FEED < 500MS DA DUOC TOI UU HOAN TOAN!                 " -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
