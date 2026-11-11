"use client";

import { useState, useEffect, type FormEvent } from "react";
import { CheckCircle2, Loader2, Wallet, X } from "lucide-react";
import { formatWalletMoney } from "@/src/lib/reseller/wallet";
import styles from "./payout-modal.module.css";

export interface PayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  onSuccess?: () => void;
}

const VIETNAM_BANKS = [
  "Vietcombank (Ngân hàng Ngoại thương Việt Nam)",
  "Techcombank (Ngân hàng Kỹ thương Việt Nam)",
  "MB Bank (Ngân hàng Quân đội)",
  "ACB (Ngân hàng Á Châu)",
  "BIDV (Ngân hàng Đầu tư và Phát triển)",
  "VietinBank (Ngân hàng Công thương Việt Nam)",
  "VPBank (Ngân hàng Việt Nam Thịnh Vượng)",
  "TPBank (Ngân hàng Tiên Phong)",
  "Sacombank (Ngân hàng Sài Gòn Thương Tín)",
  "VIB (Ngân hàng Quốc tế)",
  "HDBank (Ngân hàng Phát triển TP.HCM)",
  "MSB (Ngân hàng Hàng Hải)",
  "Ngân hàng số Timo / Cake / ZaloPay",
];

export function PayoutModal({
  isOpen,
  onClose,
  availableBalance,
  onSuccess,
}: PayoutModalProps) {
  const [bankName, setBankName] = useState(VIETNAM_BANKS[0]);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setIsSuccess(false);
      setSuccessData(null);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount) || numAmount < 100000) {
      setErrorMsg("Số tiền rút tối thiểu là 100.000 VNĐ.");
      return;
    }

    if (numAmount > availableBalance) {
      setErrorMsg("Số tiền rút vượt quá số dư khả dụng hiện tại.");
      return;
    }

    if (!accountNumber.trim() || accountNumber.trim().length < 6) {
      setErrorMsg("Số tài khoản ngân hàng không hợp lệ (tối thiểu 6 chữ số).");
      return;
    }

    if (!accountName.trim() || accountName.trim().length < 2) {
      setErrorMsg("Vui lòng nhập tên chủ tài khoản thụ hưởng.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reseller/wallet/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bank_name: bankName,
          account_number: accountNumber.trim(),
          account_name: accountName.trim().toUpperCase(),
          amount: numAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Gửi yêu cầu rút tiền thất bại.");
      }

      setIsSuccess(true);
      setSuccessData(data.data);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error("[PayoutModal] Lỗi gửi yêu cầu rút tiền:", err);
      setErrorMsg(err.message || "Đã xảy ra lỗi. Vui lòng kiểm tra lại kết nối.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function setQuickAmount(val: number) {
    const target = Math.min(val, availableBalance);
    setAmount(target.toString());
  }

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="payout-modal-title"
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>
            <h2 id="payout-modal-title">Rút tiền hoa hồng</h2>
            <p>Chuyển hoa hồng khả dụng về tài khoản ngân hàng thụ hưởng.</p>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng cửa sổ rút tiền"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.balanceCard}>
          <span className={styles.balanceLabel}>Số dư khả dụng hiện tại</span>
          <span className={styles.balanceValue}>
            {formatWalletMoney(availableBalance)}
          </span>
        </div>

        {errorMsg && (
          <div className={styles.errorBanner} role="alert">
            {errorMsg}
          </div>
        )}

        {isSuccess ? (
          <div className={styles.successBanner} role="status">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={24} color="#15803d" />
              <strong>Gửi yêu cầu rút tiền thành công!</strong>
            </div>
            <p style={{ margin: 0, fontSize: "13px" }}>
              Mã yêu cầu: <code>{successData?.id || "REC-NEW"}</code>
              <br />
              Số tiền:{" "}
              <strong>
                {formatWalletMoney(Number(successData?.amount || amount))}
              </strong>
              <br />
              Ngân hàng: {bankName} – {accountNumber} ({accountName.toUpperCase()})
            </p>
            <p style={{ margin: 0, fontSize: "12px", color: "#166534" }}>
              Trạng thái: <strong>Chờ đối soát (pending)</strong>. Tiền sẽ được
              chuyển khoản trong vòng 24 giờ làm việc.
            </p>
            <div style={{ marginTop: "12px", textAlign: "right" }}>
              <button
                type="button"
                className={styles.submitBtn}
                onClick={onClose}
              >
                Hoàn tất
              </button>
            </div>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="payout-bank" className={styles.label}>
                Ngân hàng thụ hưởng
              </label>
              <select
                id="payout-bank"
                className={styles.select}
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                disabled={isSubmitting}
                required
              >
                {VIETNAM_BANKS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="payout-account-number" className={styles.label}>
                Số tài khoản ngân hàng
              </label>
              <input
                id="payout-account-number"
                type="text"
                className={styles.input}
                placeholder="Ví dụ: 1903688888..."
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="payout-account-name" className={styles.label}>
                Tên chủ tài khoản (Viết in hoa không dấu)
              </label>
              <input
                id="payout-account-name"
                type="text"
                className={styles.input}
                placeholder="Ví dụ: NGUYEN VAN A"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="payout-amount" className={styles.label}>
                Số tiền muốn rút (VNĐ)
              </label>
              <input
                id="payout-amount"
                type="number"
                min={100000}
                max={availableBalance}
                step={10000}
                className={styles.input}
                placeholder="Tối thiểu 100.000 VNĐ"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isSubmitting}
                required
              />

              <div className={styles.quickAmounts}>
                <button
                  type="button"
                  className={styles.quickBtn}
                  onClick={() => setQuickAmount(200000)}
                >
                  200.000đ
                </button>
                <button
                  type="button"
                  className={styles.quickBtn}
                  onClick={() => setQuickAmount(500000)}
                >
                  500.000đ
                </button>
                <button
                  type="button"
                  className={styles.quickBtn}
                  onClick={() => setQuickAmount(1000000)}
                >
                  1.000.000đ
                </button>
                <button
                  type="button"
                  className={styles.quickBtn}
                  onClick={() => setQuickAmount(availableBalance)}
                >
                  Rút toàn bộ
                </button>
              </div>
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={onClose}
                disabled={isSubmitting}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isSubmitting || availableBalance < 100000}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang gửi yêu cầu...
                  </>
                ) : (
                  <>
                    <Wallet size={16} />
                    Xác nhận rút tiền
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
