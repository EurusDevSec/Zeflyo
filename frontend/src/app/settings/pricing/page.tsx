"use client";

import React, { useState, useEffect } from "react";
import {
  Check,
  X,
  HelpCircle,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Copy,
  CreditCard,
  Clock,
  AlertTriangle
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

  // Checkout Modal states
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutCode, setCheckoutCode] = useState("");
  const [checkoutAmount, setCheckoutAmount] = useState(0);
  const [checkoutPlanId, setCheckoutPlanId] = useState("");
  const [checkoutCycle, setCheckoutCycle] = useState<"monthly" | "3months" | "yearly" | null>(null);
  const [checkoutPlanName, setCheckoutPlanName] = useState("");
  const [copiedState, setCopiedState] = useState<"account" | "amount" | "code" | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentTimeLeft, setPaymentTimeLeft] = useState(900);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Custom/Dynamic Bank states (Defaulting to Vietcombank corporate details)
  const [checkoutBankName, setCheckoutBankName] = useState("Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)");
  const [checkoutBankCode, setCheckoutBankCode] = useState("VCB");
  const [checkoutAccountNumber, setCheckoutAccountNumber] = useState("1002202688888");
  const [checkoutAccountName, setCheckoutAccountName] = useState("CONG TY CO PHAN ZEFLYO");

  // Active Subscription States
  const [activePlan, setActivePlan] = useState<string>("free");
  const [activeExpiry, setActiveExpiry] = useState<string | null>(null);
  const [activeCredits, setActiveCredits] = useState<number>(0);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [cancelFeedback, setCancelFeedback] = useState("");

  const fetchActiveSubscription = async () => {
    const savedToken = localStorage.getItem("zeflyo_token");
    const savedApiBase = localStorage.getItem("zeflyo_api_base") || "http://localhost";

    if (!savedToken || savedToken.startsWith("mock_")) {
      const savedUser = localStorage.getItem("zeflyo_user");
      if (savedUser) {
        try {
          const u = JSON.parse(savedUser);
          setActivePlan(u.subscription_plan || "free");
          setActiveExpiry(u.subscription_expires_at || null);
          setActiveCredits(u.credits || 0);
        } catch (e) {
          console.error(e);
        }
      }
      return;
    }

    try {
      const res = await fetch(`${savedApiBase}/api/user/subscription`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${savedToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setActivePlan(data.plan || "free");
        setActiveExpiry(data.expires_at || null);
        setActiveCredits(data.credits || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const savedLang = localStorage.getItem("zeflyo_lang") || "vi";
    setLang(savedLang as "en" | "vi");

    const handleLangChange = () => {
      const updatedLang = localStorage.getItem("zeflyo_lang") || "vi";
      setLang(updatedLang as "en" | "vi");
    };

    window.addEventListener("zeflyo_lang_changed", handleLangChange);

    // Listen for dynamic profile updates
    const handleProfileUpdate = () => {
      fetchActiveSubscription();
    };
    window.addEventListener("zeflyo_profile_updated", handleProfileUpdate);

    fetchActiveSubscription();

    return () => {
      window.removeEventListener("zeflyo_lang_changed", handleLangChange);
      window.removeEventListener("zeflyo_profile_updated", handleProfileUpdate);
    };
  }, []);

  // Reset payment timer on modal open
  useEffect(() => {
    if (showCheckoutModal) {
      setPaymentTimeLeft(900);
    }
  }, [showCheckoutModal]);

  // Payment countdown timer
  useEffect(() => {
    let timerId: any;
    if (showCheckoutModal && !paymentSuccess && paymentTimeLeft > 0) {
      timerId = setInterval(() => {
        setPaymentTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [showCheckoutModal, paymentSuccess, paymentTimeLeft]);

  // Polling loop for active payment verification
  useEffect(() => {
    let intervalId: any;

    if (showCheckoutModal && !paymentSuccess && paymentTimeLeft > 0) {
      const savedToken = localStorage.getItem("zeflyo_token");
      const savedApiBase = localStorage.getItem("zeflyo_api_base") || "http://localhost";

      if (savedToken && !savedToken.startsWith("mock_")) {
        intervalId = setInterval(async () => {
          try {
            const res = await fetch(`${savedApiBase}/api/user/profile`, {
              headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${savedToken}`
              }
            });
            if (res.ok) {
              const u = await res.json();
              const cachedUserStr = localStorage.getItem("zeflyo_user");

              if (cachedUserStr) {
                const cachedUser = JSON.parse(cachedUserStr);

                if (checkoutPlanId.startsWith("credit_")) {
                  if (u.credits > (cachedUser.credits || 0)) {
                    localStorage.setItem("zeflyo_user", JSON.stringify(u));
                    window.dispatchEvent(new Event("zeflyo_profile_updated"));
                    setPaymentSuccess(true);
                  }
                } else {
                  if (u.subscription_plan === checkoutPlanId) {
                    localStorage.setItem("zeflyo_user", JSON.stringify(u));
                    window.dispatchEvent(new Event("zeflyo_profile_updated"));
                    setPaymentSuccess(true);
                  }
                }
              } else {
                if (checkoutPlanId.startsWith("credit_") && u.credits > 0) {
                  localStorage.setItem("zeflyo_user", JSON.stringify(u));
                  window.dispatchEvent(new Event("zeflyo_profile_updated"));
                  setPaymentSuccess(true);
                } else if (u.subscription_plan === checkoutPlanId) {
                  localStorage.setItem("zeflyo_user", JSON.stringify(u));
                  window.dispatchEvent(new Event("zeflyo_profile_updated"));
                  setPaymentSuccess(true);
                }
              }
            }
          } catch (e) {
            console.error("Polling error:", e);
          }
        }, 2500);
      }
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [showCheckoutModal, paymentSuccess, checkoutPlanId, checkoutCode, paymentTimeLeft]);

  useEffect(() => {
    if (paymentSuccess) {
      const timer = setTimeout(() => {
        setShowCheckoutModal(false);
        setPaymentSuccess(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [paymentSuccess]);

  const handleUpgradeClick = async (
    planId: string,
    nameVi: string,
    nameEn: string,
    price: number | null,
    isContact?: boolean,
    cycleOpt?: "monthly" | "3months" | "yearly"
  ) => {
    if (isContact) {
      window.location.href = "/settings/support";
      return;
    }

    if (price === null) return;

    // Calculate total price based on cycle
    let amount = price;
    if (cycleOpt === "3months") {
      if (planId === "basic") amount = 219000;
      else if (planId === "pro") amount = 489000;
      else if (planId === "premium") amount = 679000;
    } else if (cycleOpt === "yearly") {
      if (planId === "basic") amount = 710000;
      else if (planId === "pro") amount = 1610000;
      else if (planId === "premium") amount = 2240000;
    }

    setPaymentLoading(true);
    setCheckoutPlanId(planId);

    const titleVi = planId.startsWith("credit_")
      ? `Gói ${nameVi}`
      : `Gói ${nameVi} - ${cycleOpt === "monthly" ? "Tháng" : cycleOpt === "3months" ? "3 Tháng" : "Năm"}`;
    const titleEn = planId.startsWith("credit_")
      ? `${nameEn} Package`
      : `${nameEn} Plan - ${cycleOpt === "monthly" ? "Monthly" : cycleOpt === "3months" ? "3 Months" : "Yearly"}`;

    setCheckoutPlanName(lang === "en" ? titleEn : titleVi);
    setCheckoutAmount(amount);

    const savedToken = localStorage.getItem("zeflyo_token");
    const savedApiBase = localStorage.getItem("zeflyo_api_base") || "http://localhost";

    if (!savedToken || savedToken.startsWith("mock_")) {
      // Simulate locally
      const mockCode = "ZF" + Math.random().toString(36).substring(2, 10).toUpperCase();
      setCheckoutCode(mockCode);
      setCheckoutCycle(cycleOpt || null);
      setCheckoutBankName("Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)");
      setCheckoutBankCode("VCB");
      setCheckoutAccountNumber("1002202688888");
      setCheckoutAccountName("CONG TY CO PHAN ZEFLYO");
      setShowCheckoutModal(true);
      setPaymentLoading(false);
      return;
    }

    try {
      const res = await fetch(`${savedApiBase}/api/payments/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${savedToken}`
        },
        body: JSON.stringify({
          plan_id: planId,
          cycle: cycleOpt || null,
          amount: amount
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCheckoutCode(data.payment.code);
          setCheckoutCycle(cycleOpt || null);
          setCheckoutBankName(data.bank.name);
          setCheckoutBankCode(data.bank.code);
          setCheckoutAccountNumber(data.bank.account_number);
          setCheckoutAccountName(data.bank.account_name);
          setShowCheckoutModal(true);
        }
      } else {
        console.error("Failed to create pending payment");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCopyText = (text: string, type: "account" | "amount" | "code") => {
    navigator.clipboard.writeText(text);
    setCopiedState(type);
    setTimeout(() => setCopiedState(null), 2000);
  };

  const handleSimulateWebhook = async () => {
    setSimulating(true);

    const savedToken = localStorage.getItem("zeflyo_token");
    const savedApiBase = localStorage.getItem("zeflyo_api_base") || "http://localhost";

    if (!savedToken || savedToken.startsWith("mock_")) {
      setTimeout(() => {
        const savedUser = localStorage.getItem("zeflyo_user");
        if (savedUser) {
          try {
            const u = JSON.parse(savedUser);
            if (checkoutPlanId.startsWith("credit_")) {
              let creditsToAdd = 0;
              if (checkoutPlanId === "credit_savings") creditsToAdd = 300;
              else if (checkoutPlanId === "credit_standard") creditsToAdd = 700;
              else if (checkoutPlanId === "credit_premium") creditsToAdd = 2000;
              else if (checkoutPlanId === "credit_enterprise") creditsToAdd = 5000;
              u.credits = (u.credits || 0) + creditsToAdd;
            } else {
              u.subscription_plan = checkoutPlanId;
              let months = 1;
              if (checkoutCycle === "3months") months = 3;
              else if (checkoutCycle === "yearly") months = 12;

              const expDate = new Date();
              expDate.setMonth(expDate.getMonth() + months);
              u.subscription_expires_at = expDate.toISOString();

              let creditsToAdd = 0;
              if (checkoutPlanId === "basic") creditsToAdd = 1000;
              else if (checkoutPlanId === "pro") creditsToAdd = 2900;
              else if (checkoutPlanId === "premium") creditsToAdd = 4300;
              u.credits = (u.credits || 0) + creditsToAdd;
            }

            localStorage.setItem("zeflyo_user", JSON.stringify(u));
            window.dispatchEvent(new Event("zeflyo_profile_updated"));
            setPaymentSuccess(true);
          } catch (e) {
            console.error(e);
          }
        }
        setSimulating(false);
      }, 1500);
      return;
    }

    try {
      const res = await fetch(`${savedApiBase}/api/webhook/sepay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          code: checkoutCode,
          amount: checkoutAmount,
          gateway: "KienLongBank",
          transferType: "in",
          transferAmount: checkoutAmount
        })
      });

      if (res.ok) {
        // Successful webhook trigger
        // The polling loop will detect the status change
      } else {
        console.error("Webhook simulation failed");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  const handleCancelSubscription = async (reasons: string[], feedback: string) => {
    setCancelling(true);

    const savedToken = localStorage.getItem("zeflyo_token");
    const savedApiBase = localStorage.getItem("zeflyo_api_base") || "http://localhost";

    if (!savedToken || savedToken.startsWith("mock_")) {
      // Mock cancel
      setTimeout(() => {
        const savedUser = localStorage.getItem("zeflyo_user");
        if (savedUser) {
          try {
            const u = JSON.parse(savedUser);
            u.subscription_plan = "free";
            u.subscription_expires_at = null;
            localStorage.setItem("zeflyo_user", JSON.stringify(u));
            window.dispatchEvent(new Event("zeflyo_profile_updated"));

            // Reload local states
            setActivePlan("free");
            setActiveExpiry(null);
          } catch (e) {
            console.error(e);
          }
        }
        setCancelling(false);
        setShowCancelModal(false);
      }, 1000);
      return;
    }

    try {
      const res = await fetch(`${savedApiBase}/api/user/subscription/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${savedToken}`
        },
        body: JSON.stringify({
          reasons: reasons,
          feedback: feedback
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Trigger profile update so Sidebar and local components reload
          const profileRes = await fetch(`${savedApiBase}/api/user/profile`, {
            headers: {
              "Accept": "application/json",
              "Authorization": `Bearer ${savedToken}`
            }
          });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            localStorage.setItem("zeflyo_user", JSON.stringify(profileData));
            window.dispatchEvent(new Event("zeflyo_profile_updated"));
          }
          setShowCancelModal(false);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCancelling(false);
    }
  };

  const plans: Plan[] = [
    {
      id: "basic",
      nameVi: "Cơ bản",
      nameEn: "Basic",
      priceMonthly: 79000,
      price3Months: 73000,
      priceYearly: 59000,
      total3MonthsVi: "Tổng: 219000đ/3 tháng",
      total3MonthsEn: "Total: 219000đ/3 months",
      totalYearlyVi: "Tổng: 710000đ/năm",
      totalYearlyEn: "Total: 710000đ/year",
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
      total3MonthsVi: "Tổng: 489000đ/3 tháng",
      total3MonthsEn: "Total: 489000đ/3 months",
      totalYearlyVi: "Tổng: 1610000đ/năm",
      totalYearlyEn: "Total: 1610000đ/year",
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
      total3MonthsVi: "Tổng: 679000đ/3 tháng",
      total3MonthsEn: "Total: 679000đ/3 months",
      totalYearlyVi: "Tổng: 2240000đ/năm",
      totalYearlyEn: "Total: 2240000đ/year",
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

      {/* Active Subscription Banner */}
      <div className="glass-panel p-5 rounded-3xl border border-white/5 bg-zinc-900/40 flex flex-col sm:flex-row justify-between items-center gap-4 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#6C63FF]/15 border border-[#6C63FF]/30 flex items-center justify-center text-[#6C63FF]">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              {lang === "en" ? "Your Current Plan" : "Gói dịch vụ hiện tại"}
            </span>
            <span className="text-sm font-black text-white flex items-center gap-2 mt-0.5">
              {activePlan === "free" ? (lang === "en" ? "Free Tier" : "Gói Miễn Phí") :
                activePlan === "basic" ? (lang === "en" ? "Basic Plan" : "Gói Cơ Bản") :
                  activePlan === "pro" ? (lang === "en" ? "Professional Plan" : "Gói Chuyên Nghiệp") :
                    activePlan === "premium" ? (lang === "en" ? "Premium Plan" : "Gói Cao Cấp") : activePlan.toUpperCase()}

              {activePlan !== "free" && (
                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                  {lang === "en" ? "Active" : "Đang hoạt động"}
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col sm:text-right">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              {lang === "en" ? "Total Points" : "Tổng điểm"}
            </span>
            <span className="text-base font-extrabold text-emerald-400 mt-0.5">
              {activeCredits} pts
            </span>
          </div>

          {activeExpiry && (
            <div className="flex flex-col sm:text-right border-l border-white/5 pl-6">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                {lang === "en" ? "Expiration Date" : "Ngày hết hạn"}
              </span>
              <span className="text-xs text-zinc-300 font-mono mt-0.5">
                {new Date(activeExpiry).toLocaleDateString(lang === "en" ? "en-US" : "vi-VN", {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </span>
            </div>
          )}

          {activePlan !== "free" && (
            <div className="border-l border-white/5 pl-6">
              <button
                onClick={() => {
                  setSelectedReasons([]);
                  setCancelFeedback("");
                  setShowCancelModal(true);
                }}
                disabled={cancelling}
                className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {cancelling ? (lang === "en" ? "Processing..." : "Đang huỷ...") : (lang === "en" ? "Cancel Plan" : "Huỷ gói")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cycle Toggle Selector */}
      <div className="flex justify-center mt-2 mb-4">
        <div className="relative p-1 rounded-2xl bg-zinc-950/40 border border-white/5 flex gap-1 items-center z-10">

          <button
            onClick={() => setCycle("monthly")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${cycle === "monthly"
                ? "bg-[#6C63FF] text-white shadow-md shadow-[#6C63FF]/10"
                : "text-zinc-400 hover:text-zinc-200"
              }`}
          >
            {lang === "en" ? "Monthly" : "Theo tháng"}
          </button>

          <button
            onClick={() => setCycle("3months")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${cycle === "3months"
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
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${cycle === "yearly"
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
                  className={`rounded-3xl p-6 flex flex-col justify-between border relative transition-all duration-350 hover:translate-y-[-4px] ${isRecommended
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
                              {currentPrice}
                            </span>
                            <span className="text-xs text-zinc-500 font-semibold ml-0.5">
                              {lang === "en" ? "/month" : "/tháng"}
                            </span>
                          </div>

                          {/* Crossed price & Total annual/quarterly cost */}
                          {originalPrice && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-zinc-500 line-through">
                                đ{originalPrice}
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
                    onClick={() => handleUpgradeClick(
                      plan.id,
                      plan.nameVi,
                      plan.nameEn,
                      plan.priceMonthly,
                      plan.contact,
                      cycle
                    )}
                    className={`w-full py-2.5 mt-8 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${isRecommended
                        ? "bg-[#6C63FF] text-white hover:bg-[#584feb] shadow-lg shadow-[#6C63FF]/15"
                        : "bg-zinc-800/60 hover:bg-zinc-800 text-zinc-200 border border-white/5"
                      }`}
                    disabled={paymentLoading}
                  >
                    {paymentLoading && checkoutPlanId === plan.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : plan.contact ? (
                      (lang === "en" ? "Contact Support" : "Liên hệ ngay")
                    ) : (
                      (lang === "en" ? "Subscribe Now" : "Đăng ký ngay")
                    )}
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
                  price: "đ 25000",
                  descVi: "Phù hợp cho người dùng gói Cơ bản cần thêm ~30 bài viết",
                  descEn: "Suitable for Basic plan users needing ~30 more posts"
                },
                {
                  id: "credit_standard",
                  nameVi: "Gói Tiêu Chuẩn",
                  nameEn: "Standard Package",
                  credits: "700 điểm",
                  price: "đ 55000",
                  descVi: "Bổ sung thêm ~70 bài viết cho tài khoản",
                  descEn: "Add ~70 more posts to your account"
                },
                {
                  id: "credit_premium",
                  nameVi: "Gói Cao Cấp",
                  nameEn: "Premium Package",
                  credits: "2000 điểm",
                  price: "đ 120000",
                  descVi: "Bổ sung thêm ~200 bài viết cho tài khoản",
                  descEn: "Add ~200 more posts to your account"
                },
                {
                  id: "credit_enterprise",
                  nameVi: "Gói Doanh Nghiệp",
                  nameEn: "Enterprise Package",
                  credits: "5000 điểm",
                  price: "đ 250000",
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
                    onClick={() => handleUpgradeClick(
                      pkg.id,
                      pkg.nameVi,
                      pkg.nameEn,
                      parseInt(pkg.price.replace(/[^\d]/g, "")),
                      false,
                      undefined
                    )}
                    className="w-full py-2.5 mt-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-lg shadow-blue-500/10 flex items-center justify-center gap-1"
                    disabled={paymentLoading}
                  >
                    {paymentLoading && checkoutPlanId === pkg.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      (lang === "en" ? "Buy Now" : "Mua ngay")
                    )}
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

      {/* SePay Checkout QR Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel rounded-3xl border border-white/10 w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col gap-0 max-h-[90vh]">

            {/* Success screen overlay */}
            {paymentSuccess ? (
              <div className="p-12 flex flex-col items-center justify-center text-center gap-6 animate-scaleUp my-auto min-h-[400px]">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Check className="w-10 h-10 stroke-[3] animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">
                    {lang === "en" ? "Payment Successful!" : "Thanh toán thành công!"}
                  </h3>
                  <p className="text-sm text-zinc-400 mt-2 max-w-md mx-auto">
                    {lang === "en"
                      ? `Your account has been upgraded/credited with ${checkoutPlanName} package. Enjoy your upgraded features!`
                      : `Tài khoản của bạn đã được cập nhật gói dịch vụ ${checkoutPlanName}. Bắt đầu trải nghiệm các tính năng cao cấp ngay!`}
                  </p>
                </div>
                <div className="text-xs text-zinc-500 animate-pulse">
                  {lang === "en" ? "Redirecting in a moment..." : "Hệ thống sẽ tự động chuyển hướng..."}
                </div>
              </div>
            ) : (
              <>
                {/* Header/Order Summary Panel */}
                <div className="p-6 bg-[#09090b]/80 border-b border-white/5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                      {lang === "en" ? "Order details" : "Chi tiết đơn hàng"}
                    </h3>
                    <div className="flex items-center gap-4">
                      {paymentTimeLeft > 0 && (
                        <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${
                          paymentTimeLeft < 60
                            ? "text-red-500 bg-red-500/10 border-red-500/20 animate-pulse"
                            : "text-amber-500 bg-amber-500/10 border-amber-500/20"
                        }`}>
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatTime(paymentTimeLeft)}</span>
                        </div>
                      )}
                      <button
                        onClick={() => setShowCheckoutModal(false)}
                        className="text-xs font-semibold text-zinc-450 hover:text-white transition-colors cursor-pointer"
                      >
                        {lang === "en" ? "Hide" : "Ẩn"}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="text-base font-extrabold text-white">
                        {checkoutPlanName}
                      </h4>
                      <p className="text-xs text-zinc-500 mt-1">x 1</p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-extrabold text-white">
                        {checkoutAmount} VND
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-white/5">
                    <span className="text-xs font-semibold text-zinc-455">
                      {lang === "en" ? "Total amount:" : "Tổng cộng:"}
                    </span>
                    <span className="text-lg font-black text-[#6C63FF]">
                      {checkoutAmount} VND
                    </span>
                  </div>
                </div>

                {paymentTimeLeft === 0 ? (
                  <div className="p-12 flex flex-col items-center justify-center text-center gap-6 animate-scaleUp my-auto min-h-[400px]">
                    <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                      <AlertTriangle className="w-10 h-10 stroke-[2] animate-bounce" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white">
                        {lang === "en" ? "Transaction Expired" : "Giao dịch đã hết hạn"}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
                        {lang === "en"
                          ? "The payment time window has closed. Any transfers sent after this period will not be credited automatically. Please initiate a new transaction."
                          : "Đã quá thời gian quy định để thực hiện thanh toán. Mọi giao dịch chuyển khoản sau thời gian này sẽ không được xử lý tự động. Vui lòng tạo đơn hàng mới."}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowCheckoutModal(false)}
                      className="px-6 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-white/5 text-zinc-300 font-bold text-xs transition-all active:scale-95 cursor-pointer mt-2"
                    >
                      {lang === "en" ? "Close" : "Đóng"}
                    </button>
                  </div>
                ) : (
                  <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch overflow-y-auto">

                  {/* Left Side: QR Panel */}
                  <div className="flex flex-col items-center justify-between bg-zinc-950/40 border border-white/5 rounded-2xl p-6 text-center gap-4">
                    <span className="text-xs text-zinc-450 leading-relaxed max-w-[280px]">
                      {lang === "en"
                        ? "Open any Bank App to scan VietQR or transfer with exact details below"
                        : "Mở App Ngân hàng bất kỳ để quét mã VietQR hoặc chuyển khoản chính xác số tiền, nội dung bên dưới"}
                    </span>

                    {/* QR Code Frame */}
                    <div className="bg-white p-3 rounded-2xl relative shadow-xl shadow-black/40 flex flex-col items-center gap-1.5 w-[200px] h-[200px] justify-center">
                      <img
                        src={`https://img.vietqr.io/image/${checkoutBankCode}-${checkoutAccountNumber}-compact2.png?amount=${checkoutAmount}&addInfo=${checkoutCode}&accountName=${encodeURIComponent(checkoutAccountName)}`}
                        alt="VietQR Payment Code"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="flex items-center justify-center gap-3">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#6C63FF] bg-[#6C63FF]/10 px-2.5 py-1 rounded-full">
                        napas 247
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 bg-zinc-800/40 px-2.5 py-1 rounded-full">
                        {checkoutBankCode}
                      </span>
                    </div>

                    <button
                      onClick={() => setShowCheckoutModal(false)}
                      className="px-6 py-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-white/5 text-zinc-300 font-bold text-xs transition-all active:scale-95 cursor-pointer mt-2"
                    >
                      {lang === "en" ? "Cancel Order" : "Huỷ"}
                    </button>
                  </div>

                  {/* Right Side: Account and Details Card */}
                  <div className="flex flex-col justify-between gap-6">

                    {/* Bank Info */}
                    <div className="flex items-center gap-3.5 bg-zinc-950/20 p-4 rounded-2xl border border-white/5">
                      <div className="w-10 h-10 rounded-xl bg-[#6C63FF]/15 border border-[#6C63FF]/30 flex items-center justify-center text-[#6C63FF]">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                          {lang === "en" ? "Bank Partner" : "Ngân hàng"}
                        </span>
                        <span className="text-xs text-zinc-200 font-bold truncate">
                          {checkoutBankName}
                        </span>
                      </div>
                    </div>

                    {/* Copyable Details List */}
                    <div className="flex flex-col gap-4">
                      {/* Account Owner */}
                      <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                            {lang === "en" ? "Account Owner" : "Chủ tài khoản"}
                          </span>
                          <span className="text-xs text-white font-extrabold mt-0.5">{checkoutAccountName}</span>
                        </div>
                      </div>

                      {/* Account Number */}
                      <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                            {lang === "en" ? "Account Number" : "Số tài khoản"}
                          </span>
                          <span className="text-xs text-white font-mono font-extrabold mt-0.5 tracking-wider">
                            {checkoutAccountNumber}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopyText(checkoutAccountNumber, "account")}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-[10px] transition-all cursor-pointer select-none active:scale-95 flex items-center gap-1 border border-white/5"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedState === "account" ? (lang === "en" ? "Copied" : "Đã sao chép") : (lang === "en" ? "Copy" : "Sao chép")}
                        </button>
                      </div>

                      {/* Amount */}
                      <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                            {lang === "en" ? "Amount" : "Số tiền"}
                          </span>
                          <span className="text-xs text-[#6C63FF] font-extrabold mt-0.5">
                            {checkoutAmount} VND
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopyText(checkoutAmount.toString(), "amount")}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-[10px] transition-all cursor-pointer select-none active:scale-95 flex items-center gap-1 border border-white/5"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedState === "amount" ? (lang === "en" ? "Copied" : "Đã sao chép") : (lang === "en" ? "Copy" : "Sao chép")}
                        </button>
                      </div>

                      {/* Code Description */}
                      <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                            {lang === "en" ? "Message Content" : "Nội dung"}
                          </span>
                          <span className="text-xs text-emerald-400 font-mono font-extrabold mt-0.5 tracking-wider">
                            {checkoutCode}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopyText(checkoutCode, "code")}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-[10px] transition-all cursor-pointer select-none active:scale-95 flex items-center gap-1 border border-white/5"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedState === "code" ? (lang === "en" ? "Copied" : "Đã sao chép") : (lang === "en" ? "Copy" : "Sao chép")}
                        </button>
                      </div>
                    </div>

                    {/* Note and SePay simulation trigger */}
                    <div className="flex flex-col gap-4 mt-auto">
                      <p className="text-[10px] text-zinc-400 leading-relaxed bg-yellow-500/5 border border-yellow-500/10 p-3 rounded-xl flex items-start gap-2">
                        <span className="font-extrabold text-yellow-500 shrink-0">!</span>
                        <span>
                          {lang === "en"
                            ? `Note: Please input the exact amount of ${checkoutAmount} and reference code ${checkoutCode} in your transfer description.`
                            : `Lưu ý : Nhập chính xác số tiền ${checkoutAmount}, nội dung ${checkoutCode} khi chuyển khoản`}
                        </span>
                      </p>

                      <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider text-center">
                          {lang === "en" ? "Developer Sandbox Testing" : "Chế độ kiểm thử dành cho lập trình viên"}
                        </span>

                        <button
                          onClick={handleSimulateWebhook}
                          disabled={simulating || paymentSuccess}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-extrabold text-xs transition-all active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
                        >
                          {simulating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>{lang === "en" ? "Processing Webhook Simulation..." : "Đang xử lý giả lập SePay..."}</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              <span>{lang === "en" ? "Simulate Payment (Test SePay)" : "Giả lập thanh toán"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              )}
              </>
            )}

          </div>
        </div>
      )}
      {/* Cancellation Reason Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 w-full max-w-md shadow-2xl flex flex-col gap-6 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                {lang === "en" ? "Cancel Subscription" : "Huỷ gói dịch vụ"}
              </h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                {lang === "en" ? "Close" : "Đóng"}
              </button>
            </div>

            <div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {lang === "en"
                  ? "We are very sorry to see you go. Please let us know the reasons you are canceling so we can improve Zeflyo:"
                  : "Chúng tôi rất tiếc khi bạn quyết định dừng sử dụng gói dịch vụ. Vui lòng chọn lý do huỷ để giúp Zeflyo cải thiện tốt hơn:"}
              </p>
            </div>

            {/* Reasons List */}
            <div className="flex flex-col gap-3">
              {[
                { id: "expensive", labelVi: "Giá gói dịch vụ quá cao", labelEn: "Price is too high" },
                { id: "missing_features", labelVi: "Thiếu tính năng tôi cần", labelEn: "Missing features I need" },
                { id: "hard_to_use", labelVi: "Khó sử dụng / Giao diện phức tạp", labelEn: "Hard to use / Complex interface" },
                { id: "bugs", labelVi: "Gặp nhiều lỗi trong quá trình sử dụng", labelEn: "Encountered too many bugs" },
                { id: "no_longer_needed", labelVi: "Không còn nhu cầu sử dụng", labelEn: "No longer needed" },
                { id: "other", labelVi: "Lý do khác...", labelEn: "Other reasons..." }
              ].map((reason) => {
                const label = lang === "en" ? reason.labelEn : reason.labelVi;
                const isSelected = selectedReasons.includes(label);

                return (
                  <label
                    key={reason.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${isSelected
                        ? "bg-red-500/10 border-red-500/30 text-white"
                        : "bg-zinc-950/20 border-white/5 text-zinc-400 hover:border-white/10 hover:text-zinc-200"
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        if (isSelected) {
                          setSelectedReasons(selectedReasons.filter(r => r !== label));
                        } else {
                          setSelectedReasons([...selectedReasons, label]);
                        }
                      }}
                      className="mt-0.5 rounded border-white/10 bg-zinc-900 text-red-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-xs font-semibold leading-tight">{label}</span>
                  </label>
                );
              })}
            </div>

            {/* Other reason input textarea */}
            {(selectedReasons.includes("Lý do khác...") || selectedReasons.includes("Other reasons...")) && (
              <div className="flex flex-col gap-2 animate-fadeIn">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  {lang === "en" ? "Please specify your reason" : "Chi tiết lý do khác"}
                </span>
                <textarea
                  value={cancelFeedback}
                  onChange={(e) => setCancelFeedback(e.target.value)}
                  placeholder={lang === "en" ? "Please tell us more..." : "Vui lòng chia sẻ thêm ý kiến của bạn..."}
                  className="w-full min-h-[80px] p-3 rounded-xl bg-zinc-950/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 resize-none font-sans"
                />
              </div>
            )}

            {/* Warning Message */}
            <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
              <p className="text-[10px] text-red-400 leading-relaxed font-semibold">
                ⚠️ {lang === "en"
                  ? "Warning: Your subscription will be cancelled and reverted to Free tier immediately. You will lose access to premium features."
                  : "Cảnh báo: Gói dịch vụ hiện tại sẽ bị huỷ và hạ cấp về gói Miễn Phí ngay lập tức. Bạn sẽ mất quyền truy cập các tính năng Premium."}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-white/5">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-white/5 text-zinc-300 font-bold text-xs transition-all active:scale-95 cursor-pointer text-center"
              >
                {lang === "en" ? "Keep My Plan" : "Giữ lại gói"}
              </button>

              <button
                onClick={() => handleCancelSubscription(selectedReasons, cancelFeedback)}
                disabled={cancelling || selectedReasons.length === 0}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:hover:bg-red-600 text-white font-extrabold text-xs transition-all active:scale-95 cursor-pointer text-center flex items-center justify-center gap-1 shadow-lg shadow-red-900/15"
              >
                {cancelling ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  lang === "en" ? "Confirm Cancel" : "Xác nhận huỷ"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
