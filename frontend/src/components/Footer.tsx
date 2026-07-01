"use client";

import React, { useState, useEffect } from "react";

export default function Footer() {
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

  const descVi = "ZEFLYO - Giải pháp Hub Omnichannel tích hợp AI giúp tự động hóa quản lý tin nhắn, trả lời bình luận đa kênh (Facebook Fanpage, Zalo OA), tối ưu hóa chăm sóc khách hàng bằng Gemini AI và lên lịch chiến dịch nội dung thông minh cho thương hiệu của bạn.";
  const descEn = "ZEFLYO - An AI-powered Omnichannel Hub that automates message management, comment replies across Facebook Fanpages and Zalo OA, optimizes customer care using Gemini AI, and schedules smart content campaigns for your brand.";

  const copyVi = `© ${new Date().getFullYear()} ZEFLYO - Giải Pháp Tự Động Hóa Omnichannel Hub & AI Marketing. All rights reserved.`;
  const copyEn = `© ${new Date().getFullYear()} ZEFLYO - Omnichannel Automation Hub & AI Marketing Solution. All rights reserved.`;

  return (
    <footer className="w-full py-8 text-center text-xs text-zinc-500 border-t border-zinc-900 bg-[#09090b]/40 backdrop-blur-md mt-12 print:hidden flex-shrink-0">
      <div className="max-w-4xl mx-auto px-6 flex flex-col items-center">
        
        {/* Logo */}
        <div className="text-lg font-black tracking-widest text-white uppercase mb-3 logo-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
          ZEFLYO
        </div>

        {/* Description */}
        <p className="text-zinc-450 text-[11px] leading-relaxed max-w-2xl text-center">
          {lang === "en" ? descEn : descVi}
        </p>

        {/* Divider */}
        <hr className="w-full border-zinc-900 my-5 max-w-2xl" />

        {/* Copyright */}
        <p className="text-zinc-550 text-[10px]">
          {lang === "en" ? copyEn : copyVi}
        </p>

      </div>
    </footer>
  );
}
