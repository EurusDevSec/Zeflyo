"use client";

import React, { useState, useEffect } from "react";
import { Globe, Check, AlertCircle } from "lucide-react";

interface LanguageOption {
  code: "vi" | "en";
  name: string;
  nativeName: string;
  flag: string;
  status: "active" | "coming_soon";
}

export default function LanguagePage() {
  const [lang, setLang] = useState<"en" | "vi">("vi");

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

  const handleSelectLanguage = (code: "vi" | "en") => {
    localStorage.setItem("zeflyo_lang", code);
    setLang(code);
    window.dispatchEvent(new Event("zeflyo_lang_changed"));
  };

  const languages: LanguageOption[] = [
    {
      code: "vi",
      name: "Vietnamese",
      nativeName: "Tiếng Việt",
      flag: "🇻🇳",
      status: "active"
    },
    {
      code: "en",
      name: "English",
      nativeName: "English",
      flag: "🇺🇸",
      status: "active"
    },
    {
      code: "en", // fallback, just for display
      name: "Japanese",
      nativeName: "日本語",
      flag: "🇯🇵",
      status: "coming_soon"
    },
    {
      code: "en", // fallback, just for display
      name: "Korean",
      nativeName: "한국어",
      flag: "🇰🇷",
      status: "coming_soon"
    }
  ];

  return (
    <div className="flex flex-col gap-8 w-full max-w-3xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
          {lang === "en" ? "System Language" : "Ngôn ngữ hệ thống"}
        </h2>
        <p className="text-xs text-zinc-450 mt-1">
          {lang === "en" ? "Select your preferred language for the Zeflyo dashboard." : "Lựa chọn ngôn ngữ hiển thị giao diện phù hợp với nhu cầu của bạn."}
        </p>
      </div>

      {/* Grid of Languages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {languages.map((item, index) => {
          const isActive = item.status === "active" && ((item.code === "vi" && lang === "vi") || (item.code === "en" && lang === "en" && item.name === "English"));
          const isComingSoon = item.status === "coming_soon";

          return (
            <div
              key={index}
              onClick={() => {
                if (!isComingSoon) {
                  handleSelectLanguage(item.code);
                }
              }}
              className={`glass-panel p-5 rounded-3xl border transition-all flex items-center justify-between group ${
                isComingSoon
                  ? "opacity-50 cursor-not-allowed border-white/5 bg-zinc-900/10"
                  : isActive
                    ? "border-[#6C63FF] bg-[#6C63FF]/5 shadow-lg shadow-[#6C63FF]/5 cursor-pointer"
                    : "border-white/5 bg-zinc-900/30 hover:bg-white/[0.02] hover:border-zinc-800 cursor-pointer"
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl select-none" role="img" aria-label={item.name}>
                  {item.flag}
                </span>
                <div>
                  <span className="text-sm font-bold text-zinc-200 block">
                    {item.nativeName}
                  </span>
                  <span className="text-xs text-zinc-500 block mt-0.5">
                    {item.name} {isComingSoon && `(Coming Soon)`}
                  </span>
                </div>
              </div>

              {isActive && (
                <div className="w-6 h-6 rounded-full bg-[#6C63FF] flex items-center justify-center text-white">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Language Tip Banner */}
      <div className="glass-panel p-5 rounded-3xl border border-white/5 bg-gradient-to-r from-[#6C63FF]/5 to-transparent flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#6C63FF]/10 border border-[#6C63FF]/20 flex items-center justify-center text-[#6C63FF] shrink-0">
          <Globe className="w-5 h-5" />
        </div>
        <div className="text-xs leading-relaxed text-zinc-400">
          <span className="font-bold text-zinc-350 block mb-1">
            {lang === "en" ? "Localization Note" : "Lưu ý Việt hóa"}
          </span>
          {lang === "en"
            ? "Switching language will translate sidebars, core controls, alerts, and system notifications instantly. Translation for guide pages and pricing policies is adapted accordingly."
            : "Thay đổi ngôn ngữ sẽ cập nhật ngay thanh điều hướng, các tùy chọn chính và thông báo hệ thống. Các nội dung hướng dẫn và tài liệu chính sách cũng được chuyển dịch tự động."}
        </div>
      </div>

    </div>
  );
}
