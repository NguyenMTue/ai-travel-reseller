import { test } from "node:test";
import assert from "node:assert/strict";
import { shareData, shareMessage, trackingShareData } from "../src/lib/reseller/share.ts";

const url = "https://tracking.example.invalid/r/TESTlink";
test("native text share preserves exact short URL and title, without destination fetching", async () => {
  let payload: ShareData | undefined;
  assert.equal(await shareData(trackingShareData(url, "Hội An — ẩm thực"), { share: async data => { payload = data; } }), "completed");
  assert.deepEqual(payload, { title: "Hội An — ẩm thực", url });
  assert.match(shareMessage("completed"), /không xác nhận bài đã đăng/);
});
test("unsupported, user cancellation, and genuine native errors are distinct", async () => {
  assert.equal(await shareData({ url }, {}), "unsupported");
  assert.equal(await shareData({ url }, { share: async () => { throw new DOMException("cancel", "AbortError"); } }), "cancelled");
  assert.equal(await shareData({ url }, { share: async () => { throw new DOMException("denied", "NotAllowedError"); } }), "error");
  assert.equal(shareMessage("cancelled"), "Đã hủy chia sẻ.");
  assert.match(shareMessage("unsupported"), /Copy link/);
});
test("PNG file sharing requires canShare and does not invoke native share when unsupported", async () => {
  const file = new File(["png"], "poster.png", { type: "image/png" });
  let calls = 0;
  const client = { canShare: () => false, share: async () => { calls++; } };
  assert.equal(await shareData({ files: [file] }, client), "unsupported");
  assert.equal(calls, 0);
  assert.equal(await shareData({ files: [file] }, { ...client, canShare: () => true }), "completed");
  assert.equal(calls, 1);
});
test("unsafe protocols and credential-bearing URLs are rejected", () => {
  for (const value of ["javascript:alert(1)", "data:text/plain,hello", "https://user:pass@example.invalid/r/code"]) {
    assert.throws(() => trackingShareData(value, "TravelLink"));
  }
});
