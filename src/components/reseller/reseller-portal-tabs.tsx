"use client";

import { useId, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  FileCheck,
  Layers3,
  Lock,
  Plus,
  Send,
  Share2,
  ShieldCheck,
  User,
  Users,
  AlertCircle,
  Building,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import type { CampaignFeedItem } from "@/src/lib/reseller/campaign-feed";
import { CampaignFeed } from "./campaign-feed";

// Types for Reseller Portal features
export interface SocialAccountItem {
  id: string;
  platform: "TikTok" | "Facebook" | "Instagram" | "YouTube";
  username: string;
  url: string;
  followers: number;
  averageViews: number;
  engagementRate: string;
  status: "Chờ duyệt" | "Đã duyệt" | "Bị đình chỉ";
  createdAt: string;
}

export interface DeclaredPostItem {
  id: string;
  platform: "TikTok" | "Facebook";
  postUrl: string;
  contentTitle: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  evidenceName: string;
  sourceType: "Tự khai";
  createdAt: string;
}

export interface BookingCommissionItem {
  id: string;
  bookingRef: string;
  productName: string;
  customerPhoneMasked: string; // e.g. 090***456
  amountVnd: number;
  commissionVnd: number;
  status: "Chờ xác nhận" | "Đã xác nhận" | "Chi trả được" | "Đã chi trả" | "Đảo ngược";
  createdAt: string;
}

const defaultSocialAccounts: SocialAccountItem[] = [
  {
    id: "soc-1",
    platform: "TikTok",
    username: "@danang_traveler",
    url: "https://tiktok.com/@danang_traveler",
    followers: 185000,
    averageViews: 45000,
    engagementRate: "4.8%",
    status: "Đã duyệt",
    createdAt: "2026-09-15",
  },
  {
    id: "soc-2",
    platform: "Facebook",
    username: "Travel Vlogger Đà Nẵng Official",
    url: "https://facebook.com/danangvlogger",
    followers: 95000,
    averageViews: 18000,
    engagementRate: "3.2%",
    status: "Đã duyệt",
    createdAt: "2026-09-20",
  },
];

const defaultDeclaredPosts: DeclaredPostItem[] = [
  {
    id: "post-1",
    platform: "TikTok",
    postUrl: "https://www.tiktok.com/@danang_traveler/video/7391823901823",
    contentTitle: "Kinh nghiệm đi Bà Nà Hills chuẩn người bản địa (Local Guide)",
    views: 35000,
    likes: 2400,
    comments: 180,
    shares: 95,
    saves: 420,
    evidenceName: "screenshot-tiktok-views.png",
    sourceType: "Tự khai",
    createdAt: "2026-10-14 10:30",
  },
];

const defaultBookings: BookingCommissionItem[] = [
  {
    id: "bk-1",
    bookingRef: "BK-BANA-20261001-01",
    productName: "Vé Cáp Treo Bà Nà Hills + Buffet Trưa Quốc Tế",
    customerPhoneMasked: "090***456",
    amountVnd: 2300000,
    commissionVnd: 172500,
    status: "Đã xác nhận",
    createdAt: "2026-10-01 14:20",
  },
  {
    id: "bk-2",
    bookingRef: "BK-CLC-20261003-02",
    productName: "Tour Cano Cao Tốc Cù Lao Chàm - Lặn Ngắm San Hô",
    customerPhoneMasked: "091***789",
    amountVnd: 2200000,
    commissionVnd: 253000,
    status: "Chi trả được",
    createdAt: "2026-10-03 09:15",
  },
  {
    id: "bk-3",
    bookingRef: "BK-SH-20261008-04",
    productName: "Vé Du Thuyền Sông Hàn Về Đêm - Ngắm Cầu Rồng",
    customerPhoneMasked: "098***123",
    amountVnd: 600000,
    commissionVnd: 84000,
    status: "Chờ xác nhận",
    createdAt: "2026-10-08 19:40",
  },
  {
    id: "bk-4",
    bookingRef: "BK-VIN-20260925-05",
    productName: "Vé Vào Cổng VinWonders Nam Hội An",
    customerPhoneMasked: "093***345",
    amountVnd: 1530000,
    commissionVnd: 137700,
    status: "Đã chi trả",
    createdAt: "2026-09-25 11:00",
  },
];

export function ResellerPortalTabs({
  campaigns,
  detailBasePath = "/preview/reseller/campaigns",
}: {
  campaigns: CampaignFeedItem[];
  detailBasePath?: string;
}) {
  const [activeTab, setActiveTab] = useState<"campaigns" | "social" | "posts" | "analytics">("campaigns");

  // Profile & Social State
  const [resellerStatus, setResellerStatus] = useState<"Đã duyệt" | "Chờ duyệt" | "Bị đình chỉ">("Đã duyệt");
  const [complianceAgreed, setComplianceAgreed] = useState(true);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccountItem[]>(defaultSocialAccounts);
  const [newPlatform, setNewPlatform] = useState<"TikTok" | "Facebook">("TikTok");
  const [newUsername, setNewUsername] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newFollowers, setNewFollowers] = useState("");
  const [newAvgViews, setNewAvgViews] = useState("");
  const [newEngagement, setNewEngagement] = useState("");
  const [socialSuccessMessage, setSocialSuccessMessage] = useState("");

  // Post Declaration State
  const [declaredPosts, setDeclaredPosts] = useState<DeclaredPostItem[]>(defaultDeclaredPosts);
  const [postPlatform, setPostPlatform] = useState<"TikTok" | "Facebook">("TikTok");
  const [postUrl, setPostUrl] = useState("");
  const [postContentTitle, setPostContentTitle] = useState("Chiến dịch Hè 2026 - Kích cầu du lịch Bà Nà Hills");
  const [postViews, setPostViews] = useState("");
  const [postLikes, setPostLikes] = useState("");
  const [postComments, setPostComments] = useState("");
  const [postShares, setPostShares] = useState("");
  const [postSaves, setPostSaves] = useState("");
  const [postEvidence, setPostEvidence] = useState("");
  const [postSuccessMessage, setPostSuccessMessage] = useState("");

  // Analytics & Payout State
  const [testZeroDenominator, setTestZeroDenominator] = useState(false);
  const [commissionFilter, setCommissionFilter] = useState("all");
  const [bankName, setBankName] = useState("Vietcombank");
  const [accountNumber, setAccountNumber] = useState("0123456789");
  const [accountHolder, setAccountHolder] = useState("NGUYEN MINH ANH");
  const [taxId, setTaxId] = useState("8001234567");
  const [payoutSaved, setPayoutSaved] = useState(false);

  // Handlers
  const handleAddSocialAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newUrl) return;
    const item: SocialAccountItem = {
      id: `soc-${Date.now()}`,
      platform: newPlatform,
      username: newUsername,
      url: newUrl,
      followers: parseInt(newFollowers, 10) || 0,
      averageViews: parseInt(newAvgViews, 10) || 0,
      engagementRate: newEngagement ? `${newEngagement}%` : "0%",
      status: "Chờ duyệt", // RULE-17 / FR-RES-02: Tài khoản mới thêm luôn ở trạng thái Chờ duyệt
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setSocialAccounts((prev) => [item, ...prev]);
    setNewUsername("");
    setNewUrl("");
    setNewFollowers("");
    setNewAvgViews("");
    setNewEngagement("");
    setSocialSuccessMessage("Đã thêm tài khoản mạng xã hội thành công. Trạng thái hiện tại: Chờ duyệt.");
  };

  const handleDeclarePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postUrl) return;
    const item: DeclaredPostItem = {
      id: `post-${Date.now()}`,
      platform: postPlatform,
      postUrl,
      contentTitle: postContentTitle,
      views: parseInt(postViews, 10) || 0,
      likes: parseInt(postLikes, 10) || 0,
      comments: parseInt(postComments, 10) || 0,
      shares: parseInt(postShares, 10) || 0,
      saves: parseInt(postSaves, 10) || 0,
      evidenceName: postEvidence || "evidence-screenshot.png",
      sourceType: "Tự khai", // RULE-13: Luôn gắn nhãn Tự khai
      createdAt: new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }),
    };
    setDeclaredPosts((prev) => [item, ...prev]);
    setPostUrl("");
    setPostViews("");
    setPostLikes("");
    setPostComments("");
    setPostShares("");
    setPostSaves("");
    setPostEvidence("");
    setPostSuccessMessage("Đã khai báo bài đăng và số liệu tự khai thành công!");
  };

  const handleSavePayout = (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutSaved(true);
  };

  // Calculations for analytics
  const rawClicks = testZeroDenominator ? 0 : 1240;
  const rawLeads = testZeroDenominator ? 0 : 315;
  const rawBookings = testZeroDenominator ? 0 : 42;
  const rawGmvVnd = testZeroDenominator ? 0 : 48500000;
  const conversionRate = rawClicks === 0 ? "N/A" : `${((rawBookings / rawClicks) * 100).toFixed(2)}%`;

  const filteredBookings = commissionFilter === "all"
    ? defaultBookings
    : defaultBookings.filter((b) => b.status === commissionFilter);

  const totalCommissionVnd = filteredBookings.reduce((sum, b) => sum + b.commissionVnd, 0);

  return (
    <div className="space-y-6">
      {/* Top Tab Navigation */}
      <nav aria-label="Phân hệ Reseller" className="flex flex-wrap gap-2 border-b border-border pb-4">
        <Button
          type="button"
          variant={activeTab === "campaigns" ? "default" : "outline"}
          onClick={() => setActiveTab("campaigns")}
          className="flex items-center gap-2"
        >
          <Layers3 size={16} />
          Chiến dịch & Content Kit
        </Button>
        <Button
          type="button"
          variant={activeTab === "social" ? "default" : "outline"}
          onClick={() => setActiveTab("social")}
          className="flex items-center gap-2"
        >
          <Share2 size={16} />
          Tài khoản MXH & Hồ sơ
        </Button>
        <Button
          type="button"
          variant={activeTab === "posts" ? "default" : "outline"}
          onClick={() => setActiveTab("posts")}
          className="flex items-center gap-2"
        >
          <Send size={16} />
          Khai báo bài đăng
        </Button>
        <Button
          type="button"
          variant={activeTab === "analytics" ? "default" : "outline"}
          onClick={() => setActiveTab("analytics")}
          className="flex items-center gap-2"
        >
          <BarChart3 size={16} />
          Hiệu suất & Hoa hồng
        </Button>
      </nav>

      {/* TAB 1: CAMPAIGN FEED & CONTENT KIT */}
      {activeTab === "campaigns" && (
        <section aria-labelledby="campaign-section-title">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="campaign-section-title" className="sr-only">Danh sách chiến dịch</h2>
            {/* Account Status Indicator */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Trạng thái tài khoản:</span>
              <span
                data-testid="reseller-account-status"
                className={`font-semibold px-2 py-0.5 rounded-full ${
                  resellerStatus === "Đã duyệt"
                    ? "bg-green-100 text-green-800"
                    : resellerStatus === "Chờ duyệt"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {resellerStatus}
              </span>
            </div>
          </div>

          {/* AC: Block participation if not approved */}
          {resellerStatus !== "Đã duyệt" || !complianceAgreed ? (
            <div
              role="alert"
              className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-center text-sm"
            >
              <AlertCircle size={28} className="mx-auto mb-2 text-destructive" />
              <h3 className="text-base font-semibold text-destructive">Không thể tham gia chiến dịch</h3>
              <p className="mt-1 text-muted-foreground">
                {resellerStatus === "Chờ duyệt"
                  ? "Tài khoản của bạn đang ở trạng thái 'Chờ duyệt'. Vui lòng đợi quản trị viên phê duyệt trước khi tham gia chiến dịch."
                  : resellerStatus === "Bị đình chỉ"
                  ? "Tài khoản của bạn đang ở trạng thái 'Bị đình chỉ'. Mọi quyền tham gia chiến dịch đã bị khóa."
                  : "Bạn chưa đồng ý điều khoản tuân thủ (người thật vận hành, gắn nhãn quảng cáo). Vui lòng cập nhật tại tab Hồ sơ."}
              </p>
            </div>
          ) : (
            <CampaignFeed campaigns={campaigns} detailBasePath={detailBasePath} />
          )}
        </section>
      )}

      {/* TAB 2: SOCIAL ACCOUNTS & PROFILE (FR-RES-01, FR-RES-02, FR-RES-04, RULE-14, RULE-17) */}
      {activeTab === "social" && (
        <div className="space-y-8" data-testid="social-profile-panel">
          {/* Profile Details (FR-RES-01) */}
          <section aria-labelledby="profile-title" className="rounded-xl border border-border bg-white p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 id="profile-title" className="text-xl font-semibold [font-family:var(--font-display)] flex items-center gap-2">
                <User size={20} />
                Hồ sơ Cộng tác viên (FR-RES-01)
              </h2>
              <div className="flex items-center gap-2">
                <label htmlFor="select-status-simulation" className="text-xs text-muted-foreground">
                  Mô phỏng trạng thái:
                </label>
                <select
                  id="select-status-simulation"
                  value={resellerStatus}
                  onChange={(e) => setResellerStatus(e.target.value as any)}
                  className="rounded-md border border-border text-xs p-1"
                >
                  <option value="Đã duyệt">Đã duyệt</option>
                  <option value="Chờ duyệt">Chờ duyệt</option>
                  <option value="Bị đình chỉ">Bị đình chỉ</option>
                </select>
              </div>
            </div>

            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Họ và tên</dt>
                <dd className="font-medium" data-testid="profile-name">Travel Vlogger Danang</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd className="font-medium" data-testid="profile-email">reseller@example.com</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Số điện thoại</dt>
                <dd className="font-medium" data-testid="profile-phone">0987654321</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Địa điểm (Region)</dt>
                <dd className="font-medium" data-testid="profile-region">Đà Nẵng & Hội An</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Sở thích</dt>
                <dd className="font-medium">Du lịch biển, Ẩm thực địa phương, Check-in</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Ngôn ngữ</dt>
                <dd className="font-medium">Tiếng Việt (Gốc), Tiếng Anh</dd>
              </div>
            </dl>

            {/* Compliance Terms Agreement (FR-RES-04 & RULE-14) */}
            <div className="mt-6 rounded-lg border border-border bg-secondary p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck size={20} className="text-primary shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-foreground">Điều khoản tuân thủ Reseller (RULE-14 & FR-RES-04)</p>
                  <p className="text-muted-foreground">
                    Reseller cam kết: Tài khoản do người thật vận hành; Luôn gắn nhãn quảng cáo/tiếp thị (#quangcao, #ad); Không đăng trùng nguyên bản; Không giả mạo đánh giá hoặc thổi phồng giá trị dịch vụ.
                  </p>
                  <label className="flex items-center gap-2 pt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      id="compliance-agreement"
                      checked={complianceAgreed}
                      onChange={(e) => setComplianceAgreed(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="font-medium">Tôi đã đọc, hiểu và đồng ý với Điều khoản tuân thủ &amp; <Link href="/terms" className="underline text-primary">Điều khoản sử dụng</Link></span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Social Accounts Management (FR-RES-02 & RULE-17) */}
          <section aria-labelledby="social-accounts-title" className="rounded-xl border border-border bg-white p-6">
            <h2 id="social-accounts-title" className="text-xl font-semibold [font-family:var(--font-display)] flex items-center gap-2">
              <Share2 size={20} />
              Quản lý tài khoản Mạng xã hội (FR-RES-02 &amp; RULE-17)
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Khai báo tài khoản TikTok / Facebook để tham gia phân phối nội dung du lịch. Lưu ý: Hệ thống TUYỆT ĐỐI KHÔNG lưu mật khẩu mạng xã hội.
            </p>

            {/* Form Add Social Account (RULE-17: NO password field) */}
            <form onSubmit={handleAddSocialAccount} className="mt-6 rounded-lg border border-border p-4 bg-background space-y-4" aria-label="Thêm tài khoản mạng xã hội">
              <h3 className="text-sm font-semibold">Thêm tài khoản mạng xã hội mới</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label htmlFor="social-platform" className="mb-1 block text-xs font-medium">Nền tảng</label>
                  <select
                    id="social-platform"
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value as any)}
                    className="w-full rounded-md border border-border bg-white p-2 text-sm"
                  >
                    <option value="TikTok">TikTok</option>
                    <option value="Facebook">Facebook</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="social-username" className="mb-1 block text-xs font-medium">Tên tài khoản (Username)</label>
                  <Input
                    id="social-username"
                    placeholder="@danang_traveler"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="social-url" className="mb-1 block text-xs font-medium">URL trang cá nhân</label>
                  <Input
                    id="social-url"
                    type="url"
                    placeholder="https://tiktok.com/@danang_traveler"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="social-followers" className="mb-1 block text-xs font-medium">Số người theo dõi (Followers)</label>
                  <Input
                    id="social-followers"
                    type="number"
                    placeholder="185000"
                    value={newFollowers}
                    onChange={(e) => setNewFollowers(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="social-views" className="mb-1 block text-xs font-medium">Lượt xem trung bình</label>
                  <Input
                    id="social-views"
                    type="number"
                    placeholder="45000"
                    value={newAvgViews}
                    onChange={(e) => setNewAvgViews(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="social-engagement" className="mb-1 block text-xs font-medium">Tương tác (%) (Tự khai)</label>
                  <Input
                    id="social-engagement"
                    type="text"
                    placeholder="4.8"
                    value={newEngagement}
                    onChange={(e) => setNewEngagement(e.target.value)}
                  />
                </div>
              </div>

              {/* Security Banner: RULE-17 Compliance */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted p-2.5 rounded-md">
                <Lock size={15} className="text-primary shrink-0" />
                <span>Bảo mật chuẩn RULE-17: Biểu mẫu chỉ yêu cầu username/URL công khai, <strong>không có trường mật khẩu</strong> MXH.</span>
              </div>

              {socialSuccessMessage && (
                <p role="status" className="text-xs text-green-700 font-medium">
                  {socialSuccessMessage}
                </p>
              )}

              <Button type="submit" size="sm">
                <Plus size={15} /> Thêm tài khoản MXH
              </Button>
            </form>

            {/* List of Accounts */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm" data-testid="social-accounts-table">
                <thead className="border-b border-border bg-muted text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3">Nền tảng</th>
                    <th className="p-3">Tài khoản</th>
                    <th className="p-3">Followers</th>
                    <th className="p-3">Lượt xem TB</th>
                    <th className="p-3">Tương tác</th>
                    <th className="p-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {socialAccounts.map((account) => (
                    <tr key={account.id} data-testid="social-account-row">
                      <td className="p-3 font-medium">{account.platform}</td>
                      <td className="p-3">
                        <a href={account.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          {account.username}
                        </a>
                      </td>
                      <td className="p-3">{account.followers.toLocaleString("vi-VN")}</td>
                      <td className="p-3">{account.averageViews.toLocaleString("vi-VN")}</td>
                      <td className="p-3">{account.engagementRate}</td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            account.status === "Đã duyệt"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {account.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* TAB 3: POST DECLARATION & SELF-REPORTED METRICS (FR-RES-10, FR-RES-11, RULE-13) */}
      {activeTab === "posts" && (
        <section aria-labelledby="post-declaration-title" className="rounded-xl border border-border bg-white p-6 space-y-6">
          <div className="border-b border-border pb-4">
            <h2 id="post-declaration-title" className="text-xl font-semibold [font-family:var(--font-display)] flex items-center gap-2">
              <Send size={20} />
              Khai báo bài đăng &amp; Số liệu tự khai (FR-RES-10, FR-RES-11, RULE-13)
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Khai báo URL bài đăng thực tế đã xuất bản trên TikTok/Facebook kèm số liệu tự khai. 
              Mọi số liệu do Reseller nhập được gắn nhãn <strong>&ldquo;Tự khai&rdquo;</strong> rõ ràng và <strong>không cộng vào tính hoa hồng</strong>.
            </p>
          </div>

          {/* Form Declare Post */}
          <form onSubmit={handleDeclarePost} className="rounded-lg border border-border bg-background p-5 space-y-4" aria-label="Biểu mẫu khai báo bài đăng">
            <h3 className="text-sm font-semibold">Khai báo bài đăng mới</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="post-platform" className="mb-1 block text-xs font-medium">Nền tảng đăng bài</label>
                <select
                  id="post-platform"
                  value={postPlatform}
                  onChange={(e) => setPostPlatform(e.target.value as any)}
                  className="w-full rounded-md border border-border bg-white p-2 text-sm"
                >
                  <option value="TikTok">TikTok</option>
                  <option value="Facebook">Facebook</option>
                </select>
              </div>

              <div>
                <label htmlFor="post-url" className="mb-1 block text-xs font-medium">URL bài đăng thực tế</label>
                <Input
                  id="post-url"
                  type="url"
                  placeholder="https://www.tiktok.com/@danang_traveler/video/7391823901823"
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="post-content" className="mb-1 block text-xs font-medium">Liên kết nội dung (ContentAsset đã dùng)</label>
                <select
                  id="post-content"
                  value={postContentTitle}
                  onChange={(e) => setPostContentTitle(e.target.value)}
                  className="w-full rounded-md border border-border bg-white p-2 text-sm"
                >
                  <option value="Chiến dịch Hè 2026 - Kích cầu du lịch Bà Nà Hills">Bà Nà Hills - Local Guide</option>
                  <option value="Chiến dịch Khám Phá Đại Dương - Cù Lao Chàm">Cù Lao Chàm - Foodie</option>
                  <option value="Chiến dịch VinWonders Nam Hội An">VinWonders - Family</option>
                </select>
              </div>

              <div>
                <label htmlFor="post-evidence" className="mb-1 block text-xs font-medium">Ảnh chụp màn hình bằng chứng (Evidence)</label>
                <Input
                  id="post-evidence"
                  placeholder="screenshot-evidence-views.png"
                  value={postEvidence}
                  onChange={(e) => setPostEvidence(e.target.value)}
                />
              </div>
            </div>

            <fieldset className="border-t border-border pt-4">
              <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Số liệu tự khai (RULE-13: Gắn nhãn rõ ràng, tách biệt số liệu hệ thống)
              </legend>
              <div className="grid gap-3 sm:grid-cols-5">
                <div>
                  <label htmlFor="post-views" className="mb-1 block text-xs">Lượt xem (Views)</label>
                  <Input id="post-views" type="number" placeholder="35000" value={postViews} onChange={(e) => setPostViews(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="post-likes" className="mb-1 block text-xs">Lượt thích</label>
                  <Input id="post-likes" type="number" placeholder="2400" value={postLikes} onChange={(e) => setPostLikes(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="post-comments" className="mb-1 block text-xs">Bình luận</label>
                  <Input id="post-comments" type="number" placeholder="180" value={postComments} onChange={(e) => setPostComments(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="post-shares" className="mb-1 block text-xs">Chia sẻ</label>
                  <Input id="post-shares" type="number" placeholder="95" value={postShares} onChange={(e) => setPostShares(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="post-saves" className="mb-1 block text-xs">Lưu bài viết</label>
                  <Input id="post-saves" type="number" placeholder="420" value={postSaves} onChange={(e) => setPostSaves(e.target.value)} />
                </div>
              </div>
            </fieldset>

            {postSuccessMessage && (
              <p role="status" className="text-xs text-green-700 font-medium">
                {postSuccessMessage}
              </p>
            )}

            <Button type="submit" size="sm">
              <Plus size={15} /> Xác nhận khai báo bài đăng
            </Button>
          </form>

          {/* List of Declared Posts */}
          <div className="mt-6 overflow-x-auto">
            <h3 className="text-sm font-semibold mb-3">Danh sách bài đăng đã khai báo</h3>
            <table className="w-full text-left text-sm" data-testid="declared-posts-table">
              <thead className="border-b border-border bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Bài đăng / URL</th>
                  <th className="p-3">Nội dung liên kết</th>
                  <th className="p-3">Lượt xem (Views)</th>
                  <th className="p-3">Tương tác</th>
                  <th className="p-3">Bằng chứng</th>
                  <th className="p-3">Nguồn dữ liệu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {declaredPosts.map((post) => (
                  <tr key={post.id} data-testid="declared-post-row">
                    <td className="p-3 font-medium">
                      <span className="text-xs bg-secondary px-1.5 py-0.5 rounded mr-2">{post.platform}</span>
                      <a href={post.postUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">
                        {post.postUrl}
                      </a>
                    </td>
                    <td className="p-3 text-xs">{post.contentTitle}</td>
                    <td className="p-3 font-semibold">{post.views.toLocaleString("vi-VN")}</td>
                    <td className="p-3 text-xs text-muted-foreground">
                      Thích: {post.likes} · CMT: {post.comments} · Share: {post.shares}
                    </td>
                    <td className="p-3 text-xs">{post.evidenceName}</td>
                    <td className="p-3">
                      <span
                        data-testid="self-reported-badge"
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800"
                      >
                        Tự khai
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 4: PERFORMANCE & COMMISSION DASHBOARD (FR-RES-12, FR-RES-13, FR-RES-14, FR-ANA-05, FR-ANA-09, FR-ANA-10, FR-ANA-11, RULE-17) */}
      {activeTab === "analytics" && (
        <div className="space-y-8" data-testid="performance-commission-panel">
          {/* Performance Overview (FR-RES-12 & FR-ANA-11) */}
          <section aria-labelledby="analytics-overview-title" className="rounded-xl border border-border bg-white p-6">
            <div className="flex flex-wrap items-center justify-between border-b border-border pb-4 gap-2">
              <div>
                <h2 id="analytics-overview-title" className="text-xl font-semibold [font-family:var(--font-display)] flex items-center gap-2">
                  <BarChart3 size={20} />
                  Dashboard Hiệu suất (FR-RES-12 &amp; FR-ANA-11)
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tiền tệ hiển thị theo <strong>VND</strong> · Múi giờ: <strong>Asia/Ho_Chi_Minh (UTC+7)</strong>
                </p>
              </div>

              {/* Toggle to test FR-ANA-06 zero denominator */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTestZeroDenominator((v) => !v)}
                className="text-xs"
              >
                {testZeroDenominator ? "Mô phỏng: Có dữ liệu" : "Mô phỏng: Mẫu số = 0 (FR-ANA-06)"}
              </Button>
            </div>

            {/* Metrics Grid */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-lg border border-border bg-background p-4" data-testid="metric-click">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Lượt Click</span>
                  <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-800">
                    Hệ thống ghi nhận
                  </span>
                </div>
                <dd className="mt-2 text-2xl font-bold">{rawClicks.toLocaleString("vi-VN")}</dd>
              </div>

              <div className="rounded-lg border border-border bg-background p-4" data-testid="metric-lead">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Khách tiềm năng (Lead)</span>
                  <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-800">
                    Hệ thống ghi nhận
                  </span>
                </div>
                <dd className="mt-2 text-2xl font-bold">{rawLeads.toLocaleString("vi-VN")}</dd>
              </div>

              <div className="rounded-lg border border-border bg-background p-4" data-testid="metric-booking">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Đơn hoàn tất (Booking)</span>
                  <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-800">
                    Hệ thống ghi nhận
                  </span>
                </div>
                <dd className="mt-2 text-2xl font-bold">{rawBookings.toLocaleString("vi-VN")}</dd>
              </div>

              <div className="rounded-lg border border-border bg-background p-4" data-testid="metric-gmv">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Doanh số (GMV)</span>
                  <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-800">
                    Hệ thống ghi nhận
                  </span>
                </div>
                <dd className="mt-2 text-2xl font-bold text-primary">{rawGmvVnd.toLocaleString("vi-VN")} ₫</dd>
              </div>

              <div className="rounded-lg border border-border bg-background p-4" data-testid="metric-conversion-rate">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Tỷ lệ chuyển đổi</span>
                  <span className="text-[10px] text-muted-foreground">FR-ANA-06</span>
                </div>
                <dd className="mt-2 text-2xl font-bold" data-testid="conversion-rate-value">
                  {conversionRate}
                </dd>
              </div>
            </div>

            {/* Clear Source Distinction (FR-ANA-05 & FR-ANA-10) */}
            <div className="mt-6 rounded-lg bg-secondary p-4 text-xs space-y-2">
              <p className="font-semibold text-foreground">Phân biệt nguồn dữ liệu (FR-ANA-05 &amp; FR-ANA-10):</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li><strong className="text-foreground">Hệ thống ghi nhận:</strong> Lượt click tracking, tương tác lead và booking hoàn tất trực tiếp từ website của Merchant. Dữ liệu này dùng để đối soát và chi trả hoa hồng.</li>
                <li><strong className="text-foreground">Reseller tự khai:</strong> Lượt xem/impressions, likes, comments trên bài đăng mạng xã hội. Dữ liệu này để tham khảo và theo dõi độ lan tỏa, <em>không cộng vào tính hoa hồng</em>.</li>
              </ul>
            </div>
          </section>

          {/* Commission Lifecycle Dashboard (FR-RES-13 & FR-ANA-09 PII Masking) */}
          <section aria-labelledby="commission-title" className="rounded-xl border border-border bg-white p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between border-b border-border pb-4 gap-2">
              <div>
                <h2 id="commission-title" className="text-xl font-semibold [font-family:var(--font-display)] flex items-center gap-2">
                  <DollarSign size={20} />
                  Dashboard Hoa hồng &amp; Trạng thái vòng đời (FR-RES-13)
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Theo dõi hoa hồng theo từng booking. Bảo mật PII khách hàng: Số điện thoại được che (ví dụ <code>090***456</code>).
                </p>
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-2">
                <label htmlFor="commission-status-filter" className="text-xs text-muted-foreground">Trạng thái:</label>
                <select
                  id="commission-status-filter"
                  value={commissionFilter}
                  onChange={(e) => setCommissionFilter(e.target.value)}
                  className="rounded-md border border-border text-xs p-1"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="Chờ xác nhận">Chờ xác nhận</option>
                  <option value="Đã xác nhận">Đã xác nhận</option>
                  <option value="Chi trả được">Chi trả được</option>
                  <option value="Đã chi trả">Đã chi trả</option>
                  <option value="Đảo ngược">Đảo ngược</option>
                </select>
              </div>
            </div>

            {/* Total Commission Banner */}
            <div className="flex items-center justify-between rounded-lg bg-primary/10 p-4 border border-primary/20">
              <span className="text-sm font-medium">Tổng hoa hồng ({commissionFilter === "all" ? "tất cả" : commissionFilter}):</span>
              <span className="text-2xl font-bold text-primary" data-testid="total-commission-amount">
                {totalCommissionVnd.toLocaleString("vi-VN")} ₫
              </span>
            </div>

            {/* Bookings Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" data-testid="commission-bookings-table">
                <thead className="border-b border-border bg-muted text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3">Mã Booking</th>
                    <th className="p-3">Sản phẩm</th>
                    <th className="p-3">SĐT Khách (PII Masked)</th>
                    <th className="p-3">Giá trị đơn</th>
                    <th className="p-3">Hoa hồng</th>
                    <th className="p-3">Trạng thái vòng đời</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredBookings.map((b) => (
                    <tr key={b.id} data-testid="commission-booking-row">
                      <td className="p-3 font-mono font-medium text-xs">{b.bookingRef}</td>
                      <td className="p-3 text-xs max-w-xs truncate">{b.productName}</td>
                      <td className="p-3 font-mono text-xs" data-testid="masked-phone">{b.customerPhoneMasked}</td>
                      <td className="p-3 font-medium">{b.amountVnd.toLocaleString("vi-VN")} ₫</td>
                      <td className="p-3 font-semibold text-primary">{b.commissionVnd.toLocaleString("vi-VN")} ₫</td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            b.status === "Đã chi trả"
                              ? "bg-green-100 text-green-800"
                              : b.status === "Chi trả được"
                              ? "bg-blue-100 text-blue-800"
                              : b.status === "Đã xác nhận"
                              ? "bg-indigo-100 text-indigo-800"
                              : b.status === "Chờ xác nhận"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Payout Settings Form (FR-RES-14 & RULE-17) */}
          <section aria-labelledby="payout-settings-title" className="rounded-xl border border-border bg-white p-6">
            <h2 id="payout-settings-title" className="text-xl font-semibold [font-family:var(--font-display)] flex items-center gap-2">
              <Building size={20} />
              Thông tin nhận hoa hồng &amp; Cài đặt thanh toán (FR-RES-14 &amp; RULE-17)
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Cung cấp tài khoản ngân hàng chính chủ để nhận chi trả hoa hồng hàng tháng.
            </p>

            <form onSubmit={handleSavePayout} className="mt-5 space-y-4 max-w-xl" aria-label="Cài đặt thông tin nhận tiền">
              <div>
                <label htmlFor="payout-bank" className="mb-1 block text-xs font-medium">Ngân hàng</label>
                <Input
                  id="payout-bank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Vietcombank, Techcombank, MB Bank..."
                  required
                />
              </div>

              <div>
                <label htmlFor="payout-account-number" className="mb-1 block text-xs font-medium">Số tài khoản ngân hàng</label>
                <Input
                  id="payout-account-number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="0123456789"
                  required
                />
              </div>

              <div>
                <label htmlFor="payout-account-holder" className="mb-1 block text-xs font-medium">Tên chủ tài khoản (Không dấu, in hoa)</label>
                <Input
                  id="payout-account-holder"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="NGUYEN MINH ANH"
                  required
                />
              </div>

              <div>
                <label htmlFor="payout-tax-id" className="mb-1 block text-xs font-medium">Mã số thuế cá nhân (Nếu có)</label>
                <Input
                  id="payout-tax-id"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="8001234567"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted p-2.5 rounded-md">
                <Lock size={15} className="text-primary shrink-0" />
                <span>Không có trường mật khẩu thẻ/mật khẩu Internet Banking. Thông tin lưu trữ bảo mật mã hóa.</span>
              </div>

              {payoutSaved && (
                <p role="status" className="text-xs text-green-700 font-medium">
                  Đã lưu thông tin tài khoản nhận hoa hồng thành công!
                </p>
              )}

              <Button type="submit" size="sm">
                Lưu thông tin thanh toán
              </Button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
