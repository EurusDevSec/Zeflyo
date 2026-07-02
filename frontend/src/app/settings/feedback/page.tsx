"use client";

import React, { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Loader2, 
  Star,
  AlertTriangle,
  Lightbulb,
  HelpCircle
} from "lucide-react";

export default function FeedbackPage() {
  const [lang, setLang] = useState<"en" | "vi">("vi");
  const [userEmail, setUserEmail] = useState("");
  const [category, setCategory] = useState<"bug" | "feature" | "other">("feature");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const savedLang = localStorage.getItem("zeflyo_lang") || "vi";
    setLang(savedLang as "en" | "vi");

    const savedUser = localStorage.getItem("zeflyo_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.email) {
          setUserEmail(parsed.email);
        }
      } catch (e) {
        // ignore
      }
    }

    const handleLangChange = () => {
      const updatedLang = localStorage.getItem("zeflyo_lang") || "vi";
      setLang(updatedLang as "en" | "vi");
    };

    window.addEventListener("zeflyo_lang_changed", handleLangChange);
    return () => {
      window.removeEventListener("zeflyo_lang_changed", handleLangChange);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setErrorMsg(lang === "en" ? "Please fill in all required fields." : "Vui lòng nhập đầy đủ các thông tin bắt buộc.");
      return;
    }
    
    setErrorMsg("");
    setIsSubmitting(true);

    const token = localStorage.getItem("zeflyo_token");
    const apiBaseUrl = localStorage.getItem("zeflyo_api_base") || "http://localhost";

    let backendType = "other";
    if (category === "bug") backendType = "bug";
    else if (category === "feature") backendType = "feature_request";

    try {
      const response = await fetch(`${apiBaseUrl}/api/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          type: backendType,
          title: subject,
          content: message,
          contact_email: userEmail || null,
          image_urls: null
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setIsSubmitting(false);
        setSubmitSuccess(true);
        setSubject("");
        setMessage("");
        setRating(0);
      } else {
        setErrorMsg(data.message || (lang === "en" ? "Failed to send feedback." : "Gửi phản hồi thất bại."));
        setIsSubmitting(false);
      }
    } catch (error) {
      setErrorMsg(lang === "en" ? "Server connection error." : "Lỗi kết nối đến máy chủ.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-2xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
          {lang === "en" ? "Send Feedback" : "Gửi ý kiến phản hồi"}
        </h2>
        <p className="text-xs text-zinc-450 mt-1">
          {lang === "en" 
            ? "Your feedback helps us continuously improve the Zeflyo Hub experience." 
            : "Những ý kiến quý báu của bạn giúp Zeflyo ngày càng hoàn thiện và nâng cao chất lượng dịch vụ."}
        </p>
      </div>

      {submitSuccess ? (
        <div className="glass-panel p-8 rounded-3xl border border-green-500/10 bg-green-500/5 text-center flex flex-col items-center gap-4 animate-fadeIn">
          <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {lang === "en" ? "Feedback Sent Successfully!" : "Gửi ý kiến thành công!"}
            </h3>
            <p className="text-xs text-zinc-400 mt-2 max-w-md mx-auto">
              {lang === "en"
                ? "Thank you for taking the time to share your thoughts. Our product team will review this promptly."
                : "Cảm ơn bạn đã dành thời gian đóng góp ý kiến. Đội ngũ kỹ thuật của Zeflyo sẽ sớm xem xét phản hồi này."}
            </p>
          </div>
          <button
            onClick={() => setSubmitSuccess(false)}
            className="mt-4 px-5 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-200 transition-all active:scale-95 cursor-pointer"
          >
            {lang === "en" ? "Send another response" : "Gửi tiếp phản hồi khác"}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-zinc-900/30 flex flex-col gap-6">
          
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400 text-xs flex items-center gap-2">
              <span className="font-bold">⚠️ {errorMsg}</span>
            </div>
          )}

          {/* Contact Email */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-zinc-500 uppercase font-extrabold tracking-wider">
              {lang === "en" ? "Contact Email" : "Email liên hệ"}
            </label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-white/5 border border-white/5 focus:border-[#6C63FF]/50 rounded-xl px-4 py-2.5 text-xs outline-none transition-colors text-zinc-200"
            />
          </div>

          {/* Feedback Category */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-zinc-500 uppercase font-extrabold tracking-wider">
              {lang === "en" ? "Feedback Category" : "Phân loại đóng góp"}
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "bug", labelVi: "Báo lỗi", labelEn: "Bug Report", icon: AlertTriangle },
                { id: "feature", labelVi: "Đề xuất tính năng", labelEn: "Feature Idea", icon: Lightbulb },
                { id: "other", labelVi: "Ý kiến khác", labelEn: "General feedback", icon: HelpCircle }
              ].map((cat) => {
                const CatIcon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id as any)}
                    className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#6C63FF] bg-[#6C63FF]/5 text-white"
                        : "border-white/5 bg-zinc-950/20 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
                    }`}
                  >
                    <CatIcon className={`w-5 h-5 ${isSelected ? "text-[#6C63FF]" : "text-zinc-500"}`} />
                    <span className="text-[10px] font-bold">
                      {lang === "en" ? cat.labelEn : cat.labelVi}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Experience Rating */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-zinc-500 uppercase font-extrabold tracking-wider">
              {lang === "en" ? "Rate your experience" : "Đánh giá mức độ hài lòng"}
            </label>
            <div className="flex items-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      star <= (hoverRating || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-zinc-600"
                    }`}
                  />
                </button>
              ))}
              <span className="text-[11px] text-zinc-500 ml-2">
                {rating > 0 && `${rating} / 5 stars`}
              </span>
            </div>
          </div>

          {/* Subject */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-zinc-500 uppercase font-extrabold tracking-wider">
              {lang === "en" ? "Subject" : "Tiêu đề ngắn"} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={lang === "en" ? "Brief summary of your feedback" : "Tóm tắt ngắn gọn ý kiến"}
              className="w-full bg-white/5 border border-white/5 focus:border-[#6C63FF]/50 rounded-xl px-4 py-2.5 text-xs outline-none transition-colors text-zinc-200"
            />
          </div>

          {/* Message Content */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-zinc-500 uppercase font-extrabold tracking-wider">
              {lang === "en" ? "Detailed Message" : "Nội dung phản hồi chi tiết"} <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                lang === "en"
                  ? "Describe your experience or suggest what we can improve..."
                  : "Mô tả chi tiết trải nghiệm của bạn hoặc gợi ý tính năng mong muốn được nâng cấp..."
              }
              className="w-full bg-white/5 border border-white/5 focus:border-[#6C63FF]/50 rounded-xl px-4 py-2.5 text-xs outline-none transition-colors text-zinc-200 resize-y custom-scrollbar"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#6C63FF] hover:bg-[#584feb] text-white text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#6C63FF]/20 active:scale-98 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{lang === "en" ? "Sending..." : "Đang gửi..."}</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{lang === "en" ? "Submit Feedback" : "Gửi phản hồi"}</span>
              </>
            )}
          </button>

        </form>
      )}

    </div>
  );
}
