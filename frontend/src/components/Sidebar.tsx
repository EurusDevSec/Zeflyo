"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
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
  Wand2,
  Settings
} from "lucide-react";

interface UserProfile {
  id: string | number;
  name: string;
  email: string;
  avatar?: string | null;
  avatar_url?: string | null;
  display_name?: string | null;
}

interface SidebarProps {
  currentPath?: string;
  activeTab?: "setup" | "list" | "automation" | "product_list";
  setActiveTab?: (tab: any) => void;
  user?: UserProfile | null;
  lang?: "en" | "vi";
  toggleLanguage?: () => void;
  theme?: "dark" | "light";
  toggleTheme?: () => void;
  handleLogout?: () => void;
}

export default function Sidebar({
  currentPath,
  activeTab = "setup",
  setActiveTab,
  user: propUser,
  lang: propLang,
  toggleLanguage: propToggleLanguage,
  theme: propTheme,
  toggleTheme: propToggleTheme,
  handleLogout: propHandleLogout
}: SidebarProps) {
  const pathname = usePathname();
  const resolvedPath = currentPath || pathname || "/";

  // Local state fallbacks (for when props are not provided, e.g. in Settings layout)
  const [localUser, setLocalUser] = useState<any>(null);
  const [localTheme, setLocalTheme] = useState<"dark" | "light">("dark");
  const [localLang, setLocalLang] = useState<"en" | "vi">("vi");

  useEffect(() => {
    // Load fallbacks from localStorage
    const savedUser = localStorage.getItem("zeflyo_user");
    const savedTheme = localStorage.getItem("zeflyo_theme") || "dark";
    const savedLang = localStorage.getItem("zeflyo_lang") || "vi";

    if (savedUser) {
      try {
        setLocalUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }
    setLocalTheme(savedTheme as "dark" | "light");
    setLocalLang(savedLang as "en" | "vi");

    // Listen for profile update events
    const handleProfileUpdate = () => {
      const updatedUser = localStorage.getItem("zeflyo_user");
      if (updatedUser) {
        try {
          setLocalUser(JSON.parse(updatedUser));
        } catch (e) {
          console.error(e);
        }
      }
    };

    window.addEventListener("zeflyo_profile_updated", handleProfileUpdate);
    return () => {
      window.removeEventListener("zeflyo_profile_updated", handleProfileUpdate);
    };
  }, []);

  // Determine active values (prefer props, fallback to local state)
  const user = propUser !== undefined ? propUser : localUser;
  const theme = propTheme !== undefined ? propTheme : localTheme;
  const lang = propLang !== undefined ? propLang : localLang;

  // Active path helpers
  const isHomeActive = resolvedPath === "/";
  const isSchedulerActive = resolvedPath === "/scheduler";
  const isAutopostActive = resolvedPath === "/autopost";
  const isChatActive = resolvedPath === "/chat";
  const isRulesActive = resolvedPath === "/rules";
  const isSettingsActive = resolvedPath?.startsWith("/settings");

  // Interaction handlers
  const handleToggleTheme = () => {
    if (propToggleTheme) {
      propToggleTheme();
    } else {
      const nextTheme = theme === "dark" ? "light" : "dark";
      setLocalTheme(nextTheme);
      localStorage.setItem("zeflyo_theme", nextTheme);
      if (nextTheme === "light") {
        document.documentElement.classList.add("light");
      } else {
        document.documentElement.classList.remove("light");
      }
    }
  };

  const handleToggleLanguage = () => {
    if (propToggleLanguage) {
      propToggleLanguage();
    } else {
      const nextLang = lang === "en" ? "vi" : "en";
      setLocalLang(nextLang);
      localStorage.setItem("zeflyo_lang", nextLang);
      document.documentElement.lang = nextLang;
      window.dispatchEvent(new Event("zeflyo_lang_changed"));
    }
  };

  const handleSignOut = () => {
    if (propHandleLogout) {
      propHandleLogout();
    } else {
      localStorage.removeItem("zeflyo_token");
      localStorage.removeItem("zeflyo_user");
      localStorage.removeItem("zeflyo_mock_pages");
      window.location.href = "/";
    }
  };

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
            {lang === "en" ? "CREDITS LEFT" : "TỔNG ĐIỂM"}
          </span>
          <span className="text-3xl font-black text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.2)]">
            {user?.credits !== undefined ? user.credits : 0}
          </span>
        </div>
      </div>

      {/* Sidebar Navigation Menu (Scrollable) */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto flex flex-col gap-2.5 custom-scrollbar pr-1">
        {/* Trang chủ */}
        <a
          href="/"
          className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-xs font-bold uppercase tracking-wider ${
            isHomeActive
              ? "bg-zinc-900 text-zinc-200 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30"
          }`}
        >
          <Home className={`w-4.5 h-4.5 ${isHomeActive ? "text-[#7c3aed]" : "text-zinc-500"}`} />
          <span>{lang === "en" ? "Dashboard" : "Trang chủ"}</span>
        </a>

        {/* Lên lịch đăng bài */}
        {isSchedulerActive && setActiveTab ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-3.5 py-3 bg-zinc-900 text-zinc-200 rounded-xl text-xs font-bold tracking-wider uppercase shadow-sm">
              <span className="flex items-center gap-3">
                <Calendar className="w-4.5 h-4.5 text-[#7c3aed]" />
                <span>{lang === "en" ? "Post Scheduler" : "Lên lịch đăng bài"}</span>
              </span>
              <ChevronDown className="w-4 h-4 text-[#7c3aed]" />
            </div>
            <div className="pl-4 mt-1.5 flex flex-col gap-1.5 border-l border-zinc-800 ml-5">
              <button 
                onClick={() => setActiveTab("setup")}
                className={`w-full text-left px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "setup" 
                    ? "bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-white shadow-md shadow-purple-500/10" 
                    : "text-zinc-400 hover:text-zinc-250 hover:bg-zinc-900/50"
                }`}
              >
                {lang === "en" ? "Schedule Setup" : "Thiết lập lịch đăng"}
              </button>
              <button 
                onClick={() => setActiveTab("list")}
                className={`w-full text-left px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "list" 
                    ? "bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-white shadow-md shadow-purple-500/10" 
                    : "text-zinc-400 hover:text-zinc-250 hover:bg-zinc-900/50"
                }`}
              >
                {lang === "en" ? "Manage Schedule" : "Quản lý lịch đăng"}
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
          </div>
        ) : (
          <a
            href="/scheduler"
            className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-xs font-bold uppercase tracking-wider ${
              isSchedulerActive
                ? "bg-zinc-900 text-zinc-200 shadow-sm"
                : "text-zinc-400 hover:text-zinc-250 hover:bg-zinc-900/30"
            }`}
          >
            <Calendar className={`w-4.5 h-4.5 ${isSchedulerActive ? "text-[#7c3aed]" : "text-zinc-500"}`} />
            <span>{lang === "en" ? "Post Scheduler" : "Lên lịch đăng bài"}</span>
          </a>
        )}

        {/* Đăng bài tự động AI */}
        {isAutopostActive && setActiveTab ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-3.5 py-3 bg-zinc-900 text-zinc-200 rounded-xl text-xs font-bold tracking-wider uppercase shadow-sm">
              <span className="flex items-center gap-3">
                <Wand2 className="w-4.5 h-4.5 text-[#7c3aed]" />
                <span>{lang === "en" ? "AI Auto-Post" : "Đăng bài tự động AI"}</span>
              </span>
              <ChevronDown className="w-4 h-4 text-[#7c3aed]" />
            </div>
            <div className="pl-4 mt-1.5 flex flex-col gap-1.5 border-l border-zinc-800 ml-5">
              <button 
                onClick={() => setActiveTab("setup")}
                className={`w-full text-left px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "setup" 
                    ? "bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-white shadow-md shadow-purple-500/10" 
                    : "text-zinc-400 hover:text-zinc-250 hover:bg-zinc-900/50"
                }`}
              >
                {lang === "en" ? "Topic Setup" : "Thiết lập từ chủ đề"}
              </button>
              <button 
                onClick={() => setActiveTab("list")}
                className={`w-full text-left px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "list" 
                    ? "bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-white shadow-md shadow-purple-500/10" 
                    : "text-zinc-400 hover:text-zinc-250 hover:bg-zinc-900/50"
                }`}
              >
                {lang === "en" ? "Manage Setups" : "Quản lý lịch đăng"}
              </button>
              <button 
                onClick={() => setActiveTab("automation")}
                className={`w-full text-left px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "automation" 
                    ? "bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-white shadow-md shadow-purple-500/10" 
                    : "text-zinc-400 hover:text-zinc-250 hover:bg-zinc-900/50"
                }`}
              >
                {lang === "en" ? "Add Product" : "Thêm sản phẩm"}
              </button>
              <button 
                onClick={() => setActiveTab("product_list")}
                className={`w-full text-left px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "product_list" 
                    ? "bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-white shadow-md shadow-purple-500/10" 
                    : "text-zinc-400 hover:text-zinc-250 hover:bg-zinc-900/50"
                }`}
              >
                {lang === "en" ? "Product List" : "Danh sách sản phẩm"}
              </button>
            </div>
          </div>
        ) : (
          <a
            href="/autopost"
            className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-xs font-bold uppercase tracking-wider ${
              isAutopostActive
                ? "bg-zinc-900 text-zinc-200 shadow-sm"
                : "text-zinc-400 hover:text-zinc-250 hover:bg-zinc-900/30"
            }`}
          >
            <Wand2 className={`w-4.5 h-4.5 ${isAutopostActive ? "text-[#7c3aed]" : "text-zinc-500"}`} />
            <span>{lang === "en" ? "AI Auto-Post" : "Đăng bài tự động AI"}</span>
          </a>
        )}

        {/* Hộp thư tập trung */}
        <a
          href="/chat"
          className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-xs font-bold uppercase tracking-wider ${
            isChatActive
              ? "bg-zinc-900 text-zinc-200 shadow-sm"
              : "text-zinc-400 hover:text-zinc-250 hover:bg-zinc-900/30"
          }`}
        >
          <MessageSquare className={`w-4.5 h-4.5 ${isChatActive ? "text-[#7c3aed]" : "text-zinc-500"}`} />
          <span>{lang === "en" ? "Live Chat Hub" : "Hộp thư tập trung"}</span>
        </a>

        {/* Luật Auto-reply */}
        <a
          href="/rules"
          className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-xs font-bold uppercase tracking-wider ${
            isRulesActive
              ? "bg-zinc-900 text-zinc-200 shadow-sm"
              : "text-zinc-400 hover:text-zinc-250 hover:bg-zinc-900/30"
          }`}
        >
          <Sliders className={`w-4.5 h-4.5 ${isRulesActive ? "text-[#7c3aed]" : "text-zinc-500"}`} />
          <span>{lang === "en" ? "Auto-Reply Rules" : "Luật Auto-Reply"}</span>
        </a>

        {/* Cài đặt */}
        <a
          href="/settings/general"
          className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-xs font-bold uppercase tracking-wider ${
            isSettingsActive
              ? "bg-zinc-900 text-zinc-200 shadow-sm"
              : "text-zinc-400 hover:text-zinc-255 hover:bg-zinc-900/30"
          }`}
        >
          <Settings className={`w-4.5 h-4.5 ${isSettingsActive ? "text-[#7c3aed]" : "text-zinc-500"}`} />
          <span>{lang === "en" ? "Settings" : "Cài đặt"}</span>
        </a>
      </nav>

      {/* Sidebar Footer (Pinned at Bottom) */}
      <div className="p-4 border-t border-zinc-850 flex flex-col gap-4 flex-shrink-0 bg-[#08080c]">
        {/* User profile row */}
        {user && (
          <div className="flex items-center justify-between bg-zinc-950/40 border border-zinc-850/50 p-2.5 rounded-xl shadow-inner">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8.5 h-8.5 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xs font-extrabold text-purple-400 flex-shrink-0">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.display_name || user.name} className="w-full h-full rounded-full object-cover" />
                ) : user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  (user.display_name || user.name).charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-zinc-200 font-bold truncate block flex items-center gap-1.5">
                  {user.display_name || user.name}
                  {user.subscription_plan && user.subscription_plan !== "free" && (
                    <span className="bg-[#6C63FF]/20 border border-[#6C63FF]/30 text-[#8b5cf6] text-[8px] px-1 rounded font-black uppercase tracking-wider">
                      {user.subscription_plan}
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-zinc-500 truncate block">
                  {user.email || "user@zeflyo.io"}
                </span>
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer flex-shrink-0 active:scale-95"
              title={lang === "en" ? "Sign Out" : "Đăng xuất"}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Utility toggles */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleToggleLanguage}
            className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-full text-xs font-semibold transition-all border border-zinc-850 cursor-pointer active:scale-95 shadow-sm"
            title={lang === "en" ? "Switch Language" : "Đổi ngôn ngữ"}
          >
            <Globe className="w-3.5 h-3.5 text-[#7c3aed]" />
            <span>{lang === "en" ? "EN" : "VI"}</span>
          </button>
          
          <button
            onClick={handleToggleTheme}
            className="flex items-center justify-center w-8.5 h-8.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-full transition-all border border-zinc-850 cursor-pointer active:scale-95 shadow-sm"
            title={lang === "en" ? "Toggle theme" : "Chuyển giao diện sáng/tối"}
          >
            {theme === "dark" ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-indigo-400" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
