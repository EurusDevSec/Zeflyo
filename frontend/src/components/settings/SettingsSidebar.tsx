"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { 
  User, 
  CreditCard, 
  HelpCircle, 
  BookOpen, 
  ShieldCheck, 
  Globe, 
  MessageSquare,
  Receipt
} from "lucide-react";

interface MenuItem {
  id: string;
  labelVi: string;
  labelEn: string;
  icon: React.ComponentType<any>;
  href: string;
  isAction?: boolean;
}

export default function SettingsSidebar() {
  const pathname = usePathname();
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

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = () => {
      const savedUser = localStorage.getItem("zeflyo_user");
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error(e);
        }
      } else {
        setUser(null);
      }
    };

    checkUser();
    window.addEventListener("zeflyo_profile_updated", checkUser);
    return () => {
      window.removeEventListener("zeflyo_profile_updated", checkUser);
    };
  }, []);

  const isPaidUser = user?.subscription_plan && user.subscription_plan !== "free";

  const menuItems: MenuItem[] = [
    { id: "general", labelVi: "Tổng quan", labelEn: "General", icon: User, href: "/settings/general" },
    ...(isPaidUser ? [] : [{ id: "pricing", labelVi: "Bảng giá", labelEn: "Pricing", icon: CreditCard, href: "/settings/pricing" }]),
    { id: "support", labelVi: "Hỗ trợ", labelEn: "Support", icon: HelpCircle, href: "/settings/support" },
    { id: "billing", labelVi: "Lịch sử mua hàng", labelEn: "Purchase History", icon: Receipt, href: "/settings/billing" },
    { id: "guide", labelVi: "Hướng dẫn", labelEn: "Guide", icon: BookOpen, href: "/settings/guide" },
    { id: "policy", labelVi: "Chính sách", labelEn: "Policy", icon: ShieldCheck, href: "/settings/policy" },
    { id: "language", labelVi: "Ngôn ngữ", labelEn: "Language", icon: Globe, href: "/settings/language" },
    { id: "feedback", labelVi: "Gửi phản hồi", labelEn: "Feedback", icon: MessageSquare, href: "/settings/feedback" }
  ];

  return (
    <aside className="w-16 md:w-60 bg-zinc-950/20 border-r border-white/5 flex flex-col z-10 transition-all duration-300">
      <div className="p-4 border-b border-white/5 hidden md:block">
        <span className="text-xs uppercase font-extrabold text-zinc-500 tracking-wider">
          {lang === "en" ? "System Settings" : "Cấu hình hệ thống"}
        </span>
      </div>
      <nav className="flex-1 py-4 flex flex-col gap-1.5 px-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <a
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-xs font-semibold ${
                isActive
                  ? "bg-white/5 text-white font-bold border-l-3 border-[#6C63FF] rounded-l-none"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
              } justify-center md:justify-start`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#6C63FF]" : "text-zinc-500"}`} />
              <span className="hidden md:inline">
                {lang === "en" ? item.labelEn : item.labelVi}
              </span>
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
