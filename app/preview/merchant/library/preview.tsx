"use client";
import { useMemo, useRef, useState } from "react";
import { LibraryClient } from "@/src/components/merchant/library-client";
import { mediaFixtureRequest, type MediaScenario } from "@/tests/fixtures/media-library";
import type { LibraryRequest } from "@/src/lib/merchant/media-library";
import styles from "@/src/components/merchant/library.module.css";
import { VideoPlayer } from "@/src/components/video-player";
export function MediaLibraryPreview(){
  const [scenario,setScenario]=useState<MediaScenario>("ready"),[context,setContext]=useState("A"),[generation,setGeneration]=useState(0),[reads,setReads]=useState(0);
  const invalidate=useRef<(()=>void)|null>(null);
  const request=useMemo<LibraryRequest>(()=>(query,signal)=>mediaFixtureRequest(scenario,context,()=>setReads(n=>n+1),window.location.origin)(query,signal),[scenario,context]);
  const observe=useMemo(()=> (callback:()=>void)=>{invalidate.current=callback;return ()=>{invalidate.current=null;};},[]);
  return <>
    <details className={styles.fixture}><summary aria-label="Tùy chọn mô phỏng thư viện">Mô phỏng · Dữ liệu fixture · Chờ UI/UX review</summary><section aria-label="Điều khiển mô phỏng thư viện">
      <p>Không phải media tài khoản thật. Dùng component chính thức với dữ liệu mô phỏng; không gọi API hoặc tạo video.</p>
      <label>Trạng thái <select aria-label="Trạng thái thư viện mô phỏng" value={scenario} onChange={e=>{setScenario(e.target.value as MediaScenario);setGeneration(n=>n+1);}}>
        <option value="ready">Có media</option><option value="empty">Trống</option><option value="loading">Đang tải</option><option value="error">Lỗi dịch vụ</option><option value="network">Lỗi mạng</option><option value="malformed">Sai contract</option><option value="session">Hết phiên</option><option value="forbidden">Không đủ quyền</option><option value="slow">Phản hồi chậm</option>
      </select></label>
      <button onClick={()=>invalidate.current?.()}>Mô phỏng hết phiên</button>
      <button onClick={()=>{invalidate.current?.();setContext(v=>v==="A"?"B":"A");setGeneration(n=>n+1);}}>Đổi ngữ cảnh mô phỏng</button>
      <output aria-label="Số lần đọc media mô phỏng">{reads}</output>
    </section></details>
    <LibraryClient contextKey={`${scenario}:${context}:${generation}`} request={request} observeInvalidation={observe} />
    <VideoDeliveryPreview />
  </>;
}

function VideoDeliveryPreview() {
  const [scenario, setScenario] = useState("sample");
  const sources: Record<string, string | null> = {
    sample: "/campaign-videos/banahills-remediated.mp4",
    missing: null, invalid: "javascript:alert(1)",
    mock: "https://storage.travellink.vn/campaign-videos/hoi-an.mp4",
    // Exercise a real missing campaign file, never a rewrite to the sample.
    expired: "/campaign-videos/fixture-video-unavailable.mp4",
  };
  return <section className="mt-8 max-w-xl rounded-xl border border-border bg-white p-4" aria-label="Mô phỏng player tuần 4">
    <h2 className="text-xl">Kiểm thử phát và tải MP4 · Fixture</h2>
    <label className="my-4 block">Nguồn video mô phỏng
      <select className="block w-full" value={scenario} onChange={event => setScenario(event.target.value)}>
        <option value="sample">Video mẫu Bà Nà Hills có sẵn</option><option value="missing">Thiếu URL</option>
        <option value="invalid">URL sai</option><option value="mock">URL mock backend</option><option value="expired">URL hết hạn / HTTP lỗi</option>
      </select>
    </label>
    <VideoPlayer videoId={`fixture-${scenario}`} videoUrl={sources[scenario]} title="Bà Nà Hills · Mẫu kiểm thử FE tuần 4" sample />
  </section>;
}
