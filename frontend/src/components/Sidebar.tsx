"use client";

import React from "react";
import { 
  Home,
  Calendar,
  MessageSquare,
  Sliders,
  Globe,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Wand2
} from "lucide-react";
import { useTranslate } from "@/lib/useTranslate";
import { Locale } from "@/lib/i18n";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
}

interface SidebarProps {
  currentPath: "/" | "/scheduler" | "/chat" | "/rules" | "/autopost" | "/settings";
  activeTab?: "setup" | "list" | "automation" | "product_list";
  setActiveTab?: (tab: any) => void;
  user: UserProfile | null;
  lang: "en" | "vi";
  toggleLanguage: () => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
  handleLogout: () => void;
}

export default function Sidebar({
  currentPath,
  activeTab = "setup",
  setActiveTab,
  user,
  lang,
  toggleLanguage,
  theme,
  toggleTheme,
  handleLogout
}: SidebarProps) {
  const t = useTranslate(lang);
  return (
    <aside className="hidden lg:flex w-72 h-screen sticky top-0 bg-[#08080c] dark:bg-[#08080c] light:bg-white border-r border-zinc-800/40 flex-col relative z-20 flex-shrink-0 transition-all duration-300">
      
      {/* Sidebar Header / Logo */}
      <div className="p-6 border-b border-zinc-850 flex items-center gap-3.5 flex-shrink-0">
        <div className="w-9.5 h-9.5 rounded-xl bg-gradient-to-tr from-[#7c3aed] to-[#4f46e5] flex items-center justify-center shadow-lg shadow-purple-500/20">
          <span className="font-extrabold text-white text-lg tracking-wider">Z</span>
        </div>
        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent logo-text">
          ZEFLYO
        </span>
      </div>

      {/* User Stats Card */}
      <div className="px-6 mt-6 flex-shrink-0">
        <div className="p-4 bg-zinc-900/30 rounded-2xl border border-green-500/10 text-center flex flex-col gap-0.5 shadow-inner">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
            {t("sidebar.creditsLeft")}
          </span>
          <span className="text-3xl font-black text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.2)]">
            200
          </span>
        </div>
      </div>

      {/* Sidebar Navigation Menu (Scrollable) */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto flex flex-col gap-2.5 custom-scrollbar pr-1">
        {/* Trang chủ */}
        <a
          href="/"
          className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-xs font-bold uppercase tracking-wider ${
            currentPath === "/"
              ? "bg-zinc-900 text-zinc-200 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30"
          }`}
        >
          <Home className={`w-4.5 h-4.5 ${currentPath === "/" ? "text-[#7c3aed]" : "text-zinc-500"}`} />
          <span>{t("sidebar.dashboard")}</span>
        </a>

        {/* Lên lịch đăng bài */}
        {currentPath === "/scheduler" ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-3.5 py-3 bg-zinc-900 text-zinc-200 rounded-xl text-xs font-bold tracking-wider uppercase shadow-sm">
              <span className="flex items-center gap-3">
                <Calendar className="w-4.5 h-4.5 text-[#7c3aed]" />
                <span>{t("sidebar.postScheduler")}</span>
              </span>
              <ChevronDown className="w-4 h-4 text-[#7c3aed]" />
            </div>
            {setActiveTab && (
              <div className="pl-4 mt-1.5 flex flex-col gap-1.5 border-l border-zinc-800 ml-5">
                <button 
                  onClick={() => setActiveTab("setup")}
                  className={`w-full text-left px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "setup" 
                      ? "bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-white shadow-md shadow-purple-500/10" 
                      : "text-zinc-400 hover:text-zinc-250 hover:bg-zinc-900/50"
                  }`}
                >
                  {t("sidebar.scheduleSetup")}
                </button>
                <button 
                  onClick={() => setActiveTab("list")}
                  className={`w-full text-left px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "list" 
                      ? "bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-white shadow-md shadow-purple-500/10" 
                      : "text-zinc-400 hover:text-zinc-250 hover:bg-zinc-900/50"
                  }`}
                >
                  {t("sidebar.manageSchedule")}
                </button>
                <button 
                  onClick={() => setActiveTab("automation")}
                  className={`w-full text-left px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "automation" 
                      ? "bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-white shadow-md shadow-purple-500/10" 
                      : "text-zinc-400 hover:text-zinc-250 hover:bg-zinc-900/50"
                  }`}
                >
                  {lang === "en" ? "Auto Campaigns" : "Kích hoạt tự động hóa"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <a
            href="/scheduler"
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-zinc-400 hover:text-zinc-250 hover:bg-zinc-900/30 transition-all text-xs font-bold uppercase tracking-wider"
          >
            <Calendar className="w-4.5 h-4.5 text-zinc-500" />
            <span>{t("sidebar.postScheduler")}</span>
          </a>
        )}

        {/* Đăng bài tự động AI */}
        {currentPath === "/autopost" ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-3.5 py-3 bg-zinc-900 text-zinc-200 rounded-xl text-xs font-bold tracking-wider uppercase shadow-sm">
              <span className="flex items-center gap-3">
                <Wand2 className="w-4.5 h-4.5 text-[#7c3aed]" />
                <span>{t("sidebar.aiAutoPost")}</span>
              </span>
              <ChevronDown className="w-4 h-4 text-[#7c3aed]" />
            </div>
            {setActiveTab && (
              <div className="pl-4 mt-1.5 flex flex-col gap-1.5 border-l border-zinc-800 ml-5">
                <button 
                  onClick={() => setActiveTab("setup")}
                  className={`w-full text-left px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "setup" 
                      ? "bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-white shadow-md shadow-purple-500/10" 
                      : "text-zinc-400 hover:text-zinc-250 hover:bg-zinc-900/50"
                  }`}
                >
                  {t("sidebar.topicSetup")}
                </button>
                <button 
                  onClick={() => setActiveTab("list")}
                  className={`w-full text-left px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "list" 
                      ? "bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-white shadow-md shadow-purple-500/10" 
                      : "text-zinc-400 hover:text-zinc-250 hover:bg-zinc-900/50"
                  }`}
                >
                  {t("sidebar.manageSetups")}
                </button>
                <button 
                  onClick={() => setActiveTab("automation")}
                  className={`w-full text-left px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "automation" 
                      ? "bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-white shadow-md shadow-purple-500/10" 
                      : "text-zinc-400 hover:text-zinc-250 hover:bg-zinc-900/50"
                  }`}
                >
                  {t("sidebar.addProduct")}
                </button>
                <button 
                  onClick={() => setActiveTab("product_list")}
                  className={`w-full text-left px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "product_list" 
                      ? "bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-white shadow-md shadow-purple-500/10" 
                      : "text-zinc-400 hover:text-zinc-250 hover:bg-zinc-900/50"
                  }`}
                >
                  {t("sidebar.productList")}
                </button>
              </div>
            )}
          </div>
        ) : (
          <a
            href="/autopost"
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-zinc-400 hover:text-zinc-250 hover:bg-zinc-900/30 transition-all text-xs font-bold uppercase tracking-wider"
          >
            <Wand2 className="w-4.5 h-4.5 text-zinc-500" />
            <span>{t("sidebar.aiAutoPost")}</span>
          </a>
        )}

        {/* Hộp thư tập trung */}
        <a
          href="/chat"
          className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-xs font-bold uppercase tracking-wider ${
            currentPath === "/chat"
              ? "bg-zinc-900 text-zinc-200 shadow-sm"
              : "text-zinc-400 hover:text-zinc-255 hover:bg-zinc-900/30"
          }`}
        >
          <MessageSquare className={`w-4.5 h-4.5 ${currentPath === "/chat" ? "text-[#7c3aed]" : "text-zinc-500"}`} />
          <span>{t("sidebar.liveChatHub")}</span>
        </a>

        {/* Luật Auto-reply */}
        <a
          href="/rules"
          className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-xs font-bold uppercase tracking-wider ${
            currentPath === "/rules"
              ? "bg-zinc-900 text-zinc-200 shadow-sm"
              : "text-zinc-400 hover:text-zinc-255 hover:bg-zinc-900/30"
          }`}
        >
          <Sliders className={`w-4.5 h-4.5 ${currentPath === "/rules" ? "text-[#7c3aed]" : "text-zinc-500"}`} />
          <span>{t("sidebar.autoReplyRules")}</span>
        </a>

        {/* Settings page */}
        <a
          href="/settings"
          className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-xs font-bold uppercase tracking-wider ${
            currentPath === "/settings"
              ? "bg-zinc-900 text-zinc-200 shadow-sm"
              : "text-zinc-400 hover:text-zinc-255 hover:bg-zinc-900/30"
          }`}
        >
          <Globe className={`w-4.5 h-4.5 ${currentPath === "/settings" ? "text-[#7c3aed]" : "text-zinc-500"}`} />
          <span>{t("sidebar.settings")}</span>
        </a>
      </nav>

      {/* Sidebar Footer (Pinned at Bottom) */}
      <div className="p-4 border-t border-zinc-850 flex flex-col gap-4 flex-shrink-0 bg-[#08080c]">
        {/* User profile row */}
        {user && (
          <div className="flex items-center justify-between bg-zinc-950/40 border border-zinc-850/50 p-2.5 rounded-xl shadow-inner">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8.5 h-8.5 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xs font-extrabold text-purple-400 flex-shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-zinc-200 font-bold truncate block">{user.name}</span>
                <span className="text-[10px] text-zinc-500 truncate block">{user.email || "user@zeflyo.io"}</span>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer flex-shrink-0 active:scale-95"
              title={t("sidebar.signOut")}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Utility toggles */}
        <div className="flex items-center justify-between">
          <button
            onClick={toggleLanguage}
            className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-full text-xs font-semibold transition-all border border-zinc-850 cursor-pointer active:scale-95 shadow-sm"
            title={t("sidebar.switchLanguage")}
          >
            <Globe className="w-3.5 h-3.5 text-[#7c3aed]" />
            <span>{lang === "en" ? "EN" : "VI"}</span>
          </button>
          
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8.5 h-8.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-full transition-all border border-zinc-850 cursor-pointer active:scale-95 shadow-sm"
            title={t("sidebar.toggleTheme")}
          >
            {theme === "dark" ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-indigo-400" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
