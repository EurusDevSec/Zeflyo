"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import { ArrowLeft, Moon, Sun, LogOut, HelpCircle, Sliders } from "lucide-react";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [lang, setLang] = useState<"en" | "vi">("vi");

  useEffect(() => {
    const savedTheme = localStorage.getItem("zeflyo_theme") || "light";
    const savedLang = localStorage.getItem("zeflyo_lang") || "vi";
    setTheme(savedTheme as "dark" | "light");
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

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("zeflyo_theme", nextTheme);
    if (nextTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("zeflyo_token");
    localStorage.removeItem("zeflyo_user");
    localStorage.removeItem("zeflyo_mock_pages");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen animated-gradient text-[#f4f4f5] flex relative overflow-hidden font-sans">
      
      {/* Background Glowing Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none animate-pulse-glow-delayed" />

      {/* Main Sidebar (Desktop) */}
      <Sidebar lang={lang} theme={theme} toggleTheme={toggleTheme} />

      {/* Settings Panel Shell */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-hidden relative z-10">
        
        {/* Mobile Header */}
        <header className="w-full bg-[#18181b]/50 border-b border-zinc-800 px-6 py-4 flex items-center justify-between lg:hidden z-20">
          <div className="flex items-center gap-3">
            <a href="/" className="p-2 rounded-xl bg-zinc-900 border border-zinc-805 text-zinc-400">
              <ArrowLeft className="w-4 h-4" />
            </a>
            <span className="font-bold text-sm tracking-wider bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent logo-text">
              {lang === "en" ? "SETTINGS" : "CÀI ĐẶT"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-8 h-8 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 text-zinc-450 hover:text-red-400 cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Inner Settings Workspace: Settings Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Settings Main Content Area */}
          <div className="flex-1 flex flex-col overflow-y-auto min-w-0 custom-scrollbar justify-between">
            <div className="p-4 md:p-8 flex-1 max-w-[1400px] w-full mx-auto">
              {children}
            </div>

            {/* Footer Branding */}
            <Footer />
          </div>
        </div>

      </div>
    </div>
  );
}
