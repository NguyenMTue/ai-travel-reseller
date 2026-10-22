import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import ffmpegPath from "ffmpeg-static";

const SCRIPT_LINES = [
  "Đi vé cáp treo Bà Nà Hills cuối tuần mà không biết lưu ý này,",
  "Hãy đi chuyến cáp sớm nhất trước 8 giờ 30 để săn mây và chụp ảnh Cầu Vàng vắng người.",
  "Khám phá Cổng Thời Gian với kiến trúc giao thoa độc đáo ngay khi vừa đến nơi.",
  "Nên đặt combo kèm buffet Four Seasons 380 nghìn nạp năng lượng trưa tiết kiệm hơn ăn lẻ.",
  "Thưởng thức buffet Bharata chuẩn Halal kết hợp cà ri Ấn Độ đặc sắc.",
  "Quảng trường Nhật Thực với tháp kính chóp và điêu khắc châu Âu góc sống ảo cực chất.",
  "Chiêm ngưỡng tòa lâu đài đá cổ kính sừng sững giữa nền trời xanh.",
  "Quảng trường Làng Pháp nhộn nhịp quanh quả địa cầu Sun World rực rỡ.",
  "Trải nghiệm trò chơi máng trượt tốc độ uốn lượn quanh sườn núi cực đã.",
  "Đợt này vé ưu đãi chính hãng chỉ 1 triệu 150 nghìn đồng, quét mã QR vào thẳng cổng.",
  "Comment ngay bên dưới để nhận link đặt vé chính thức từ Sun World Đà Nẵng nha!"
];

async function generateTtsSegments() {
  console.log("=== BẮT ĐẦU TẠO VOICE OVER TIẾNG VIỆT CHO 11 PHÂN CẢNH ===");

  const tmpAudioDir = resolve(process.cwd(), "tmp-audio");
  if (!existsSync(tmpAudioDir)) mkdirSync(tmpAudioDir, { recursive: true });

  const fileList = [];

  for (let i = 0; i < SCRIPT_LINES.length; i++) {
    const text = SCRIPT_LINES[i];
    const encoded = encodeURIComponent(text);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=vi&client=tw-ob`;

    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) {
      throw new Error(`TTS failed for line ${i + 1}: ${res.statusText}`);
    }

    const buf = Buffer.from(await res.arrayBuffer());
    const filePath = resolve(tmpAudioDir, `scene-${i}.mp3`);
    writeFileSync(filePath, buf);
    fileList.push(filePath);
    console.log(`[${i + 1}/11] TTS cảnh ${i + 1}: "${text.slice(0, 45)}..." (${buf.length} bytes)`);
  }

  // Tạo file concat list cho ffmpeg
  // Mỗi cảnh kéo dài khoảng 2.18s, ta dùng pad / atempo để dàn đều
  const concatTxt = resolve(tmpAudioDir, "concat.txt");
  const concatContent = fileList.map((f) => `file '${f.replace(/\\/g, "/")}'`).join("\n");
  writeFileSync(concatTxt, concatContent, "utf8");

  const mergedVoicePath = resolve(tmpAudioDir, "voiceover-raw.mp3");
  execSync(`"${ffmpegPath}" -y -f concat -safe 0 -i "${concatTxt}" -c copy "${mergedVoicePath}"`, {
    stdio: "inherit",
  });

  console.log("✅ Đã ghép toàn bộ 11 câu Voiceover vào:", mergedVoicePath);

  // Mix với BGM: Giảm BGM xuống 15%, voiceover 100%, thời lượng chuẩn 24 giây
  const bgmPath = resolve(process.cwd(), "docs/be1/samples/travel-bgm.mp3");
  const finalAudioPath = resolve(process.cwd(), "docs/be1/samples/banahills-final-audio.mp3");

  const mixCmd = `"${ffmpegPath}" -y -i "${bgmPath}" -i "${mergedVoicePath}" -filter_complex "[0:a]volume=0.18,atrim=0:24[bgm];[1:a]volume=1.2,atrim=0:24[vo];[bgm][vo]amix=inputs=2:duration=first" -t 24 "${finalAudioPath}"`;
  execSync(mixCmd, { stdio: "inherit" });

  console.log("🎉 Hoàn tất mix âm thanh 2 lớp (BGM + Voiceover 24s):", finalAudioPath);
}

generateTtsSegments().catch((err) => {
  console.error("Lỗi:", err);
  process.exit(1);
});
