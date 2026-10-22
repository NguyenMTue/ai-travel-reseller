"use client";
import { useMemo, useRef, useState } from "react";
import { LibraryClient } from "@/src/components/merchant/library-client";
import { MediaCard, MediaCardGrid } from "@/tests/fixtures/tester3-f9a5509/media-card";
import { VideoGuidelinesModal } from "@/tests/fixtures/tester3-f9a5509/video-guidelines-modal";
import { mediaFixtureRequest, type MediaScenario } from "@/tests/fixtures/media-library";
import type { LibraryRequest } from "@/src/lib/merchant/media-library";
import styles from "@/src/components/merchant/library.module.css";
const components={Card:MediaCard,Grid:MediaCardGrid,Guidelines:VideoGuidelinesModal};
export function MediaLibraryPreview(){
  const [scenario,setScenario]=useState<MediaScenario>("ready"),[context,setContext]=useState("A"),[generation,setGeneration]=useState(0),[reads,setReads]=useState(0);
  const invalidate=useRef<(()=>void)|null>(null);
  const request=useMemo<LibraryRequest>(()=>(query,signal)=>mediaFixtureRequest(scenario,context,()=>setReads(n=>n+1),window.location.origin)(query,signal),[scenario,context]);
  const observe=useMemo(()=> (callback:()=>void)=>{invalidate.current=callback;return ()=>{invalidate.current=null;};},[]);
  return <>
    <details className={styles.fixture}><summary aria-label="Tùy chọn mô phỏng thư viện">Mô phỏng · Dữ liệu fixture · Chờ UI/UX review</summary><section aria-label="Điều khiển mô phỏng thư viện">
      <p>Không phải media tài khoản thật. Snapshot Tester 3 f9a5509 chỉ dùng tại preview; không gọi API hoặc tạo video.</p>
      <label>Trạng thái <select aria-label="Trạng thái thư viện mô phỏng" value={scenario} onChange={e=>{setScenario(e.target.value as MediaScenario);setGeneration(n=>n+1);}}>
        <option value="ready">Có media</option><option value="empty">Trống</option><option value="loading">Đang tải</option><option value="error">Lỗi dịch vụ</option><option value="network">Lỗi mạng</option><option value="malformed">Sai contract</option><option value="session">Hết phiên</option><option value="forbidden">Không đủ quyền</option><option value="slow">Phản hồi chậm</option>
      </select></label>
      <button onClick={()=>invalidate.current?.()}>Mô phỏng hết phiên</button>
      <button onClick={()=>{invalidate.current?.();setContext(v=>v==="A"?"B":"A");setGeneration(n=>n+1);}}>Đổi ngữ cảnh mô phỏng</button>
      <output aria-label="Số lần đọc media mô phỏng">{reads}</output>
    </section></details>
    <LibraryClient contextKey={`${scenario}:${context}:${generation}`} request={request} components={components} observeInvalidation={observe} />
  </>;
}
