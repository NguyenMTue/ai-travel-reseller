"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  Calendar,
  Users,
  CreditCard,
  QrCode,
  Copy,
  Check,
  Phone,
  Mail,
  User,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Download,
} from "lucide-react";
import type {
  StorefrontData,
  StorefrontPackage,
  BookingOrderResult,
} from "@/src/lib/storefront/types";
import { createBookingOrder } from "@/src/lib/storefront/data";
import { formatPrice } from "@/src/lib/storefront/format";

type StorefrontCheckoutModalProps = {
  isOpen: boolean;
  onClose: () => void;
  data: StorefrontData;
  initialPackage?: StorefrontPackage;
};

export function StorefrontCheckoutModal({
  isOpen,
  onClose,
  data,
  initialPackage,
}: StorefrontCheckoutModalProps) {
  const { product, merchant, tracking } = data;

  const [step, setStep] = useState<"form" | "payment" | "success">("form");

  // Selection state
  const [selectedPackage, setSelectedPackage] = useState<StorefrontPackage>(
    initialPackage || product.packages[0] || {
      id: "default",
      name: product.name,
      description: product.subtitle,
      originalPrice: product.originalPrice,
      salePrice: product.salePrice,
      inclusions: product.highlights.slice(0, 3),
    },
  );

  // Tomorrow as default date (YYYY-MM-DD)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split("T")[0];

  const [travelDate, setTravelDate] = useState(defaultDateStr);
  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);

  // Customer contact
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [note, setNote] = useState("");

  const [formError, setFormError] = useState("");
  const [orderResult, setOrderResult] = useState<BookingOrderResult | null>(null);

  // Clipboard copy state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (initialPackage) {
      setSelectedPackage(initialPackage);
    }
  }, [initialPackage]);

  if (!isOpen) return null;

  // Pricing calculations
  const adultPrice = selectedPackage.salePrice;
  const childPrice = Math.round(selectedPackage.salePrice * 0.75);
  const subtotal = adultCount * adultPrice + childCount * childPrice;
  const discountAmount = tracking?.refCode ? Math.round(subtotal * 0.05) : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setFormError("Vui lòng nhập họ và tên của bạn");
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 9) {
      setFormError("Vui lòng nhập số điện thoại hợp lệ (nhận vé qua SMS)");
      return;
    }
    setFormError("");

    const order = createBookingOrder({
      packageId: selectedPackage.id,
      packageName: selectedPackage.name,
      travelDate,
      adultCount,
      childCount,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || `${customerPhone.trim()}@travel.customer`,
      note,
      refCode: tracking?.refCode,
      campaignId: data.campaign?.id,
      productId: product.id,
      merchantSlug: merchant.slug,
    });

    setOrderResult(order);
    setStep("payment");
  };

  const handleConfirmPaid = () => {
    setStep("success");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-[#f8fafc]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#204e4c] text-white flex items-center justify-center font-bold text-xs">
              TL
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm md:text-base leading-tight">
                {step === "form" && "Đặt vé tham quan chính hãng"}
                {step === "payment" && "Thanh toán vé qua VietQR"}
                {step === "success" && "Đặt vé thành công • Vé điện tử QR"}
              </h3>
              <p className="text-[11px] text-slate-500">
                {merchant.name} • {merchant.hotline}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* STEP 1: FORM */}
          {step === "form" && (
            <form onSubmit={handleSubmitBooking} className="space-y-4">
              {/* Package selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. Gói vé tham quan:
                </label>
                <div className="space-y-2">
                  {product.packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        selectedPackage.id === pkg.id
                          ? "border-[#204e4c] bg-emerald-50/30"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs md:text-sm text-slate-900">
                          {pkg.name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {pkg.description}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-sm text-[#bd6840]">
                          {formatPrice(pkg.salePrice)} ₫
                        </div>
                        <div className="text-[10px] text-slate-400 line-through">
                          {formatPrice(pkg.originalPrice)} ₫
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date & Quantity */}
              <div className="grid sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#204e4c]" />
                    <span>Ngày tham quan:</span>
                  </label>
                  <input
                    type="date"
                    value={travelDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setTravelDate(e.target.value)}
                    required
                    className="w-full text-xs md:text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#204e4c]/30 focus:border-[#204e4c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#204e4c]" />
                    <span>Số lượng vé:</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
                      <span className="text-[11px] text-slate-600 font-medium">Người lớn</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAdultCount(Math.max(1, adultCount - 1))}
                          className="w-6 h-6 rounded bg-white border border-slate-300 text-xs font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{adultCount}</span>
                        <button
                          type="button"
                          onClick={() => setAdultCount(adultCount + 1)}
                          className="w-6 h-6 rounded bg-white border border-slate-300 text-xs font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
                      <span className="text-[11px] text-slate-600 font-medium">Trẻ em (-25%)</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setChildCount(Math.max(0, childCount - 1))}
                          className="w-6 h-6 rounded bg-white border border-slate-300 text-xs font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{childCount}</span>
                        <button
                          type="button"
                          onClick={() => setChildCount(childCount + 1)}
                          className="w-6 h-6 rounded bg-white border border-slate-300 text-xs font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Contact */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700">
                  2. Thông tin liên hệ nhận vé:
                </label>

                <div>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Họ và tên người đặt vé *"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      className="w-full text-xs md:text-sm pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#204e4c]/30 focus:border-[#204e4c]"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-2.5">
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="Số điện thoại nhận vé SMS *"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required
                      className="w-full text-xs md:text-sm pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#204e4c]/30 focus:border-[#204e4c]"
                    />
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="Email nhận hóa đơn (tùy chọn)"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full text-xs md:text-sm pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#204e4c]/30 focus:border-[#204e4c]"
                    />
                  </div>
                </div>
              </div>

              {/* Reseller referral discount badge */}
              {tracking?.refCode && (
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đã áp dụng mã ưu đãi Đối tác:</span>
                  </div>
                  <strong className="text-emerald-700">-5% (-{formatPrice(discountAmount)} ₫)</strong>
                </div>
              )}

              {/* Price summary */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Vé người lớn ({adultCount}x):</span>
                  <span>{formatPrice(adultCount * adultPrice)} ₫</span>
                </div>
                {childCount > 0 && (
                  <div className="flex justify-between">
                    <span>Vé trẻ em ({childCount}x):</span>
                    <span>{formatPrice(childCount * childPrice)} ₫</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Ưu đãi liên kết tiếp thị:</span>
                    <span>-{formatPrice(discountAmount)} ₫</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="text-[#bd6840] text-base">{formatPrice(finalTotal)} ₫</span>
                </div>
              </div>

              {formError && (
                <p className="text-xs text-rose-600 font-medium">{formError}</p>
              )}

              <button
                type="submit"
                className="w-full bg-[#204e4c] hover:bg-[#183d3b] text-white font-bold text-sm py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>TIẾP TỤC THANH TOÁN VIETQR</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: VIETQR PAYMENT */}
          {step === "payment" && orderResult && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Mã đơn hàng: {orderResult.orderId}
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Quét mã VietQR chuyển khoản (Napas247)
                </h4>
                <p className="text-xs text-slate-500">
                  Mở ứng dụng ngân hàng bất kỳ để quét mã và chuyển tiền tự động
                </p>
              </div>

              {/* VietQR Display */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="relative p-2 bg-white rounded-xl shadow-xs border border-slate-200 mb-3">
                  <img
                    src={orderResult.vietQrUrl}
                    alt="Mã VietQR thanh toán"
                    className="w-48 h-48 md:w-56 md:h-56 object-contain"
                  />
                </div>

                <div className="w-full space-y-2 text-xs">
                  {/* Account Name */}
                  <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500">Người thụ hưởng:</span>
                    <strong className="text-slate-800">{orderResult.bankAccountName}</strong>
                  </div>

                  {/* Bank Account */}
                  <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500">Số tài khoản ({orderResult.bankName}):</span>
                    <div className="flex items-center gap-1.5">
                      <strong className="font-mono text-slate-800">{orderResult.bankAccount}</strong>
                      <button
                        type="button"
                        onClick={() => handleCopy(orderResult.bankAccount, "stk")}
                        className="text-[#204e4c] hover:bg-slate-100 p-1 rounded cursor-pointer"
                        title="Sao chép số tài khoản"
                      >
                        {copiedField === "stk" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Transfer Amount */}
                  <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500">Số tiền chính xác:</span>
                    <div className="flex items-center gap-1.5">
                      <strong className="text-[#bd6840] font-bold text-sm">
                        {formatPrice(orderResult.totalAmount)} ₫
                      </strong>
                      <button
                        type="button"
                        onClick={() => handleCopy(String(orderResult.totalAmount), "amount")}
                        className="text-[#204e4c] hover:bg-slate-100 p-1 rounded cursor-pointer"
                        title="Sao chép số tiền"
                      >
                        {copiedField === "amount" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Memo */}
                  <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500">Nội dung chuyển khoản:</span>
                    <div className="flex items-center gap-1.5">
                      <strong className="font-mono text-slate-800 font-bold bg-amber-50 px-1 rounded">
                        {orderResult.transferContent}
                      </strong>
                      <button
                        type="button"
                        onClick={() => handleCopy(orderResult.transferContent, "memo")}
                        className="text-[#204e4c] hover:bg-slate-100 p-1 rounded cursor-pointer"
                        title="Sao chép nội dung"
                      >
                        {copiedField === "memo" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Quay lại sửa
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPaid}
                  className="flex-2 bg-[#bd6840] hover:bg-[#a55630] text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>TÔI ĐÃ CHUYỂN KHOẢN • XUẤT VÉ</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: E-TICKET QR ISSUED */}
          {step === "success" && orderResult && (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-base md:text-lg font-bold text-slate-900">
                  XÁC NHẬN ĐẶT VÉ THÀNH CÔNG!
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Vé điện tử chính thức đã được gửi về số điện thoại <strong>{orderResult.customerPhone}</strong>
                </p>
              </div>

              {/* Electronic Ticket Card */}
              <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-xl text-left relative overflow-hidden">
                <div className="flex justify-between items-start pb-3 border-b border-slate-700">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">
                      Vé điện tử chính hãng (E-Ticket)
                    </span>
                    <h5 className="font-bold text-sm md:text-base text-white mt-0.5">
                      {orderResult.packageName}
                    </h5>
                  </div>
                  <div className="bg-[#bd6840] text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                    {orderResult.ticketCode}
                  </div>
                </div>

                <div className="py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div>
                      <span className="text-slate-400">Khách hàng: </span>
                      <strong className="text-white">{orderResult.customerName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Ngày đi: </span>
                      <strong className="text-white">{orderResult.travelDate}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Số lượng: </span>
                      <strong className="text-white">
                        {orderResult.adultCount} Người lớn {orderResult.childCount > 0 ? `, ${orderResult.childCount} Trẻ em` : ""}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Địa điểm: </span>
                      <strong className="text-white">{merchant.name}</strong>
                    </div>
                  </div>

                  {/* QR Entry Code Box */}
                  <div className="bg-white p-2.5 rounded-xl shadow-md flex flex-col items-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                        orderResult.qrPayload,
                      )}`}
                      alt="QR Code Vào Cổng"
                      className="w-28 h-28 object-contain"
                    />
                    <span className="text-[9px] text-slate-600 font-mono mt-1 font-bold">
                      QUÉT TẠI CỔNG VÀO
                    </span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-700 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Mã đơn: {orderResult.orderId}</span>
                  <span className="text-emerald-400 font-semibold">Đã xác thực</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 text-left space-y-1">
                <p className="font-bold">Hướng dẫn vào cổng:</p>
                <p>
                  • Vui lòng lưu ảnh mã QR trên hoặc mở tin nhắn SMS để xuất trình tại cửa kiểm soát vé tự động.
                </p>
                <p>
                  • Hotline hỗ trợ trực tiếp tại quầy thông tin: <strong>{merchant.hotline}</strong>
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Lưu / In vé</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-[#204e4c] hover:bg-[#183d3b] text-white py-2.5 px-4 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Hoàn tất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
