"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  ArrowRight,
  LoaderCircle,
  Building2,
  Users,
  ShieldCheck,
} from "lucide-react";
import { login, signup } from "@/app/actions/auth";
export function AuthForm({
  mode,
  configured,
  next,
  checkEmail,
  initialRole,
}: {
  mode: "login" | "register";
  configured: boolean;
  next: string;
  checkEmail?: boolean;
  initialRole?: string;
}) {
  const register = mode === "register";
  const initialRoleChoice = next?.startsWith("/admin")
    ? "admin"
    : next?.startsWith("/reseller") || initialRole === "reseller"
      ? "reseller"
      : "merchant";
  const [selectedRole, setSelectedRole] = useState<"merchant" | "reseller" | "admin">(initialRoleChoice);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  function submit(formData: FormData) {
    setError("");
    if (
      register &&
      formData.get("password") !== formData.get("confirm_password")
    ) {
      setError("Mật khẩu xác nhận chưa khớp. Vui lòng kiểm tra lại.");
      return;
    }
    startTransition(async () => {
      const result = await (register ? signup(formData) : login(formData));
      if (result?.error) setError(result.error);
    });
  }

  const effectiveNext = selectedRole === "admin"
    ? "/admin"
    : selectedRole === "reseller"
      ? "/reseller/campaigns"
      : (next?.startsWith("/merchant") ? next : "/merchant");

  return (
    <>
      <div className="auth-heading">
        <p className="eyebrow">
          {register ? "BẮT ĐẦU HÀNH TRÌNH" : "CHÀO MỪNG BẠN TRỞ LẠI"}
        </p>
        <h1>{register ? "Kết nối từ hôm nay." : "Đăng nhập"}</h1>
        <p>
          {register
            ? "Tạo tài khoản và mở ra những cơ hội mới."
            : "Tiếp tục hành trình của bạn cùng TravelLink AI."}
        </p>
      </div>
      {!configured && (
        <div className="notice" role="status">
          Giao diện đang ở bản xem trước. Đăng nhập và đăng ký sẽ khả dụng khi
          cấu hình Supabase hoàn tất.
        </div>
      )}
      {checkEmail && (
        <div className="notice success" role="status">
          Đăng ký đã được tiếp nhận. Vui lòng kiểm tra email để xác nhận tài
          khoản trước khi đăng nhập.
        </div>
      )}
      {selectedRole === "admin" && (
        <div className="notice" role="status" style={{ borderLeftColor: "#2563eb", background: "#eff6ff", color: "#1d4ed8" }}>
          🛡️ Đang đăng nhập vào Phân hệ Quản trị Vận hành (Back-Office Super Admin)
        </div>
      )}
      {selectedRole === "reseller" && !register && (
        <div className="notice" role="status" style={{ borderLeftColor: "#10b981", background: "#f0fdf4", color: "#15803d" }}>
          🤝 Đang đăng nhập vào Phân hệ Cộng tác viên (Reseller Campaigns & Wallet)
        </div>
      )}
      {selectedRole === "merchant" && !register && (
        <div className="notice" role="status" style={{ borderLeftColor: "#f59e0b", background: "#fffbeb", color: "#b45309" }}>
          🏢 Đang đăng nhập vào Phân hệ Doanh nghiệp (Merchant Dashboard & Content Approval)
        </div>
      )}
      <form action={submit} className="auth-form">
        <input type="hidden" name="next" value={effectiveNext} />
        <input type="hidden" name="target_role" value={selectedRole} />
        {!register && (
          <fieldset className="role-options" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: "1rem" }}>
            <legend>Đăng nhập vào phân hệ:</legend>
            <label style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "4px", padding: "10px 4px" }}>
              <input
                type="radio"
                name="target_role"
                value="merchant"
                checked={selectedRole === "merchant"}
                onChange={() => setSelectedRole("merchant")}
              />
              <Building2 size={18} />
              <span>Doanh nghiệp</span>
            </label>
            <label style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "4px", padding: "10px 4px" }}>
              <input
                type="radio"
                name="target_role"
                value="reseller"
                checked={selectedRole === "reseller"}
                onChange={() => setSelectedRole("reseller")}
              />
              <Users size={18} />
              <span>Cộng tác viên</span>
            </label>
            <label style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "4px", padding: "10px 4px" }}>
              <input
                type="radio"
                name="target_role"
                value="admin"
                checked={selectedRole === "admin"}
                onChange={() => setSelectedRole("admin")}
              />
              <ShieldCheck size={18} />
              <span>Super Admin</span>
            </label>
          </fieldset>
        )}
        {register && (
          <>
            <fieldset className="role-options" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              <legend>Bạn muốn tham gia với vai trò nào?</legend>
              <label style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "4px", padding: "10px 4px" }}>
                <input
                  type="radio"
                  name="role"
                  value="merchant"
                  defaultChecked={initialRole !== "reseller" && initialRole !== "admin"}
                />
                <Building2 size={18} />
                <span>Doanh nghiệp</span>
              </label>
              <label style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "4px", padding: "10px 4px" }}>
                <input
                  type="radio"
                  name="role"
                  value="reseller"
                  defaultChecked={initialRole === "reseller"}
                />
                <Users size={18} />
                <span>Cộng tác viên</span>
              </label>
              <label style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "4px", padding: "10px 4px" }}>
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  defaultChecked={initialRole === "admin"}
                />
                <ShieldCheck size={18} />
                <span>Quản trị viên</span>
              </label>
            </fieldset>
            <label className="field" htmlFor="full_name">
              Họ và tên
              <input className="input"
                id="full_name"
                name="full_name"
                autoComplete="name"
                placeholder="Nguyễn Minh Anh"
                required
                maxLength={100}
              />
            </label>
          </>
        )}
        <label className="field" htmlFor="email">
          Email
          <input className="input"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="ban@example.com"
            required
            maxLength={254}
          />
        </label>
        <div className="field">
          <label htmlFor="password">Mật khẩu</label>
          <div className="password-wrap">
            <input className="input"
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={register ? "new-password" : "current-password"}
              placeholder={
                register ? "Tối thiểu 8 ký tự" : "Nhập mật khẩu của bạn"
              }
              required
              minLength={register ? 8 : undefined}
              maxLength={128}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
        </div>
        {register && (
          <label className="field" htmlFor="confirm_password">
            Xác nhận mật khẩu
            <input className="input"
              id="confirm_password"
              name="confirm_password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Nhập lại mật khẩu"
              required
              minLength={8}
              maxLength={128}
            />
          </label>
        )}
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending || !configured}
          className="button button-primary w-full"
        >
          {pending ? (
            <>
              <LoaderCircle className="spin" />
              Đang xử lý…
            </>
          ) : (
            <>
              {register ? "Tạo tài khoản" : "Đăng nhập"}
              <ArrowRight />
            </>
          )}
        </button>
      </form>
      <p className="auth-switch">
        {register ? "Bạn đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
        <Link href={register ? "/login" : "/register"}>
          {register ? "Đăng nhập" : "Đăng ký ngay"}
        </Link>
      </p>
      <div className="auth-preview">
        <Link href="/preview/merchant" prefetch={false}>
          Xem thử Dashboard, không cần tài khoản ↗
        </Link>
      </div>
      {!register && selectedRole !== "admin" && (
        <div className="auth-preview" style={{ marginTop: "0.5rem" }}>
          <button
            type="button"
            onClick={() => setSelectedRole("admin")}
            style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 500, cursor: "pointer", fontSize: "inherit" }}
          >
            Chuyển sang cổng Quản trị viên (Super Admin) ↗
          </button>
        </div>
      )}
    </>
  );
}
