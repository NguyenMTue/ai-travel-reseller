import { spawn } from "node:child_process";
import { getResolvedFFmpegPath } from "../src/lib/video-engine/ffmpeg-compositor.ts";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

function run(args) {
  return new Promise((resolve, reject) => {
    const ffmpeg = getResolvedFFmpegPath();
    const proc = spawn(ffmpeg, args);
    let stderr = "";
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg error ${code}: ${stderr.slice(-300)}`));
    });
  });
}

async function testSmooth() {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "smooth-test-"));
  const imgPath = path.join(tmp, "input.jpg");
  const res = await fetch("https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1080&h=1920&q=80");
  await fs.writeFile(imgPath, Buffer.from(await res.arrayBuffer()));

  const outZoomIn = path.join(tmp, "smooth_zoomin.mp4");
  const outZoomOut = path.join(tmp, "smooth_zoomout.mp4");
  const outPan = path.join(tmp, "smooth_pan.mp4");

  const durationSec = 4.0;
  const fps = 30;
  const frames = Math.round(durationSec * fps);

  // Silky smooth filter:
  // 1. Scale input to 1080x1920 ensuring 9:16 aspect ratio
  // 2. Zoompan with smooth progressive increment
  // 3. Format as 720x1280 at 30fps
  console.log("Testing Smooth ZOOM_IN...");
  await run([
    "-loop", "1", "-i", imgPath,
    "-vf", `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.0012,1.2)':d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=720x1280:fps=${fps}`,
    "-t", String(durationSec),
    "-pix_fmt", "yuv420p",
    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-y", outZoomIn
  ]);

  console.log("Testing Smooth ZOOM_OUT...");
  await run([
    "-loop", "1", "-i", imgPath,
    "-vf", `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='if(lte(zoom,1.0),1.2,max(1.2-0.0012*on,1.0))':d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=720x1280:fps=${fps}`,
    "-t", String(durationSec),
    "-pix_fmt", "yuv420p",
    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-y", outZoomOut
  ]);

  console.log("Testing Smooth PAN_LEFT...");
  await run([
    "-loop", "1", "-i", imgPath,
    "-vf", `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z=1.15:d=${frames}:x='(1-on/${frames})*(iw-iw/zoom)':y='ih/2-(ih/zoom/2)':s=720x1280:fps=${fps}`,
    "-t", String(durationSec),
    "-pix_fmt", "yuv420p",
    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-y", outPan
  ]);

  console.log("All 3 smooth motions generated successfully!");
  const s1 = await fs.stat(outZoomIn);
  const s2 = await fs.stat(outZoomOut);
  const s3 = await fs.stat(outPan);
  console.log("Sizes:", s1.size, s2.size, s3.size);
  await fs.rm(tmp, { recursive: true, force: true });
}

testSmooth().catch(console.error);
