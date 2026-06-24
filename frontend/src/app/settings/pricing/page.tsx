"use client";

import React, { useState, useEffect } from "react";
import { 
  Check, 
  X, 
  HelpCircle, 
  Loader2, 
  Sparkles, 
  ChevronDown, 
  ChevronUp 
} from "lucide-react";

interface PlanFeature {
  labelVi: string;
  labelEn: string;
  type?: "regular" | "warning" | "error"; // regular: check, warning: alert icon/color, error: red X
}

interface Plan {
  id: string;
  nameVi: string;
  nameEn: string;
  priceMonthly: number | null;
  price3Months: number | null;
  priceYearly: number | null;
  total3MonthsVi: string;
  total3MonthsEn: string;
  totalYearlyVi: string;
  totalYearlyEn: string;
  features: PlanFeature[];
  recommended?: boolean;
  contact?: boolean;
}

export default function PricingPage() {
  const [lang, setLang] = useState<"en" | "vi">("vi");
  const [cycle, setCycle] = useState<"monthly" | "3months" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [targetPlanName, setTargetPlanName] = useState("");
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem("zeflyo_lang") || "vi";
    setLang(savedLang as "en" | "vi");

    const handleLangChange = () => {
      const updatedLang = localStorage.getItem("zeflyo_lang") || "vi";
      setLang(updatedLang as "en" | "vi");
    };

    window.addEventListener("zeflyo_lang_changed", handleLangChange);
    return () => {
      window.removeEventListener("zeflyo_lang_changed", handleLangChange);
    };
  }, []);

  const handleUpgradeClick = (planName: string) => {
    setTargetPlanName(planName);
    setShowComingSoon(true);
  };

  const plans: Plan[] = [
    {
      id: "basic",
      nameVi: "Cơ bản",
      nameEn: "Basic",
      priceMonthly: 79000,
      price3Months: 73000,
      priceYearly: 59000,
      total3MonthsVi: "Tổng: 219.000đ/3 tháng",
      total3MonthsEn: "Total: 219,000đ/3 months",
      totalYearlyVi: "Tổng: 710.000đ/năm",
      totalYearlyEn: "Total: 710,000đ/year",
      recommended: true,
      features: [
        { labelVi: "Tạo bài viết từ chủ đề yêu cầu", labelEn: "Create posts from requested topics" },
        { labelVi: "Tạo bài viết từ ảnh sản phẩm", labelEn: "Create posts from product images" },
        { labelVi: "AI tự động viết và đăng bài đa kênh (Facebook, Zalo OA)", labelEn: "AI multi-channel writing & auto-posting (Facebook, Zalo OA)" },
        { labelVi: "1000 điểm/tháng (~100 bài viết)", labelEn: "1000 credits/month (~100 posts)" },
        { labelVi: "⚠️ Chỉ đăng trực tiếp (Không có chế độ duyệt)", labelEn: "⚠️ Direct posting only (No approval workflow)", type: "warning" },
        { labelVi: "⚠️ Chỉ hỗ trợ tải ảnh (Không hỗ trợ video)", labelEn: "⚠️ Images support only (No video support)", type: "warning" }
      ]
    },
    {
      id: "pro",
      nameVi: "Chuyên nghiệp",
      nameEn: "Professional",
      priceMonthly: 179000,
      price3Months: 163000,
      priceYearly: 134000,
      total3MonthsVi: "Tổng: 489.000đ/3 tháng",
      total3MonthsEn: "Total: 489,000đ/3 months",
      totalYearlyVi: "Tổng: 1.610.000đ/năm",
      totalYearlyEn: "Total: 1,610,000đ/year",
      features: [
        { labelVi: "Tất cả tính năng Cơ bản", labelEn: "All Basic features included" },
        { labelVi: "2900 điểm/tháng (~290 bài viết)", labelEn: "2900 credits/month (~290 posts)" },
        { labelVi: "🎬 Tải video lên để tạo bài viết với AI", labelEn: "🎬 Upload video to create AI post content" },
        { labelVi: "👁️ Chế độ Duyệt bài viết trước khi đăng tự động", labelEn: "👁️ Manual review workflow before auto-posting" },
        { labelVi: "Ưu tiên hỗ trợ và hướng dẫn", labelEn: "Priority support and tutorials" },
        { labelVi: "❌ Không có: Tạo ảnh AI & Tích hợp Website", labelEn: "❌ Excluded: AI Image Generation & Web integration", type: "error" }
      ]
    },
    {
      id: "premium",
      nameVi: "Cao Cấp",
      nameEn: "Premium",
      priceMonthly: 249000,
      price3Months: 226000,
      priceYearly: 187000,
      total3MonthsVi: "Tổng: 679.000đ/3 tháng",
      total3MonthsEn: "Total: 679,000đ/3 months",
      totalYearlyVi: "Tổng: 2.240.000đ/năm",
      totalYearlyEn: "Total: 2,240,000đ/year",
      features: [
        { labelVi: "Tất cả tính năng gói Chuyên nghiệp", labelEn: "All Professional features included" },
        { labelVi: "4300 điểm/tháng (~430 bài viết)", labelEn: "4300 credits/month (~430 posts)" },
        { labelVi: "🎨 🤖 Tạo ảnh AI tự động cho bài viết", labelEn: "🎨 🤖 Automatic AI Image Generation for posts" },
        { labelVi: "🌐 AI Viết Bài Chuyên Sâu cho Website WordPress", labelEn: "🌐 AI Deep Content Writer for WordPress" },
        { labelVi: "🌐 Đăng bài tự động lên website WordPress", labelEn: "🌐 Auto-publish articles to WordPress websites" },
        { labelVi: "🌐 Ưu tiên hỗ trợ tích hợp Website & Zalo OA", labelEn: "🌐 Priority support for Web & Zalo OA integrations" }
      ]
    },
    {
      id: "vip",
      nameVi: "VIP",
      nameEn: "VIP",
      priceMonthly: null,
      price3Months: null,
      priceYearly: null,
      total3MonthsVi: "",
      total3MonthsEn: "",
      totalYearlyVi: "",
      totalYearlyEn: "",
      contact: true,
      features: [
        { labelVi: "Tất cả tính năng Cao Cấp", labelEn: "All Premium features included" },
        { labelVi: "Số lượng điểm tùy chỉnh", labelEn: "Custom credits volume" },
        { labelVi: "Đào tạo và hỗ trợ riêng", labelEn: "Dedicated private 1-on-1 support" },
        { labelVi: "Tích hợp theo yêu cầu", labelEn: "On-demand customized integration" },
        { labelVi: "Nhiều ưu đãi khác", labelEn: "Various exclusive benefits" }
      ]
    }
  ];

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
          {lang === "en" ? "Choose the plan that fits you" : "Chọn gói phù hợp với bạn"}
        </h2>
        <p className="text-sm text-zinc-450 mt-2 max-w-xl mx-auto">
          {lang === "en" ? "Automate content marketing, scale revenue limits infinitely." : "Tự động hóa content marketing, tăng doanh thu không giới hạn"}
        </p>
      </div>

      {/* Cycle Toggle Selector */}
      <div className="flex justify-center mt-2 mb-4">
        <div className="relative p-1 rounded-2xl bg-zinc-950/40 border border-white/5 flex gap-1 items-center z-10">
          
          <button
            onClick={() => setCycle("monthly")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              cycle === "monthly"
                ? "bg-[#6C63FF] text-white shadow-md shadow-[#6C63FF]/10"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {lang === "en" ? "Monthly" : "Theo tháng"}
          </button>

          <button
            onClick={() => setCycle("3months")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              cycle === "3months"
                ? "bg-[#6C63FF] text-white shadow-md shadow-[#6C63FF]/10"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {lang === "en" ? "3 Months (10% Off)" : "3 tháng (Giảm 10%)"}
          </button>

          <div className="relative">
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-sm">
              {lang === "en" ? "Best Deal - 25% Off" : "Giá tốt nhất - Giảm 25%"}
            </span>
            <button
              onClick={() => setCycle("yearly")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                cycle === "yearly"
                  ? "bg-[#6C63FF] text-white shadow-md shadow-[#6C63FF]/10"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {lang === "en" ? "Yearly (25% Off)" : "Theo năm (Giảm 25%)"}
            </button>
          </div>

        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#6C63FF]" />
          <span className="text-xs">{lang === "en" ? "Loading tables..." : "Đang tải bảng giá..."}</span>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          
          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {plans.map((plan) => {
              const isRecommended = plan.recommended;

              // Extract prices based on active cycle
              let currentPrice = plan.priceMonthly;
              let originalPrice = null;
              let totalLabel = "";
              let discountBadge = "";

              if (cycle === "3months" && !plan.contact) {
                currentPrice = plan.price3Months;
                originalPrice = plan.priceMonthly;
                totalLabel = lang === "en" ? plan.total3MonthsEn : plan.total3MonthsVi;
                discountBadge = "-10%";
              } else if (cycle === "yearly" && !plan.contact) {
                currentPrice = plan.priceYearly;
                originalPrice = plan.priceMonthly;
                totalLabel = lang === "en" ? plan.totalYearlyEn : plan.totalYearlyVi;
                discountBadge = "-25%";
              }

              return (
                <div
                  key={plan.id}
                  className={`rounded-3xl p-6 flex flex-col justify-between border relative transition-all duration-350 hover:translate-y-[-4px] ${
                    isRecommended 
                      ? "bg-gradient-to-b from-[#6C63FF]/15 via-zinc-900/40 to-zinc-950/60 border-[#6C63FF] shadow-xl shadow-[#6C63FF]/5" 
                      : "bg-zinc-900/30 border-white/5 shadow-lg"
                  }`}
                >
                  {/* Recommended Badge */}
                  {isRecommended && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-[#6C63FF] text-[9px] text-white font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow shadow-[#6C63FF]/30 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {lang === "en" ? "Most Popular" : "Phổ biến nhất"}
                    </span>
                  )}

                  <div className="flex flex-col gap-6">
                    {/* Header */}
                    <div className="flex flex-col gap-2">
                      <span className="flex items-center text-sm font-bold text-zinc-200">
                        {lang === "en" ? plan.nameEn : plan.nameVi}
                        {discountBadge && (
                          <span className="ml-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md">
                            {discountBadge}
                          </span>
                        )}
                      </span>

                      {plan.contact ? (
                        <div className="flex items-baseline mt-2 h-16">
                          <span className="text-3xl font-extrabold text-white">
                            {lang === "en" ? "Contact Us" : "Liên hệ"}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col mt-2 h-16 justify-center">
                          <div className="flex items-baseline gap-1">
                            <span className="text-base text-zinc-400 mr-0.5">đ</span>
                            <span className="text-3xl font-black text-white">
                              {currentPrice?.toLocaleString("vi-VN")}
                            </span>
                            <span className="text-xs text-zinc-500 font-semibold ml-0.5">
                              {lang === "en" ? "/month" : "/tháng"}
                            </span>
                          </div>

                          {/* Crossed price & Total annual/quarterly cost */}
                          {originalPrice && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-zinc-500 line-through">
                                đ{originalPrice.toLocaleString("vi-VN")}
                              </span>
                              <span className="text-[10px] text-zinc-450 font-medium">
                                {totalLabel}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <hr className="border-white/5" />

                    {/* Features list */}
                    <ul className="flex flex-col gap-3">
                      {plan.features.map((feat, idx) => {
                        const isWarning = feat.type === "warning";
                        const isError = feat.type === "error";

                        return (
                          <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300 leading-relaxed">
                            {isError ? (
                              <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            ) : isWarning ? (
                              <span className="w-4 h-4 shrink-0 flex items-center justify-center text-yellow-500 font-bold select-none mt-0.5">
                                !
                              </span>
                            ) : (
                              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            )}
                            <span className={isError ? "text-zinc-555 line-through" : isWarning ? "text-zinc-400" : ""}>
                              {lang === "en" ? feat.labelEn : feat.labelVi}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleUpgradeClick(lang === "en" ? plan.nameEn : plan.nameVi)}
                    className={`w-full py-2.5 mt-8 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${
                      isRecommended
                        ? "bg-[#6C63FF] text-white hover:bg-[#584feb] shadow-lg shadow-[#6C63FF]/15"
                        : "bg-zinc-800/60 hover:bg-zinc-800 text-zinc-200 border border-white/5"
                    }`}
                  >
                    {plan.contact
                      ? (lang === "en" ? "Contact Support" : "Liên hệ ngay")
                      : (lang === "en" ? "Subscribe Now" : "Đăng ký ngay")}
                  </button>

                </div>
              );
            })}
          </div>

          {/* Detailed Features Comparison Table */}
          <div className="flex flex-col gap-6 mt-6">
            <div className="text-center mt-4">
              <h3 className="text-xl font-bold text-white">
                {lang === "en" ? "Detailed Feature Matrix" : "So sánh chi tiết tính năng giữa các gói"}
              </h3>
              <p className="text-xs text-zinc-450 mt-1">
                {lang === "en" ? "See the exact differences to choose the best option." : "Xem chi tiết sự khác biệt để lựa chọn gói phù hợp nhất với nhu cầu của bạn"}
              </p>
            </div>

            <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-zinc-950/40 text-zinc-400 font-bold">
                      <th className="p-5">{lang === "en" ? "Feature" : "Tính năng"}</th>
                      <th className="p-5 w-[22%] text-center">Cơ bản</th>
                      <th className="p-5 w-[22%] text-center">Chuyên nghiệp</th>
                      <th className="p-5 w-[22%] text-center">Cao Cấp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-zinc-300">
                    
                    {/* Row 1 */}
                    <tr className="hover:bg-white/[0.01]">
                      <td className="p-5">
                        <span className="font-bold text-zinc-250 block text-xs">
                          {lang === "en" ? "Monthly Post Credits" : "Điểm bài viết hàng tháng"}
                        </span>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">
                          {lang === "en" ? "Credits used for AI post generation & publishing" : "Điểm dùng để tạo & đăng bài viết AI"}
                        </span>
                      </td>
                      <td className="p-5 text-center">
                        <span className="font-bold text-zinc-250 block">1.000 điểm</span>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">(~100 bài)</span>
                      </td>
                      <td className="p-5 text-center">
                        <span className="font-bold text-zinc-250 block">2.900 điểm</span>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">(~290 bài)</span>
                      </td>
                      <td className="p-5 text-center">
                        <span className="font-bold text-[#6C63FF] block">4.300 điểm</span>
                        <span className="text-[10px] text-[#6C63FF]/80 block mt-0.5">(~430 bài)</span>
                      </td>
                    </tr>

                    {/* Row 2 */}
                    <tr className="hover:bg-white/[0.01]">
                      <td className="p-5">
                        <span className="font-bold text-zinc-250 block text-xs">
                          {lang === "en" ? "Create Posts from Topic & Image" : "Tạo bài viết từ chủ đề & từ ảnh"}
                        </span>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">
                          {lang === "en" ? "Write content automatically from prompt or product photo" : "Viết nội dung tự động dựa trên prompt hoặc hình ảnh sản phẩm"}
                        </span>
                      </td>
                      <td className="p-5 text-center">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-sm">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-sm">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-sm">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </td>
                    </tr>

                    {/* Row 3 */}
                    <tr className="hover:bg-white/[0.01]">
                      <td className="p-5">
                        <span className="font-bold text-zinc-250 block text-xs">
                          {lang === "en" ? "Auto-post to Facebook Page" : "Đăng bài tự động Fanpage Facebook"}
                        </span>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">
                          {lang === "en" ? "Schedule and automatically publish to your pages" : "Lên lịch và tự động đăng nội dung lên các Fanpage của bạn"}
                        </span>
                      </td>
                      <td className="p-5 text-center">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-sm">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-sm">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-sm">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </td>
                    </tr>

                    {/* Row 4 */}
                    <tr className="hover:bg-white/[0.01]">
                      <td className="p-5">
                        <span className="font-bold text-zinc-250 block text-xs flex items-center gap-1">
                          💬 {lang === "en" ? "Auto-post to Zalo OA" : "Đăng bài tự động lên Zalo OA"}
                        </span>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">
                          {lang === "en" ? "Automatically schedule & publish to Zalo Official Account" : "Tự động lên lịch và gửi/đăng bài viết lên Zalo Official Account"}
                        </span>
                      </td>
                      <td className="p-5 text-center">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-sm">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-sm">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-sm">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </td>
                    </tr>

                    {/* Row 5 */}
                    <tr className="hover:bg-white/[0.01]">
                      <td className="p-5">
                        <span className="font-bold text-zinc-250 block text-xs flex items-center gap-1">
                          🎬 {lang === "en" ? "AI Video Post Generation" : "Tải video tạo bài viết bằng AI"}
                        </span>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">
                          {lang === "en" ? "Extract text content from uploaded videos to write automatically" : "Trích xuất nội dung từ video tải lên để viết bài tự động"}
                        </span>
                      </td>
                      <td className="p-5 text-center">
                        <div className="w-5 h-5 rounded-full bg-zinc-300 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-500 flex items-center justify-center mx-auto">
                          <X className="w-3 h-3 stroke-[3]" />
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-sm">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-sm">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </td>
                    </tr>

                    {/* Row 6 */}
                    <tr className="hover:bg-white/[0.01]">
                      <td className="p-5">
                        <span className="font-bold text-zinc-250 block text-xs flex items-center gap-1">
                          👁️ {lang === "en" ? "Manual Review Before Posting" : "Chế độ Duyệt bài trước khi đăng"}
                        </span>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">
                          {lang === "en" ? "Review and edit AI content before official scheduling" : "Duyệt và chỉnh sửa bài viết AI trước khi lên lịch đăng chính thức"}
                        </span>
                      </td>
                      <td className="p-5 text-center">
                        <div className="w-5 h-5 rounded-full bg-zinc-300 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-500 flex items-center justify-center mx-auto">
                          <X className="w-3 h-3 stroke-[3]" />
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-sm">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-sm">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </td>
                    </tr>

                    {/* Row 7 */}
                    <tr className="hover:bg-white/[0.01]">
                      <td className="p-5">
                        <span className="font-bold text-zinc-250 block text-xs flex items-center gap-1">
                          🎨 🤖 {lang === "en" ? "AI Image Generation" : "Tạo ảnh AI tự động cho bài viết"}
                        </span>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">
                          {lang === "en" ? "Automatically generate high-quality illustration images using AI" : "Tự động tạo hình ảnh minh họa chất lượng cao bằng AI (Gemini/DALL-E)"}
                        </span>
                      </td>
                      <td className="p-5 text-center">
                        <div className="w-5 h-5 rounded-full bg-zinc-300 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-500 flex items-center justify-center mx-auto">
                          <X className="w-3 h-3 stroke-[3]" />
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <div className="w-5 h-5 rounded-full bg-zinc-300 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-500 flex items-center justify-center mx-auto">
                          <X className="w-3 h-3 stroke-[3]" />
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center mx-auto shadow-sm">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </td>
                    </tr>

                    {/* Row 8 */}
                    <tr className="hover:bg-white/[0.01]">
                      <td className="p-5">
                        <span className="font-bold text-zinc-250 block text-xs flex items-center gap-1">
                          🌐 {lang === "en" ? "Auto-post to WordPress" : "Đăng bài tự động lên Website WordPress"}
                        </span>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">
                          {lang === "en" ? "Automatically sync and publish articles directly to WordPress" : "Tự động đồng bộ và xuất bản bài viết trực tiếp lên Website WordPress"}
                        </span>
                      </td>
                      <td className="p-5 text-center">
                        <div className="w-5 h-5 rounded-full bg-zinc-300 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-500 flex items-center justify-center mx-auto">
                          <X className="w-3 h-3 stroke-[3]" />
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <div className="w-5 h-5 rounded-full bg-zinc-300 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-500 flex items-center justify-center mx-auto">
                          <X className="w-3 h-3 stroke-[3]" />
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center mx-auto shadow-sm">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </td>
                    </tr>

                    {/* Row 9 */}
                    <tr className="hover:bg-white/[0.01]">
                      <td className="p-5">
                        <span className="font-bold text-zinc-250 block text-xs flex items-center gap-1">
                          🌐 {lang === "en" ? "AI Deep Content Writer for Web" : "AI viết bài chuyên sâu cho Website"}
                        </span>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">
                          {lang === "en" ? "Create deep SEO articles matching WordPress post structures" : "AI viết bài chuyên sâu cho Website"}
                        </span>
                      </td>
                      <td className="p-5 text-center">
                        <div className="w-5 h-5 rounded-full bg-zinc-300 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-500 flex items-center justify-center mx-auto">
                          <X className="w-3 h-3 stroke-[3]" />
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <div className="w-5 h-5 rounded-full bg-zinc-300 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-500 flex items-center justify-center mx-auto">
                          <X className="w-3 h-3 stroke-[3]" />
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center mx-auto shadow-sm">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Mua thêm điểm Section */}
          <div className="flex flex-col gap-6 mt-12">
            <div className="text-center">
              <h3 className="text-xl font-bold text-white">
                {lang === "en" ? "Buy Extra Credits" : "Mua thêm điểm"}
              </h3>
              <p className="text-xs text-zinc-450 mt-1">
                {lang === "en" ? "Purchased credits are used permanently with no expiration date." : "Điểm mua thêm được sử dụng vĩnh viễn, không có thời hạn"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              {[
                {
                  id: "credit_savings",
                  nameVi: "Gói Tiết Kiệm",
                  nameEn: "Savings Package",
                  credits: "300 điểm",
                  price: "đ 25.000",
                  descVi: "Phù hợp cho người dùng gói Cơ bản cần thêm ~30 bài viết",
                  descEn: "Suitable for Basic plan users needing ~30 more posts"
                },
                {
                  id: "credit_standard",
                  nameVi: "Gói Tiêu Chuẩn",
                  nameEn: "Standard Package",
                  credits: "700 điểm",
                  price: "đ 55.000",
                  descVi: "Bổ sung thêm ~70 bài viết cho tài khoản",
                  descEn: "Add ~70 more posts to your account"
                },
                {
                  id: "credit_premium",
                  nameVi: "Gói Cao Cấp",
                  nameEn: "Premium Package",
                  credits: "2000 điểm",
                  price: "đ 120.000",
                  descVi: "Bổ sung thêm ~200 bài viết cho tài khoản",
                  descEn: "Add ~200 more posts to your account"
                },
                {
                  id: "credit_enterprise",
                  nameVi: "Gói Doanh Nghiệp",
                  nameEn: "Enterprise Package",
                  credits: "5000 điểm",
                  price: "đ 250.000",
                  descVi: "Dành cho người dùng chuyên nghiệp cần số lượng lớn",
                  descEn: "For professional users requiring high volume"
                }
              ].map((pkg) => (
                <div
                  key={pkg.id}
                  className="glass-panel p-6 rounded-3xl border border-white/5 bg-zinc-900/30 flex flex-col justify-between text-center transition-all duration-350 hover:translate-y-[-4px]"
                >
                  <div className="flex flex-col gap-4">
                    <span className="text-xs font-bold text-zinc-400 block">
                      {lang === "en" ? pkg.nameEn : pkg.nameVi}
                    </span>
                    <span className="text-2xl font-black text-[#6C63FF] block">
                      {pkg.credits}
                    </span>
                    <span className="text-xl font-bold text-white block">
                      {pkg.price}
                    </span>
                    <p className="text-[11px] text-zinc-500 leading-relaxed max-w-[200px] mx-auto">
                      {lang === "en" ? pkg.descEn : pkg.descVi}
                    </p>
                  </div>

                  <button
                    onClick={() => handleUpgradeClick(lang === "en" ? pkg.nameEn : pkg.nameVi)}
                    className="w-full py-2.5 mt-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-lg shadow-blue-500/10"
                  >
                    {lang === "en" ? "Buy Now" : "Mua ngay"}
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel p-6 rounded-3xl border border-white/5 w-full max-w-sm shadow-2xl flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#6C63FF]/15 border border-[#6C63FF]/30 flex items-center justify-center text-[#6C63FF] mx-auto animate-bounce">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase text-zinc-200 tracking-wider">
                {lang === "en" ? "Coming Soon" : "Tính năng đang được phát triển"}
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed mt-2">
                {lang === "en"
                  ? `Payment gateway integration to upgrade to ${targetPlanName} package is coming soon in the next sprint.`
                  : `Cổng thanh toán điện tử để nâng cấp lên gói dịch vụ ${targetPlanName} sẽ sớm được ra mắt và hoàn thiện trong Phase tiếp theo.`}
              </p>
            </div>
            <button
              onClick={() => setShowComingSoon(false)}
              className="py-2.5 w-full mt-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer shadow-lg shadow-blue-500/10 active:scale-95"
            >
              {lang === "en" ? "Close" : "Đóng"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
