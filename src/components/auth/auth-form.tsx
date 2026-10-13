"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  ArrowRight,
  LoaderCircle,
  Building2,
  Users,
} from "lucide-react";
import { login, signup } from "@/app/actions/auth";
import { AUTH_ERROR_MESSAGES } from "@/src/lib/role-auth";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";

export function AuthForm({
  mode,
  configured,
  next,
  checkEmail,
  initialRole,
  authError,
}: {
  mode: "login" | "register";
  configured: boolean;
  next: string;
  checkEmail?: boolean;
  initialRole?: string;
  authError?: string;
}) {
  const register = mode === "register";
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(
    authError && AUTH_ERROR_MESSAGES[authError]
      ? AUTH_ERROR_MESSAGES[authError]
      : "",
  );
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;

    const formData = new FormData(e.currentTarget);
    setError("");

    if (
      register &&
      formData.get("password") !== formData.get("confirm_password")
    ) {
      setError("Mật khẩu xác nhận chưa khớp. Vui lòng kiểm tra lại.");
      return;
    }

    if (!configured) {
      setError(
        "Chưa nhận diện cấu hình Supabase. Vui lòng kiểm tra file .env.local và restart lại dev server (npm run dev)."
      );
      return;
    }

    setPending(true);
    try {
      const result = await (register ? signup(formData) : login(formData));
      if (result?.error) setError(result.error);
    } catch (err) {
      // redirect() của Next ném lỗi NEXT_REDIRECT, cần để Next tự xử lý
      if ((err as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
        throw err;
      }
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setPending(false);
    }
  }

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

      <form onSubmit={handleSubmit} className="auth-form">
        <input type="hidden" name="next" value={next} />

        {register && (
          <>
            <fieldset className="role-options">
              <legend>Bạn muốn tham gia với vai trò nào?</legend>
              <label>
                <input
                  type="radio"
                  name="role"
                  value="merchant"
                  defaultChecked={initialRole !== "reseller"}
                />
                <Building2 size={19} />
                <span>Doanh nghiệp</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="role"
                  value="reseller"
                  defaultChecked={initialRole === "reseller"}
                />
                <Users size={19} />
                <span>Cộng tác viên</span>
              </label>
            </fieldset>

            <label className="field" htmlFor="full_name">
              Họ và tên
              <Input
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
          <Input
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
            <Input
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
              onClick={() => setShowPassword((v) => !v)}
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
            <Input
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

        <Button type="submit" disabled={pending} className="w-full">
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
        </Button>
      </form>

      <p className="auth-switch">
        {register ? "Bạn đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
        <Link href={register ? "/login" : "/register"}>
          {register ? "Đăng nhập" : "Đăng ký ngay"}
        </Link>
      </p>

      <div className="auth-preview">
        <Link href="/preview/merchant">
          Xem thử Dashboard, không cần tài khoản ↗
        </Link>
      </div>
    </>
  );
}