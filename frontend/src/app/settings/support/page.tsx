"use client";

import React, { useState, useEffect } from "react";
import { 
  Phone, 
  Clock, 
  ArrowRight,
  MessageCircle
} from "lucide-react";

// Inline Facebook SVG Icon (since Lucide removed brand icons)
function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={props.className}
      {...props}
    >
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
    </svg>
  );
}

// Custom Youtube SVG Icon
function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={props.className}
      {...props}
    >
      <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.107C19.533 3.545 12 3.545 12 3.545s-7.533 0-9.388.511a3.002 3.002 0 0 0-2.11 2.107C0 8.021 0 12 0 12s0 3.979.502 5.837a3.002 3.002 0 0 0 2.11 2.107C4.467 20.455 12 20.455 12 20.455s7.533 0 9.388-.511a3.002 3.002 0 0 0 2.11-2.107C24 15.979 24 12 24 12s0-3.979-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

// Custom Zalo SVG Icon
function ZaloIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={props.className}
      {...props}
    >
      <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3.04 1.05 4.38L2.05 21.1c-.13.51.34.98.85.85l4.72-1.01C8.96 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm3.32 14.54c-.23.16-.54.2-.79.08l-1.84-.92c-.22-.11-.47-.11-.69 0l-1.84.92c-.25.12-.56.08-.79-.08-.22-.16-.32-.44-.26-.71l.35-2.05c.04-.24-.04-.49-.22-.66l-1.49-1.45c-.2-.19-.27-.48-.18-.74.09-.26.31-.46.59-.5l2.06-.3c.25-.04.47-.2.58-.43l.92-1.86c.25-.5.98-.5 1.23 0l.92 1.86c.11.23.33.39.58.43l2.06.3c.28.04.5.24.59.5.09.26.02.55-.18.74l-1.49 1.45c-.18.17-.26.42-.22.66l.35 2.05c.06.27-.04.55-.26.71z" />
    </svg>
  );
}

interface SupportChannel {
  id: string;
  titleVi: string;
  titleEn: string;
  descVi: string;
  descEn: string;
  value: string;
  link: string;
  icon: React.ComponentType<any>;
  gradientClass: string;
  iconColor: string;
}

export default function SupportPage() {
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

  const channels: SupportChannel[] = [
    {
      id: "phone",
      titleVi: "Điện thoại",
      titleEn: "Phone Hotline",
      descVi: "Thứ 2 – Thứ 6: 8:00 – 18:00",
      descEn: "Mon–Fri: 8:00–18:00",
      value: "0901 234 567",
      link: "tel:0901234567",
      icon: Phone,
      gradientClass: "from-blue-600/10 via-blue-500/5 to-transparent hover:from-blue-600/20",
      iconColor: "text-blue-400"
    },
    {
      id: "fanpage",
      titleVi: "Fanpage Facebook",
      titleEn: "Facebook Fanpage",
      descVi: "Inbox trực tiếp Fanpage chính thức",
      descEn: "Inbox our official page directly",
      value: "Zeflyo Official",
      link: "https://facebook.com/zeflyo",
      icon: FacebookIcon,
      gradientClass: "from-[#1877F2]/10 via-[#1877F2]/5 to-transparent hover:from-[#1877F2]/20",
      iconColor: "text-[#1877F2]"
    },
    {
      id: "youtube",
      titleVi: "YouTube Channel",
      titleEn: "YouTube Channel",
      descVi: "Video hướng dẫn sử dụng chi tiết",
      descEn: "Detailed step-by-step video guides",
      value: "Kênh Zeflyo",
      link: "https://youtube.com/@zeflyo",
      icon: YoutubeIcon,
      gradientClass: "from-red-600/10 via-red-500/5 to-transparent hover:from-red-600/20",
      iconColor: "text-red-500"
    },
    {
      id: "zalo",
      titleVi: "Zalo Chat",
      titleEn: "Zalo Support",
      descVi: "Phản hồi nhanh trong vòng 15 phút",
      descEn: "Quick responses within 15 minutes",
      value: "0901 234 567",
      link: "https://zalo.me/0901234567",
      icon: MessageCircle,
      gradientClass: "from-[#0068FF]/10 via-[#0068FF]/5 to-transparent hover:from-[#0068FF]/20",
      iconColor: "text-[#0068FF]"
    }
  ];

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
          {lang === "en" ? "Zeflyo Support Center" : "Trung tâm Hỗ trợ kỹ thuật"}
        </h2>
        <p className="text-xs text-zinc-450 mt-1">
          {lang === "en" ? "Need help? Connect with our technicians through any channel below." : "Gặp khó khăn khi thiết lập? Kết nối trực tiếp với đội ngũ kỹ thuật của chúng tôi."}
        </p>
      </div>

      {/* Grid Channels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {channels.map((channel) => {
          const Icon = channel.icon;
          return (
            <div
              key={channel.id}
              className={`glass-panel p-6 rounded-3xl border border-white/5 bg-zinc-900/30 bg-gradient-to-br ${channel.gradientClass} flex flex-col justify-between transition-all duration-350 hover:-translate-y-1 group`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-zinc-950/60 border border-white/5 flex items-center justify-center ${channel.iconColor} group-hover:scale-105 group-hover:animate-pulse transition-all shadow-inner`}>
                  <Icon className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs uppercase font-extrabold text-zinc-500 tracking-wider">
                    {lang === "en" ? channel.titleEn : channel.titleVi}
                  </h3>
                  <span className="text-base font-bold text-zinc-200 block mt-1.5 truncate">
                    {channel.value}
                  </span>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    {lang === "en" ? channel.descEn : channel.descVi}
                  </p>
                </div>
              </div>

              <a
                href={channel.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-6 w-fit flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all`}
              >
                <span>{lang === "en" ? "Contact Now" : "Liên hệ ngay"}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          );
        })}
      </div>

      {/* Working Hours Banner */}
      <div className="glass-panel p-5 rounded-3xl border border-white/5 bg-gradient-to-r from-blue-600/5 via-indigo-500/5 to-transparent flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-350">{lang === "en" ? "Working Hours" : "Thời gian làm việc hỗ trợ"}</h4>
            <p className="text-[10px] text-zinc-500 mt-0.5">{lang === "en" ? "Excluding public holidays and scheduled maintenances." : "Hỗ trợ kỹ thuật không bao gồm các ngày lễ Tết."}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-xs font-semibold text-zinc-400">
          <div className="flex items-center gap-1.5 bg-zinc-950/40 px-3 py-1.5 rounded-lg border border-white/5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>{lang === "en" ? "Mon – Fri: 8:00 – 18:00" : "Thứ 2 – Thứ 6: 8:00 – 18:00"}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-950/40 px-3 py-1.5 rounded-lg border border-white/5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>{lang === "en" ? "Sat: 8:00 – 12:00" : "Thứ 7: 8:00 – 12:00"}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-950/40 px-3 py-1.5 rounded-lg border border-white/5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-red-400">{lang === "en" ? "Sun: Closed" : "Chủ nhật: Nghỉ"}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
