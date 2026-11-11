import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fetchVideoMp4, playableVideoUrl, videoFilename } from "../src/lib/video-delivery.ts";

test("URLs reject missing, unsafe and mock sources without substituting a sample", () => {
  for (const value of [null, "", "//evil.invalid/file", "javascript:alert(1)", "data:video/mp4,hi", "https://user:pass@example.com/v.mp4", "https://storage.travellink.vn/v.mp4", "/\\evil.invalid", "not-a-url"]) assert.equal(playableVideoUrl(value), null);
  for (const url of ["/campaign-videos/banahills-remediated.mp4", "https://storage.example.com/v.mp4?token=fixture"]) assert.equal(playableVideoUrl(url), url);
  assert.equal(videoFilename("Hội An / Chiến dịch", "abc-123"), "hoi-an-chien-dich-abc-123.mp4");
});

test("download returns byte-identical existing MP4, only on invocation", async () => {
  const bytes = await readFile(new URL("../public/campaign-videos/banahills-remediated.mp4", import.meta.url));
  let calls = 0;
  const signal = new AbortController().signal;
  const send: typeof fetch = async (url, init) => {
    calls++; assert.equal(url, "/video.mp4"); assert.equal(init?.signal, signal);
    assert.equal(init?.credentials, "same-origin"); assert.equal(init?.cache, "no-store");
    return new Response(bytes, { headers: { "Content-Type": "video/mp4" } });
  };
  assert.equal(calls, 0);
  const blob = await fetchVideoMp4("/video.mp4", signal, send);
  assert.deepEqual(Buffer.from(await blob.arrayBuffer()), bytes); assert.equal(calls, 1);
});

test("reject HTTP expired URL, HTML, fake MIME, empty data, network and cancellation", async () => {
  const signal = new AbortController().signal;
  for (const response of [new Response("expired", { status: 403 }), new Response("html", { headers: { "Content-Type": "text/html" } }), new Response("", { headers: { "Content-Type": "video/mp4" } }), new Response("<html>this is not a video</html>", { headers: { "Content-Type": "video/mp4" } })]) {
    await assert.rejects(fetchVideoMp4("/video.mp4", signal, async () => response));
  }
  await assert.rejects(fetchVideoMp4("/video.mp4", signal, async () => { throw new TypeError("CORS"); }));
  const controller = new AbortController(); controller.abort();
  await assert.rejects(fetchVideoMp4("/video.mp4", controller.signal, async (_url, init) => { init?.signal?.throwIfAborted(); return new Response(); }));
});
