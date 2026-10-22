import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import ffmpegPath from "ffmpeg-static";

const SCENES_DATA = [
  {
    index: 0,
    role: "HOOK",
    asset_id: "c1111111-1111-4111-8111-000000000001", // Cầu Vàng góc cao
    shot_type: "AERIAL_WIDE",
    motion_type: "drone-pan",
    top_badge: "⚠️ LƯU Ý SỐNG CÒN KHI ĐI BÀ NÀ HILLS!",
    sub: "Lưu ý sống còn khi đi Bà Nà Hills cuối tuần!",
    tts: "Lưu ý sống còn khi đi Bà Nà Hills cuối tuần!"
  },
  {
    index: 1,
    role: "VALUE_PROP_1",
    asset_id: "c1111111-1111-4111-8111-000000000002", // Cáp treo băng rừng
    shot_type: "AERIAL_WIDE",
    motion_type: "drone-pan",
    top_badge: "🚠 CÁP TREO SĂN MÂY BÀ NÀ",
    sub: "Đi cáp sớm trước 8h30 để săn mây và check-in Cầu Vàng vắng người.",
    tts: "Đi cáp sớm trước 8 giờ 30 để săn mây và check in Cầu Vàng vắng người."
  },
  {
    index: 2,
    role: "VALUE_PROP_2",
    asset_id: "c1111111-1111-4111-8111-000000000004", // Lâu đài đá
    shot_type: "SCENIC_MEDIUM",
    motion_type: "ken-push",
    top_badge: "🏰 LÂU ĐÀI ĐÁ & LÀNG PHÁP",
    sub: "Check-in Lâu Đài Đá và Làng Pháp cổ kính đẹp như trời Âu.",
    tts: "Check in Lâu Đài Đá và Làng Pháp cổ kính đẹp như trời Âu."
  },
  {
    index: 3,
    role: "FOOD_EXPERIENCE",
    asset_id: "c1111111-1111-4111-8111-000000000007", // Buffet Four Seasons
    shot_type: "CLOSEUP_FOOD",
    motion_type: "food-zoom",
    top_badge: "🍽️ BUFFET FOUR SEASONS 100 MÓN",
    sub: "Ăn trưa buffet Four Seasons hơn 100 món thả ga, siêu tiết kiệm!",
    tts: "Ăn trưa buffet Four Seasons hơn 100 món thả ga, siêu tiết kiệm!"
  },
  {
    index: 4,
    role: "THRILL_ACTIVITY",
    asset_id: "c1111111-1111-4111-8111-000000000008", // Máng trượt tốc độ
    shot_type: "HUMAN_POV",
    motion_type: "thrill-ride",
    top_badge: "🎢 MÁNG TRƯỢT TỐC ĐỘ HIỆP SĨ",
    sub: "Thử thách máng trượt tốc độ ngắm cảnh sườn núi cực đã.",
    tts: "Thử thách máng trượt tốc độ ngắm cảnh sườn núi cực đã."
  },
  {
    index: 5,
    role: "OFFER_CALLOUT",
    asset_id: "c1111111-1111-4111-8111-000000000006", // Quảng trường Nhật Thực
    shot_type: "SCENIC_MEDIUM",
    motion_type: "ken-pull",
    top_badge: "🎫 COMBO CÁP TREO + BUFFET TRƯA",
    sub: "Combo cáp treo kèm buffet trưa chính hãng chỉ 1.150.000đ.",
    tts: "Combo cáp treo kèm buffet trưa chính hãng chỉ 1 triệu 150 nghìn."
  },
  {
    index: 6,
    role: "OFFICIAL_CTA",
    asset_id: "c1111111-1111-4111-8111-000000000009", // Vườn hoa Le Jardin
    shot_type: "SCENIC_MEDIUM",
    motion_type: "ken-push",
    top_badge: "📍 ĐIỂM ĐẾN: BÀ NÀ HILLS",
    sub: "Nhấn link bio hoặc comment bên dưới để nhận vé ngay nhé!",
    tts: "Nhấn link bio hoặc comment bên dưới để nhận vé ngay nhé!"
  }
];

function getDurationSeconds(filePath) {
  const cmd = `"${ffmpegPath}" -i "${filePath}" 2>&1`;
  try {
    execSync(cmd);
  } catch (err) {
    const output = err.output ? err.output.toString() : err.message;
    const match = output.match(/Duration:\s*(\d+):(\d+):([\d\.]+)/);
    if (match) {
      const hours = parseFloat(match[1]);
      const mins = parseFloat(match[2]);
      const secs = parseFloat(match[3]);
      return hours * 3600 + mins * 60 + secs;
    }
  }
  return 3.0;
}

async function prepareAudio() {
  const tmpDir = resolve(process.cwd(), "tmp-audio-perfect");
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

  const timingList = [];

  for (let i = 0; i < SCENES_DATA.length; i++) {
    const item = SCENES_DATA[i];
    const encoded = encodeURIComponent(item.tts);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=vi&client=tw-ob`;

    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error("TTS fail: " + res.statusText);

    const buf = Buffer.from(await res.arrayBuffer());
    const rawPath = resolve(tmpDir, `raw_${i}.mp3`);
    writeFileSync(rawPath, buf);

    // Apply 1.12x speed for natural, youthful conversational delivery
    const finalAudioPath = resolve(tmpDir, `scene_${i}.mp3`);
    execSync(`"${ffmpegPath}" -y -i "${rawPath}" -filter:a "atempo=1.12" -vn "${finalAudioPath}"`, { stdio: "ignore" });

    const rawDuration = getDurationSeconds(finalAudioPath);
    // Section 2.2: Scene duration = exact audio duration + 250ms buffer
    const sceneDuration = parseFloat((rawDuration + 0.25).toFixed(3));

    timingList.push({
      ...item,
      audioPath: finalAudioPath,
      rawAudioDuration: rawDuration,
      sceneDuration: sceneDuration
    });

    console.log(`Cảnh ${i + 1}: TTS = ${rawDuration.toFixed(2)}s | Scene = ${sceneDuration.toFixed(2)}s | "${item.sub}"`);
  }

  // Calculate cumulative start times for exact 1:1:1 binding
  let currentStart = 0;
  for (let i = 0; i < timingList.length; i++) {
    timingList[i].startTime = parseFloat(currentStart.toFixed(3));
    currentStart += timingList[i].sceneDuration;
  }

  const totalSpeechDuration = currentStart;
  const totalVideoDuration = parseFloat((totalSpeechDuration + 0.6).toFixed(3)); // + 600ms tail padding
  console.log(`\nTổng thời lượng phát tiếng: ${totalSpeechDuration.toFixed(2)}s`);
  console.log(`Tổng thời lượng video (kèm 600ms tail padding): ${totalVideoDuration.toFixed(2)}s`);

  // Concat audio clips with exact pauses
  // Để đồng bộ 100%, ta ghép từng file audio với 250ms silence ở giữa
  const filterInputs = [];
  const filterChains = [];
  for (let i = 0; i < timingList.length; i++) {
    filterInputs.push(`-i "${timingList[i].audioPath}"`);
    filterChains.push(`[${i}:a]apad=pad_dur=0.25[a${i}]`);
  }

  const concatList = timingList.map((_, i) => `[a${i}]`).join("");
  const filterComplex = `${filterChains.join(";")};${concatList}concat=n=${timingList.length}:v=0:a=1[voiceout]`;

  const voiceoverMerged = resolve(tmpDir, "voiceover-synced.mp3");
  const concatCmd = `"${ffmpegPath}" -y ${filterInputs.join(" ")} -filter_complex "${filterComplex}" -map "[voiceout]" "${voiceoverMerged}"`;
  execSync(concatCmd, { stdio: "ignore" });

  // Mix with BGM: BGM volume 15%, Voiceover volume 1.25, tail padding 600ms
  const bgmPath = resolve(process.cwd(), "docs/be1/samples/travel-bgm.mp3");
  const finalAudioPath = resolve(process.cwd(), "docs/be1/samples/banahills-remediated-audio.mp3");

  const mixCmd = `"${ffmpegPath}" -y -i "${bgmPath}" -i "${voiceoverMerged}" -filter_complex "[0:a]volume=0.15,atrim=0:${totalVideoDuration}[bgm];[1:a]volume=1.25,apad=pad_dur=0.6[vo];[bgm][vo]amix=inputs=2:duration=first" -t ${totalVideoDuration} "${finalAudioPath}"`;
  execSync(mixCmd, { stdio: "ignore" });

  console.log("✅ Đã mix hoàn tất âm thanh audio-driven chuẩn:", finalAudioPath);

  writeFileSync(resolve(tmpDir, "timing_manifest.json"), JSON.stringify(timingList, null, 2), "utf8");
  return { timingList, totalVideoDuration, finalAudioPath };
}

prepareAudio().catch(console.error);
