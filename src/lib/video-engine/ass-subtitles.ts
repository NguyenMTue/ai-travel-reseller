export interface AssSceneInput {
  text: string;
  audioDurationSec: number;
  role?: "HOOK" | "EXPERIENCE" | "PRICING_AND_QR" | "CTA";
  overlayBanner?: string;
}

/**
 * Định dạng giây sang chuẩn ASS H:MM:SS.cc (centiseconds)
 */
export function formatAssTime(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = Math.floor(safe % 60);
  const cs = Math.min(99, Math.round((safe - Math.floor(safe)) * 100));
  return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

/**
 * Tách câu thoại thành từng cụm 2–4 từ tự nhiên cho phụ đề kiểu TikTok
 */
export function splitIntoTikTokChunks(sentence: string, minWords = 2, maxWords = 4): string[] {
  const words = sentence
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  if (words.length === 0) return [];
  if (words.length <= maxWords) return [words.join(" ")];

  const chunks: string[] = [];
  let idx = 0;
  while (idx < words.length) {
    const remaining = words.length - idx;
    if (remaining <= maxWords) {
      chunks.push(words.slice(idx).join(" "));
      break;
    }
    // Avoid leaving a 1-word orphan at the end
    const take = remaining === maxWords + 1 ? 3 : Math.min(maxWords, Math.max(minWords, 3));
    chunks.push(words.slice(idx, idx + take).join(" "));
    idx += take;
  }
  return chunks;
}

function escapeAssText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\{/g, "\\{").replace(/\}/g, "\\}").replace(/\r?\n/g, "\\N");
}

/**
 * Sinh nội dung file phụ đề .ass chuẩn TikTok 1080x1920:
 * - Phụ đề nhảy từng cụm 2–4 từ chia tỷ lệ theo số ký tự của cụm trong audio_i
 * - Mốc bắt đầu cảnh i = tổng audio của các cảnh trước (KHÔNG cộng xfade overlap)
 * - MarginV = 330px (>= 300px) tránh bị caption TikTok che
 * - Có banner chữ động ở đầu/cuối cảnh (hook & giá/CTA)
 */
export function buildTikTokAssSubtitles(
  scenes: AssSceneInput[],
  fontName = "Arial"
): string {
  const header = `[Script Info]
Title: TravelLink AI Review Video
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: TikTokChunk,${fontName},60,&H00FFFFFF,&H0000D7FF,&H00000000,&H96000000,-1,0,0,0,100,100,0,0,1,4,2,2,60,60,330,1
Style: TopBanner,${fontName},50,&H0000D7FF,&H00FFFFFF,&H00000000,&HB4141414,-1,0,0,0,100,100,0,0,3,10,0,8,60,60,210,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const lines: string[] = [];
  let cursorSec = 0;

  for (const scene of scenes) {
    const sceneStart = cursorSec;
    const sceneDur = Math.max(0.5, scene.audioDurationSec);
    const sceneEnd = sceneStart + sceneDur;

    // 1. Top dynamic banner (hook / pricing / CTA)
    if (scene.overlayBanner && scene.overlayBanner.trim()) {
      const bannerText = escapeAssText(scene.overlayBanner.trim());
      lines.push(
        `Dialogue: 1,${formatAssTime(sceneStart)},${formatAssTime(sceneEnd)},TopBanner,,0,0,0,,{\\fad(180,180)}${bannerText}`
      );
    }

    // 2. Word-chunk captions (2–4 words per chunk)
    const chunks = splitIntoTikTokChunks(scene.text);
    const totalChars = chunks.reduce((acc, c) => acc + c.length, 0) || 1;
    let chunkCursor = sceneStart;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const isLast = i === chunks.length - 1;
      const chunkDur = isLast
        ? Math.max(0.25, sceneEnd - chunkCursor)
        : (chunk.length / totalChars) * sceneDur;
      const chunkEnd = Math.min(sceneEnd, chunkCursor + chunkDur);

      const styledChunk = `{\\fscx92\\fscy92\\t(0,90,\\fscx104\\fscy104)\\t(90,180,\\fscx100\\fscy100)}${escapeAssText(chunk)}`;
      lines.push(
        `Dialogue: 2,${formatAssTime(chunkCursor)},${formatAssTime(chunkEnd)},TikTokChunk,,0,0,0,,${styledChunk}`
      );
      chunkCursor = chunkEnd;
    }

    cursorSec = sceneEnd;
  }

  return header + lines.join("\n") + "\n";
}
