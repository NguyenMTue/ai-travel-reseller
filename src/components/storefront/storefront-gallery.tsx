"use client";

import React, { useState } from "react";
import { Play, Image as ImageIcon, Video, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";

type GalleryImage = {
  url: string;
  title: string;
  description?: string;
};

type StorefrontGalleryProps = {
  images: GalleryImage[];
  videoUrl?: string;
  title: string;
};

export function StorefrontGallery({ images, videoUrl, title }: StorefrontGalleryProps) {
  const [activeTab, setActiveTab] = useState<"photos" | "video">(videoUrl ? "video" : "photos");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const currentImage = images[activeImageIndex] || images[0];

  const handlePrev = () => {
    setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[#e2e8f0] shadow-sm">
      {/* Mode Switcher Tabs */}
      <div className="flex border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-2 justify-between items-center">
        <div className="flex gap-2">
          {videoUrl && (
            <button
              type="button"
              onClick={() => setActiveTab("video")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                activeTab === "video"
                  ? "bg-[#204e4c] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Video AI Teaser (HD)</span>
              <span className="bg-amber-400 text-slate-900 text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase">
                AI Hot
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("photos")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${
              activeTab === "photos"
                ? "bg-[#204e4c] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Thư viện ảnh 4K ({images.length})</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400 hidden sm:inline">
          {activeTab === "photos" ? `${activeImageIndex + 1} / ${images.length} ảnh` : "Video trải nghiệm chân thực"}
        </span>
      </div>

      {/* Main Display Area */}
      <div className="relative aspect-[16/10] md:aspect-[16/9] bg-slate-950 flex items-center justify-center overflow-hidden">
        {activeTab === "video" && videoUrl ? (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <video
              src={videoUrl}
              controls
              playsInline
              className="max-h-full max-w-full rounded-lg shadow-lg"
              poster={images[0]?.url}
            >
              Trình duyệt của bạn không hỗ trợ phát video HTML5.
            </video>
          </div>
        ) : (
          <div className="relative w-full h-full group">
            {/* Main Image */}
            <img
              src={currentImage?.url}
              alt={currentImage?.title || title}
              className="w-full h-full object-cover transition-transform duration-500 ease-out"
            />

            {/* Gradient Overlay for Caption */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

            <div className="absolute bottom-4 left-4 right-4 text-white pointer-events-none">
              <h3 className="text-base md:text-lg font-bold drop-shadow-md">
                {currentImage?.title}
              </h3>
              {currentImage?.description && (
                <p className="text-xs md:text-sm text-slate-200 drop-shadow-sm mt-0.5 line-clamp-2">
                  {currentImage.description}
                </p>
              )}
            </div>

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Ảnh trước"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Ảnh tiếp theo"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Thumbnails row (When in photos mode or available) */}
      <div className="p-3 bg-white flex gap-2 overflow-x-auto scrollbar-thin">
        {images.map((img, idx) => (
          <button
            key={img.url + idx}
            type="button"
            onClick={() => {
              setActiveImageIndex(idx);
              setActiveTab("photos");
            }}
            className={`relative shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
              activeTab === "photos" && activeImageIndex === idx
                ? "border-[#204e4c] ring-2 ring-[#204e4c]/20 scale-102"
                : "border-transparent opacity-70 hover:opacity-100"
            }`}
          >
            <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
          </button>
        ))}

        {videoUrl && (
          <button
            type="button"
            onClick={() => setActiveTab("video")}
            className={`relative shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 flex flex-col items-center justify-center bg-slate-900 text-white text-[11px] font-semibold transition-all ${
              activeTab === "video"
                ? "border-[#bd6840] ring-2 ring-[#bd6840]/20"
                : "border-transparent opacity-80 hover:opacity-100"
            }`}
          >
            <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-[10px] mt-0.5 text-amber-200">Video AI</span>
          </button>
        )}
      </div>
    </div>
  );
}
