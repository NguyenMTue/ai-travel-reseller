"use client";

import React, { useState } from "react";
import type { StorefrontData, StorefrontPackage } from "@/src/lib/storefront/types";
import { StorefrontHeader } from "./storefront-header";
import { StorefrontGallery } from "./storefront-gallery";
import { StorefrontPriceCard } from "./storefront-price-card";
import { StorefrontTourContent } from "./storefront-tour-content";
import { StorefrontReviews } from "./storefront-reviews";
import { StorefrontStickyCta } from "./storefront-sticky-cta";
import { StorefrontCheckoutModal } from "./storefront-checkout-modal";
import { ShieldCheck, PhoneCall, Mail, MapPin } from "lucide-react";

type StorefrontViewProps = {
  data: StorefrontData;
};

export function StorefrontView({ data }: StorefrontViewProps) {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<StorefrontPackage | undefined>(
    data.product.packages[0],
  );

  const handleOpenBooking = () => {
    setIsBookingOpen(true);
  };

  const handleSelectPackage = (pkg: StorefrontPackage) => {
    setSelectedPackage(pkg);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#faf9f5] text-slate-800 flex flex-col font-sans pb-24 md:pb-12">
      {/* 1. Header Thương hiệu Doanh nghiệp */}
      <StorefrontHeader merchant={data.merchant} tracking={data.tracking} />

      {/* 2. Main Content Container */}
      <main className="max-w-6xl mx-auto px-4 py-6 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Cột trái: Media Gallery, Điểm nổi bật, Lịch trình, Mẹo du lịch, Đánh giá */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
            <StorefrontGallery
              images={data.product.galleryImages}
              videoUrl={data.product.videoUrl}
              title={data.product.name}
            />

            <StorefrontTourContent
              data={data}
              onSelectPackage={handleSelectPackage}
            />

            <StorefrontReviews
              reviews={data.product.packages.length > 0 ? (data as any).product.reviews || [
                {
                  id: "rev-01",
                  author: "Nguyễn Hoàng Minh",
                  rating: 5,
                  date: "10/11/2026",
                  tourPackage: data.product.name,
                  comment: "Vé quét mã QR vào cổng siêu nhanh, không phải chen chúc xếp hàng mua vé dưới chân núi. Cầu Vàng buổi sáng sớm mây bay đẹp như chốn bồng lai tiên cảnh!",
                },
                {
                  id: "rev-02",
                  author: "Trần Thu Thảo",
                  rating: 5,
                  date: "08/11/2026",
                  tourPackage: "Tour Khám Phá Danh Thắng Ngũ Hành Sơn & Động Huyền Không",
                  comment: "Gia đình mình có người lớn tuổi nên chọn gói này đi thang máy kính rất khỏe. Đúng 11h trưa thấy tia nắng mặt trời rọi thẳng xuống tượng Phật đẹp không thốt nên lời. HDV nhiệt tình 10 sao!",
                },
                {
                  id: "rev-03",
                  author: "Lê Văn Hùng",
                  rating: 5,
                  date: "04/11/2026",
                  tourPackage: "Combo Cáp Treo + Buffet Quốc Tế",
                  comment: "Buffet đồ ăn rất ngon và phong phú. Mua qua link đối tác TravelLink được giảm giá tốt mà lại được xuất vé điện tử chính hãng chuẩn chỉ.",
                },
              ] : []}
              averageRating={data.product.rating}
              totalReviews={data.product.reviewCount}
            />
          </div>

          {/* Cột phải: Giá vé niêm yết & Khuyến mãi Flash Sale (Sticky trên Desktop) */}
          <div className="lg:col-span-5 xl:col-span-4">
            <StorefrontPriceCard
              data={data}
              onOpenBooking={handleOpenBooking}
            />
          </div>
        </div>
      </main>

      {/* 3. Footer Thương hiệu & Đảm bảo pháp lý */}
      <footer className="mt-12 bg-white border-t border-slate-200 pt-8 pb-12 text-slate-500 text-xs">
        <div className="max-w-6xl mx-auto px-4 grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded bg-[#204e4c] text-white font-bold text-xs flex items-center justify-center">
                {data.merchant.name.charAt(0)}
              </div>
              <span className="font-bold text-slate-800 text-sm">
                {data.merchant.name}
              </span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              {data.merchant.tagline}. Cổng phân phối vé điện tử chính hãng và trải nghiệm du lịch số thông minh.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 mb-2">Thông tin liên hệ & Hỗ trợ</h4>
            <ul className="space-y-1.5 text-slate-600">
              <li className="flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5 text-[#204e4c]" />
                <span>Hotline: <strong>{data.merchant.hotline}</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#204e4c]" />
                <span>Email: {data.merchant.supportEmail}</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#204e4c] shrink-0 mt-0.5" />
                <span>{data.merchant.address}</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 mb-2">Cam kết dịch vụ</h4>
            <p className="text-slate-500 leading-relaxed mb-2">
              • Đảm bảo 100% vé chính hãng, kích hoạt tức thì.
              <br />
              • Bảo mật thanh toán theo chuẩn SSL & Napas247.
              <br />
              • Vận hành trên nền tảng TravelLink AI Storefront.
            </p>
            <div className="flex items-center gap-2 text-emerald-700 font-semibold text-[11px]">
              <ShieldCheck className="w-4 h-4" />
              <span>Chứng nhận Đối tác Doanh nghiệp Uy tín 2026</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 4. Thanh CTA cố định ở đáy màn hình di động */}
      <StorefrontStickyCta
        product={data.product}
        onOpenBooking={handleOpenBooking}
      />

      {/* 5. Live Checkout & VietQR Modal */}
      <StorefrontCheckoutModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        data={data}
        initialPackage={selectedPackage}
      />
    </div>
  );
}
