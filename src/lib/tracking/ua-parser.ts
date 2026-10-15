export type DeviceType = "mobile" | "desktop" | "tablet" | "unknown";
export type OperatingSystem = "iOS" | "Android" | "Windows" | "macOS" | "Linux" | "other";

export type ParsedUserAgent = {
  deviceType: DeviceType;
  os: OperatingSystem;
  browser: string;
  isBot: boolean;
  botName: string | null;
};

// Danh sách chữ ký (signatures) của các bot / crawler phổ biến
const BOT_SIGNATURES: Array<{ pattern: RegExp; name: string }> = [
  // Mạng xã hội & Tin nhắn (Social media preview crawlers)
  { pattern: /facebookexternalhit/i, name: "FacebookExternalHit" },
  { pattern: /Facebot/i, name: "Facebot" },
  { pattern: /bytespider/i, name: "ByteSpider" },
  { pattern: /tiktok(?!.*mobile)/i, name: "TikTokBot" },
  { pattern: /Twitterbot/i, name: "Twitterbot" },
  { pattern: /TelegramBot/i, name: "TelegramBot" },
  { pattern: /WhatsApp/i, name: "WhatsAppBot" },
  { pattern: /LinkedInBot/i, name: "LinkedInBot" },
  { pattern: /ZaloBot/i, name: "ZaloBot" },
  { pattern: /Slackbot/i, name: "Slackbot" },
  { pattern: /Discordbot/i, name: "Discordbot" },

  // Công cụ tìm kiếm (Search engine crawlers)
  { pattern: /Googlebot/i, name: "Googlebot" },
  { pattern: /AdsBot-Google/i, name: "GoogleAdsBot" },
  { pattern: /Mediapartners-Google/i, name: "GoogleMediapartners" },
  { pattern: /Google-Read-Aloud/i, name: "GoogleReadAloud" },
  { pattern: /bingbot/i, name: "Bingbot" },
  { pattern: /BingPreview/i, name: "BingPreview" },
  { pattern: /Applebot/i, name: "Applebot" },
  { pattern: /YandexBot/i, name: "YandexBot" },
  { pattern: /DuckDuckBot/i, name: "DuckDuckBot" },
  { pattern: /Baiduspider/i, name: "Baiduspider" },

  // Công cụ lập trình, automation & headless browsers (Scripts / Scrapers)
  { pattern: /HeadlessChrome/i, name: "HeadlessChrome" },
  { pattern: /PhantomJS/i, name: "PhantomJS" },
  { pattern: /curl\//i, name: "cURL" },
  { pattern: /Wget\//i, name: "Wget" },
  { pattern: /python-requests/i, name: "PythonRequests" },
  { pattern: /aiohttp/i, name: "AioHTTP" },
  { pattern: /Scrapy/i, name: "Scrapy" },
  { pattern: /PostmanRuntime/i, name: "PostmanRuntime" },
  { pattern: /node-fetch/i, name: "NodeFetch" },
  { pattern: /axios/i, name: "Axios" },
  { pattern: /Go-http-client/i, name: "GoHttpClient" },
  { pattern: /bot[\s/_-]/i, name: "GenericBot" },
  { pattern: /crawler/i, name: "GenericCrawler" },
  { pattern: /spider/i, name: "GenericSpider" },
];

/**
 * Phân tích chuỗi User-Agent thành các thông số thiết bị, hệ điều hành, trình duyệt và phân loại bot.
 * Xử lý siêu tốc (< 1ms), không gây độ trễ cho HTTP 302 Redirect.
 */
export function parseUserAgent(uaString: string | null | undefined): ParsedUserAgent {
  if (!uaString || typeof uaString !== "string") {
    return {
      deviceType: "unknown",
      os: "other",
      browser: "unknown",
      isBot: false,
      botName: null,
    };
  }

  const ua = uaString.trim();

  // 1. Kiểm tra Bot / Crawler
  let isBot = false;
  let botName: string | null = null;

  for (const bot of BOT_SIGNATURES) {
    if (bot.pattern.test(ua)) {
      isBot = true;
      botName = bot.name;
      break;
    }
  }

  // 2. Phân loại Hệ điều hành (OS)
  let os: OperatingSystem = "other";
  if (/iPad|iPhone|iPod/i.test(ua)) {
    os = "iOS";
  } else if (/Android/i.test(ua)) {
    os = "Android";
  } else if (/Windows NT/i.test(ua) || /Windows/i.test(ua)) {
    os = "Windows";
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = "macOS";
  } else if (/Linux/i.test(ua)) {
    os = "Linux";
  }

  // 3. Phân loại Loại Thiết bị (Device Type)
  let deviceType: DeviceType = "desktop";
  if (isBot) {
    deviceType = "unknown";
  } else if (/iPad/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua)) || /Tablet/i.test(ua)) {
    deviceType = "tablet";
  } else if (/Mobile|iPhone|iPod|Android.*Mobile|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    deviceType = "mobile";
  } else if (/Windows|Macintosh|Linux/i.test(ua)) {
    deviceType = "desktop";
  } else {
    deviceType = "unknown";
  }

  // 4. Phân loại Trình duyệt / In-App WebView
  let browser = "other";
  if (isBot) {
    browser = botName || "Bot";
  } else if (/musical_ly|musical\.ly|tiktok/i.test(ua)) {
    browser = "TikTok In-App";
  } else if (/FBAN|FBAV/i.test(ua)) {
    browser = "Facebook In-App";
  } else if (/Instagram/i.test(ua)) {
    browser = "Instagram In-App";
  } else if (/Zalo/i.test(ua)) {
    browser = "Zalo In-App";
  } else if (/Edg\//i.test(ua)) {
    browser = "Edge";
  } else if (/SamsungBrowser/i.test(ua)) {
    browser = "Samsung Browser";
  } else if (/Chrome|CriOS/i.test(ua)) {
    browser = "Chrome";
  } else if (/Firefox|FxiOS/i.test(ua)) {
    browser = "Firefox";
  } else if (/Safari/i.test(ua) && !/Chrome|CriOS|Android/i.test(ua)) {
    browser = "Safari";
  } else if (/Opera|OPR\//i.test(ua)) {
    browser = "Opera";
  }

  return {
    deviceType,
    os,
    browser,
    isBot,
    botName,
  };
}
