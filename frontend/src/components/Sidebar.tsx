"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Settings,
  Check,
  Lock,
  X,
  CalendarDays,
  Bell,
  Gift,
  RefreshCw,
  AlertTriangle,
  Pin,
  Info,
  ChevronRight,
  Sparkles,
  Trash,
  Plus
} from "lucide-react";

interface ContentBlock {
  type: "paragraph" | "highlight" | "tip";
  text?: string;
  title?: string;
}

interface NotificationItem {
  id: string;
  category: "feature" | "update" | "maintenance" | "event" | "info";
  titleVi: string;
  titleEn: string;
  snippetVi: string;
  snippetEn: string;
  date: string;
  pinned: boolean;
  bannerVi?: {
    tag: string;
    title: string;
    subtitle: string;
  };
  bannerEn?: {
    tag: string;
    title: string;
    subtitle: string;
  };
  blocksVi: ContentBlock[];
  blocksEn: ContentBlock[];
}



const CATEGORY_MAP = {
  all: {
    vi: "Tất cả",
    en: "All",
    color: "bg-zinc-800 text-zinc-200 border-zinc-700"
  },
  feature: {
    vi: "Tính năng mới",
    en: "New features",
    icon: Sparkles,
    color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20",
    badgeColor: "bg-[#4f46e5]/10 text-[#8b5cf6] border-[#4f46e5]/20"
  },
  update: {
    vi: "Cập nhật",
    en: "Updates",
    icon: RefreshCw,
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20"
  },
  maintenance: {
    vi: "Bảo trì",
    en: "Maintenance",
    icon: AlertTriangle,
    color: "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20"
  },
  event: {
    vi: "Sự kiện",
    en: "Events",
    icon: Gift,
    color: "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20",
    badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20"
  },
  info: {
    vi: "Thông báo",
    en: "Announcements",
    icon: Info,
    color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20 hover:bg-zinc-500/20",
    badgeColor: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
  }
};

interface UserProfile {
  id: string | number;
  name: string;
  email: string;
  avatar?: string | null;
  avatar_url?: string | null;
  display_name?: string | null;
  credits?: number;
  last_checkin_at?: string | null;
  checkin_history?: string[];
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
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInMsg, setCheckInMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Notification states
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState<string[]>([]);
  const [selectedNotificationId, setSelectedNotificationId] = useState<string>("");
  const [activeNotifTab, setActiveNotifTab] = useState<"all" | "unread">("all");
  const [activeCategory, setActiveCategory] = useState<"all" | "feature" | "update" | "maintenance" | "event" | "info">("all");
  const [mobileDetailView, setMobileDetailView] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [newCategory, setNewCategory] = useState<"feature" | "update" | "maintenance" | "event" | "info">("feature");
  const [newTitleVi, setNewTitleVi] = useState("");
  const [newTitleEn, setNewTitleEn] = useState("");
  const [newSnippetVi, setNewSnippetVi] = useState("");
  const [newSnippetEn, setNewSnippetEn] = useState("");
  const [newPinned, setNewPinned] = useState(false);

  // Banner states
  const [newBannerTagVi, setNewBannerTagVi] = useState("");
  const [newBannerTitleVi, setNewBannerTitleVi] = useState("");
  const [newBannerSubtitleVi, setNewBannerSubtitleVi] = useState("");
  const [newBannerTagEn, setNewBannerTagEn] = useState("");
  const [newBannerTitleEn, setNewBannerTitleEn] = useState("");
  const [newBannerSubtitleEn, setNewBannerSubtitleEn] = useState("");

  // Blocks builder
  const [newBlocksVi, setNewBlocksVi] = useState<ContentBlock[]>([{ type: "paragraph", text: "" }]);
  const [newBlocksEn, setNewBlocksEn] = useState<ContentBlock[]>([{ type: "paragraph", text: "" }]);

  const pointsRef = useRef<HTMLDivElement>(null);
  const [isPointsOpen, setIsPointsOpen] = useState(false);

  useEffect(() => {
    // Load fallbacks from localStorage
    const savedUser = localStorage.getItem("zeflyo_user");
    const savedTheme = localStorage.getItem("zeflyo_theme") || "dark";
    const savedLang = localStorage.getItem("zeflyo_lang") || "vi";

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        
        // Award daily free credits in mock mode
        const token = localStorage.getItem("zeflyo_token");
        if (token && token.startsWith("mock_token")) {
          const plan = parsedUser.subscription_plan || "free";
          if (plan === "free") {
            const todayStr = new Date().toISOString().split('T')[0];
            if (!parsedUser.last_free_credits_at || parsedUser.last_free_credits_at < todayStr) {
              parsedUser.credits = (parsedUser.credits || 0) + 100;
              parsedUser.last_free_credits_at = todayStr;
              parsedUser.subscription_plan = "free";
              localStorage.setItem("zeflyo_user", JSON.stringify(parsedUser));
              setTimeout(() => {
                window.dispatchEvent(new Event("zeflyo_profile_updated"));
              }, 100);
            }
          }
        }
        
        setLocalUser(parsedUser);
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

    const handleLangChange = () => {
      const updatedLang = localStorage.getItem("zeflyo_lang") || "vi";
      setLocalLang(updatedLang as "en" | "vi");
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (pointsRef.current && !pointsRef.current.contains(event.target as Node)) {
        setIsPointsOpen(false);
      }
    };

    window.addEventListener("zeflyo_profile_updated", handleProfileUpdate);
    window.addEventListener("zeflyo_lang_changed", handleLangChange);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("zeflyo_profile_updated", handleProfileUpdate);
      window.removeEventListener("zeflyo_lang_changed", handleLangChange);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (propUser) {
      setLocalUser(propUser);
    }
  }, [propUser]);

  // Determine active values (prefer local state if available, fallback to props)
  const user = localUser !== null ? localUser : (propUser !== undefined ? propUser : null);
  const theme = propTheme !== undefined ? propTheme : localTheme;
  const lang = propLang !== undefined ? propLang : localLang;

  const getDaysInCurrentMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  };

  const getTodayDayNumber = () => {
    return new Date().getDate();
  };

  const getFormattedDateString = (day: number) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    return `${year}-${month}-${dayStr}`;
  };

  const isDayCheckedIn = (day: number) => {
    if (!user?.checkin_history) return false;
    const dateStr = getFormattedDateString(day);
    return user.checkin_history.includes(dateStr);
  };

  const hasCheckedInToday = () => {
    if (!user?.checkin_history) {
      if (!user?.last_checkin_at) return false;
      try {
        const lastCheckinDate = new Date(user.last_checkin_at).toLocaleDateString();
        const todayDate = new Date().toLocaleDateString();
        return lastCheckinDate === todayDate;
      } catch (e) {
        return false;
      }
    }
    const todayStr = getFormattedDateString(getTodayDayNumber());
    return user.checkin_history.includes(todayStr);
  };

  const handleCheckIn = async () => {
    if (checkInLoading || hasCheckedInToday()) return;

    setCheckInLoading(true);
    setCheckInMsg(null);

    const token = localStorage.getItem("zeflyo_token");
    const apiBaseUrl = localStorage.getItem("zeflyo_api_base") || "http://localhost";

    if (!token) {
      setCheckInMsg({
        type: "error",
        text: lang === "en" ? "Please log in first" : "Vui lòng đăng nhập trước"
      });
      setCheckInLoading(false);
      return;
    }

    if (token.startsWith("mock_token")) {
      // Simulate check-in in mock mode
      await new Promise(resolve => setTimeout(resolve, 800));
      const todayStr = getFormattedDateString(getTodayDayNumber());
      const updatedUser = {
        ...user,
        credits: (user?.credits !== undefined ? user.credits : 0) + 50,
        last_checkin_at: new Date().toISOString(),
        checkin_history: [...(user?.checkin_history || []), todayStr]
      };
      localStorage.setItem("zeflyo_user", JSON.stringify(updatedUser));
      setCheckInMsg({
        type: "success",
        text: lang === "en" ? "Claimed +50 mock credits!" : "Điểm danh thành công, nhận 50 điểm (Giả lập)!"
      });
      window.dispatchEvent(new Event("zeflyo_profile_updated"));
      setCheckInLoading(false);
      setTimeout(() => setCheckInMsg(null), 4000);
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/user/checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (res.status === 200 && data.user) {
        localStorage.setItem("zeflyo_user", JSON.stringify(data.user));
        setCheckInMsg({
          type: "success",
          text: lang === "en" ? "Claimed +50 credits!" : "Điểm danh thành công, nhận 50 điểm!"
        });
        window.dispatchEvent(new Event("zeflyo_profile_updated"));
      } else {
        const errorText = data.message || (lang === "en" ? "Failed to check-in" : "Điểm danh thất bại");
        setCheckInMsg({
          type: "error",
          text: errorText
        });
      }
    } catch (error) {
      console.error("Check-in error:", error);
      setCheckInMsg({
        type: "error",
        text: lang === "en" ? "Connection error" : "Lỗi kết nối"
      });
    } finally {
      setCheckInLoading(false);
      setTimeout(() => setCheckInMsg(null), 4000);
    }
  };

  const fetchNotifications = async () => {
    setIsLoadingNotifications(true);
    const token = localStorage.getItem("zeflyo_token");
    const apiBaseUrl = localStorage.getItem("zeflyo_api_base") || "http://localhost";
    
    if (!token) {
      setNotifications([]);
      setIsLoadingNotifications(false);
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/notifications`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.status === 200) {
        const data = await res.json();
        if (data && data.length > 0) {
          const mapped = data.map((item: any) => ({
            id: String(item.id),
            category: item.category,
            titleVi: item.title_vi,
            titleEn: item.title_en,
            snippetVi: item.snippet_vi,
            snippetEn: item.snippet_en,
            date: new Date(item.created_at).toLocaleDateString(lang === "en" ? "en-US" : "vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
              day: "2-digit",
              month: "2-digit",
              year: "numeric"
            }),
            pinned: Boolean(item.pinned),
            bannerVi: item.banner_vi,
            bannerEn: item.banner_en,
            blocksVi: item.blocks_vi || [],
            blocksEn: item.blocks_en || []
          }));
          setNotifications(mapped);
        } else {
          setNotifications([]);
        }
      } else {
        setNotifications([]);
      }
    } catch (e) {
      console.error(e);
      setNotifications([]);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [propUser]);

  useEffect(() => {
    if (notifications.length > 0 && !notifications.some(n => n.id === selectedNotificationId)) {
      setSelectedNotificationId(notifications[0].id);
    }
  }, [notifications]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(lang === "en" ? "Are you sure you want to delete this notification?" : "Bạn có chắc chắn muốn xoá thông báo này không?")) return;
    
    const token = localStorage.getItem("zeflyo_token");
    const apiBaseUrl = localStorage.getItem("zeflyo_api_base") || "http://localhost";
    
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/notifications/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.status === 200) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (selectedNotificationId === id) {
          setSelectedNotificationId("");
        }
      } else {
        alert(lang === "en" ? "Delete failed" : "Xoá thất bại");
      }
    } catch (err) {
      console.error(err);
      alert(lang === "en" ? "Connection error" : "Lỗi kết nối");
    }
  };

  const addBlockVi = () => {
    setNewBlocksVi([...newBlocksVi, { type: "paragraph", text: "" }]);
  };
  const updateBlockVi = (index: number, field: keyof ContentBlock, value: string) => {
    const updated = [...newBlocksVi];
    updated[index] = { ...updated[index], [field]: value };
    setNewBlocksVi(updated);
  };
  const removeBlockVi = (index: number) => {
    setNewBlocksVi(newBlocksVi.filter((_, i) => i !== index));
  };

  const addBlockEn = () => {
    setNewBlocksEn([...newBlocksEn, { type: "paragraph", text: "" }]);
  };
  const updateBlockEn = (index: number, field: keyof ContentBlock, value: string) => {
    const updated = [...newBlocksEn];
    updated[index] = { ...updated[index], [field]: value };
    setNewBlocksEn(updated);
  };
  const removeBlockEn = (index: number) => {
    setNewBlocksEn(newBlocksEn.filter((_, i) => i !== index));
  };

  const handleAddNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitleVi || !newTitleEn || !newSnippetVi || !newSnippetEn) {
      alert(lang === "en" ? "Please fill out required fields" : "Vui lòng nhập đầy đủ thông tin bắt buộc");
      return;
    }

    const token = localStorage.getItem("zeflyo_token");
    const apiBaseUrl = localStorage.getItem("zeflyo_api_base") || "http://localhost";

    const payload = {
      category: newCategory,
      title_vi: newTitleVi,
      title_en: newTitleEn,
      snippet_vi: newSnippetVi,
      snippet_en: newSnippetEn,
      pinned: newPinned,
      banner_vi: newBannerTitleVi ? {
        tag: newBannerTagVi || "🚀 TÍNH NĂNG MỚI",
        title: newBannerTitleVi,
        subtitle: newBannerSubtitleVi
      } : null,
      banner_en: newBannerTitleEn ? {
        tag: newBannerTagEn || "🚀 NEW FEATURE",
        title: newBannerTitleEn,
        subtitle: newBannerSubtitleEn
      } : null,
      blocks_vi: newBlocksVi,
      blocks_en: newBlocksEn
    };

    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.status === 201) {
        const item = await res.json();
        const mapped = {
          id: String(item.id),
          category: item.category,
          titleVi: item.title_vi,
          titleEn: item.title_en,
          snippetVi: item.snippet_vi,
          snippetEn: item.snippet_en,
          date: new Date(item.created_at).toLocaleDateString(lang === "en" ? "en-US" : "vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
          }),
          pinned: Boolean(item.pinned),
          bannerVi: item.banner_vi,
          bannerEn: item.banner_en,
          blocksVi: item.blocks_vi || [],
          blocksEn: item.blocks_en || []
        };
        
        setNotifications(prev => [mapped, ...prev]);
        setIsAddModalOpen(false);
        
        setNewTitleVi("");
        setNewTitleEn("");
        setNewSnippetVi("");
        setNewSnippetEn("");
        setNewPinned(false);
        setNewBannerTagVi("");
        setNewBannerTitleVi("");
        setNewBannerSubtitleVi("");
        setNewBannerTagEn("");
        setNewBannerTitleEn("");
        setNewBannerSubtitleEn("");
        setNewBlocksVi([{ type: "paragraph", text: "" }]);
        setNewBlocksEn([{ type: "paragraph", text: "" }]);
      } else {
        const data = await res.json();
        alert(data.message || (lang === "en" ? "Create failed" : "Đăng thất bại"));
      }
    } catch (err) {
      console.error(err);
      alert(lang === "en" ? "Connection error" : "Lỗi kết nối");
    }
  };

  useEffect(() => {
    const savedRead = localStorage.getItem("zeflyo_read_notifications");
    if (savedRead) {
      try {
        setReadNotifications(JSON.parse(savedRead));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const markAsRead = (id: string) => {
    if (!readNotifications.includes(id)) {
      const updated = [...readNotifications, id];
      setReadNotifications(updated);
      localStorage.setItem("zeflyo_read_notifications", JSON.stringify(updated));
    }
  };

  const unreadCount = notifications.filter(item => !readNotifications.includes(item.id)).length;

  const filteredNotifications = notifications.filter((item) => {
    if (activeNotifTab === "unread" && readNotifications.includes(item.id)) {
      return false;
    }
    if (activeCategory !== "all" && item.category !== activeCategory) {
      return false;
    }
    return true;
  });

  const selectedNotification = notifications.find(item => item.id === selectedNotificationId) || filteredNotifications[0] || null;

  const isAdmin = user?.email === "admin@zeflyo.io";

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

  const formatCredits = (num: number | null | undefined) => {
    const val = num ?? 0;
    return val.toLocaleString("vi-VN");
  };

  const getPlanName = () => {
    if (!user) return lang === "en" ? "Free" : "Miễn phí";
    const plan = user.subscription_plan || "free";
    if (plan === "free") return lang === "en" ? "Free" : "Miễn phí";
    if (plan === "basic") return lang === "en" ? "Basic" : "Cơ bản";
    if (plan === "pro") return lang === "en" ? "Professional" : "Chuyên nghiệp";
    if (plan === "premium") return lang === "en" ? "Premium" : "Cao cấp";
    return plan.toUpperCase();
  };

  const getExpiryDate = () => {
    if (!user || !user.subscription_expires_at) {
      return lang === "en" ? "Permanent" : "Vĩnh viễn";
    }
    try {
      const date = new Date(user.subscription_expires_at);
      return date.toLocaleDateString(lang === "en" ? "en-US" : "vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    } catch (e) {
      return lang === "en" ? "Permanent" : "Vĩnh viễn";
    }
  };

  const getResetNote = () => {
    if (!user) return "";
    const plan = user.subscription_plan || "free";
    
    // For free plan, daily reset
    if (plan === "free") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
      return lang === "en"
        ? `*Resets at the start of the day: ${tomorrowStr}`
        : `*Thiết lập lại vào đầu ngày: ${tomorrowStr}`;
    }
    
    // For paid plans, renew date is the subscription expiry date
    if (user.subscription_expires_at) {
      try {
        const date = new Date(user.subscription_expires_at);
        const dateStr = date.toLocaleDateString(lang === "en" ? "en-US" : "vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        });
        return lang === "en"
          ? `*Renews at: ${dateStr}`
          : `*Thiết lập lại vào ngày: ${dateStr}`;
      } catch (e) {
        return "";
      }
    }
    
    return "";
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
    <>
      <aside className="hidden lg:flex w-72 h-screen sticky top-0 bg-[#08080c] dark:bg-[#08080c] border-r border-zinc-800/40 flex-col relative z-20 flex-shrink-0 transition-all duration-300">
      
      {/* Sidebar Header / Logo & Notifications */}
      <div className="p-6 border-b border-zinc-850 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-9.5 h-9.5 rounded-xl bg-gradient-to-tr from-[#7c3aed] to-[#4f46e5] flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span className="font-extrabold text-white text-lg tracking-wider">Z</span>
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent logo-text">
            ZEFLYO
          </span>
        </div>

        {/* Bell Icon for Desktop */}
        <button
          onClick={() => setIsNotificationOpen(true)}
          className="relative flex items-center justify-center w-8 h-8 bg-zinc-900/50 hover:bg-zinc-800 hover:text-white text-zinc-300 rounded-xl transition-all border border-white/5 cursor-pointer active:scale-95 shadow-sm"
          title={lang === "en" ? "Notifications" : "Thông báo"}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-sm shadow-red-500/20">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* User Stats Card */}
      <div className="px-6 mt-6 flex-shrink-0">
        <div className="p-4 bg-zinc-900/30 rounded-2xl border border-green-500/10 text-center flex flex-col gap-0.5 shadow-inner relative">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
            {lang === "en" ? "CREDITS LEFT" : "TỔNG ĐIỂM"}
          </span>
          <span className="text-3xl font-black text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.2)]">
            {user?.credits ?? 0}
          </span>

          {/* Daily Check-in Button */}
          {user && (
            <div className="mt-2.5 w-full flex flex-col gap-1.5 items-center">
              <button
                onClick={() => setIsCalendarOpen(true)}
                className={`w-full py-1.5 px-3 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-1.5 border cursor-pointer ${
                  hasCheckedInToday()
                    ? "bg-zinc-900/60 text-zinc-500 border-zinc-800/40 hover:bg-zinc-900/70"
                    : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20 active:scale-[0.98] shadow-sm shadow-emerald-500/5"
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>{hasCheckedInToday() ? (lang === "en" ? "Calendar" : "Lịch điểm danh") : (lang === "en" ? "Daily Claim +50" : "Điểm danh nhận +50")}</span>
              </button>
            </div>
          )}
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

        {/* Theme toggle switch */}
        <button
          onClick={handleToggleTheme}
          className="flex items-center justify-between w-full py-2 px-3.5 bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-300 hover:text-white rounded-xl transition-all border border-white/5 cursor-pointer active:scale-95 shadow-sm"
          title={lang === "en" ? "Toggle theme" : "Chuyển giao diện sáng/tối"}
        >
          <div className="flex items-center gap-2">
            {theme === "dark" ? (
              <>
                <Moon className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold">{lang === "en" ? "Dark Mode" : "Giao diện tối"}</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold">{lang === "en" ? "Light Mode" : "Giao diện sáng"}</span>
              </>
            )}
          </div>
          <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider">
            {lang === "en" ? "Switch" : "Thay đổi"}
          </span>
        </button>
      </div>
    </aside>

    {/* Monthly Check-in Modal */}
    {isCalendarOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-[#0b0b0f] border border-zinc-800/80 rounded-3xl w-full max-w-md p-6 relative shadow-2xl flex flex-col gap-5 text-center">
          
          {/* Close Button */}
          <button 
            onClick={() => setIsCalendarOpen(false)}
            className="absolute top-4 right-4 p-1.5 text-zinc-500 hover:text-zinc-350 hover:bg-zinc-900 rounded-xl transition-all cursor-pointer border border-transparent active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Header */}
          <div className="flex flex-col gap-1 mt-1">
            <h3 className="text-base font-extrabold text-zinc-150 uppercase tracking-wider flex items-center justify-center gap-2">
              <CalendarDays className="w-4.5 h-4.5 text-emerald-400" />
              {lang === "en" ? "Daily Check-in Calendar" : "Lịch Điểm Danh Hàng Ngày"}
            </h3>
            <p className="text-[11px] text-zinc-400 capitalize font-bold">
              {new Date().toLocaleDateString(lang === "en" ? "en-US" : "vi-VN", { month: "long", year: "numeric" })}
            </p>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 my-2 p-3 bg-zinc-950/40 rounded-2xl border border-zinc-900/50">
            {Array.from({ length: getDaysInCurrentMonth() }, (_, i) => {
              const dayNum = i + 1;
              const checked = isDayCheckedIn(dayNum);
              const isToday = dayNum === getTodayDayNumber();
              const isPast = dayNum < getTodayDayNumber();

              let cellClass = "";
              let statusIcon = null;

              if (checked) {
                cellClass = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-not-allowed";
                statusIcon = <Check className="w-3 h-3 stroke-[3px]" />;
              } else if (isToday) {
                cellClass = "bg-emerald-500/20 border-emerald-400 text-white cursor-pointer hover:bg-emerald-500/30 hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(16,185,129,0.2)] animate-pulse";
                statusIcon = <span className="text-[7px] uppercase tracking-wider font-black text-emerald-400">Hôm nay</span>;
              } else if (isPast) {
                cellClass = "bg-zinc-900/20 border-zinc-900/10 text-zinc-650 cursor-not-allowed opacity-40";
                statusIcon = <span className="text-[7px] uppercase text-zinc-550 font-bold">Trễ</span>;
              } else {
                cellClass = "bg-zinc-900/10 border-zinc-900/5 text-zinc-700 cursor-not-allowed opacity-30";
                statusIcon = <Lock className="w-2.5 h-2.5 text-zinc-700" />;
              }

              return (
                <button
                  key={dayNum}
                  disabled={!isToday || checked || checkInLoading}
                  onClick={handleCheckIn}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 border text-xs font-black transition-all ${cellClass}`}
                  title={isToday && !checked ? (lang === "en" ? "Click to check-in" : "Nhấn để điểm danh") : ""}
                >
                  <span>{dayNum}</span>
                  {statusIcon}
                </button>
              );
            })}
          </div>

          {/* Feedback Message */}
          {checkInMsg && (
            <div className={`py-2 px-3 rounded-xl text-[11px] font-bold border ${
              checkInMsg?.type === "success" 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
            }`}>
              {checkInMsg?.text}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex flex-col gap-2.5">
            {user && !hasCheckedInToday() ? (
              <button
                onClick={handleCheckIn}
                disabled={checkInLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 active:scale-[0.98] shadow-md shadow-emerald-500/10 cursor-pointer hover:brightness-105 flex items-center justify-center gap-1.5"
              >
                {checkInLoading ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CalendarDays className="w-4 h-4" />
                    <span>{lang === "en" ? "Claim Today's +50 Points" : "Điểm Danh Hôm Nay (+50 Điểm)"}</span>
                  </>
                )}
              </button>
            ) : (
              <div className="w-full py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-555 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 select-none">
                <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3px]" />
                <span>{lang === "en" ? "Checked In Today" : "Đã Hoàn Thành Điểm Danh Hôm Nay"}</span>
              </div>
            )}

            <p className="text-[10px] text-zinc-500 leading-normal font-semibold tracking-wide">
              {lang === "en" 
                ? "Claim +50 free credits daily. Retroactive claims are not allowed." 
                : "Điểm danh nhận +50 điểm mỗi ngày. Không thể điểm danh bù các ngày đã bỏ lỡ."}
            </p>
            {(!user?.subscription_plan || user?.subscription_plan === "free") && (
              <p className="text-[10px] text-emerald-500/80 leading-normal font-semibold tracking-wide mt-1">
                {lang === "en"
                  ? "💡 Free tier automatically gets 100 points daily without check-in."
                  : "💡 Gói miễn phí tự động nhận 100 điểm mỗi ngày không cần điểm danh."}
              </p>
            )}
          </div>

        </div>
      </div>
    )}

    {/* Floating Bell Button for Mobile/Tablet */}
    <button
      onClick={() => setIsNotificationOpen(true)}
      className="fixed bottom-6 right-6 z-40 lg:hidden flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-[#7c3aed] to-[#4f46e5] hover:from-[#6d28d9] hover:to-[#4338ca] text-white rounded-full shadow-lg shadow-purple-500/30 border border-purple-400/20 cursor-pointer active:scale-95 transition-all duration-300"
      title={lang === "en" ? "Notifications" : "Thông báo"}
    >
      <Bell className="w-6 h-6 animate-pulse" />
      {unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-black min-w-6 h-6 px-1.5 rounded-full flex items-center justify-center border-2 border-[#0b0b0f] shadow-md animate-bounce">
          {unreadCount}
        </span>
      )}
    </button>

    {/* Notification Center Modal */}
    {isNotificationOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-0 md:p-4">
        <div className="bg-[#0b0b0f] border border-zinc-800/80 rounded-none md:rounded-3xl w-full max-w-5xl h-full md:h-[80vh] flex flex-col relative shadow-2xl overflow-hidden transition-all duration-300">
          
          {/* Header for mobile */}
          <div className="p-4 border-b border-zinc-850 flex items-center justify-between md:hidden bg-zinc-950 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-400" />
              <span className="font-extrabold text-white text-sm tracking-wider uppercase">
                {lang === "en" ? "Notifications" : "Thông báo"}
              </span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="py-1 px-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                >
                  {lang === "en" ? "+ Add" : "+ Đăng"}
                </button>
              )}
              <button 
                onClick={() => {
                  setIsNotificationOpen(false);
                  setSelectedNotificationId(notifications[0]?.id || "");
                  setMobileDetailView(false);
                }}
                className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Desktop and Mobile Dual-Pane Layout */}
          <div className="flex-1 flex overflow-hidden relative">
            
            {/* Left Pane (List View) */}
            <div className={`w-full md:w-[42%] border-r border-zinc-850 flex flex-col bg-zinc-950/20 flex-shrink-0 ${mobileDetailView ? "hidden md:flex" : "flex"}`}>
              
              {/* Header (Desktop only) */}
              <div className="p-5 pb-3 hidden md:flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8.5 h-8.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Bell className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-lg font-black text-white tracking-tight">
                    {lang === "en" ? "Notifications" : "Thông báo"}
                  </h3>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="py-1.5 px-3 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{lang === "en" ? "Publish" : "Đăng tin"}</span>
                    </button>
                  )}

                  {/* Desktop close button */}
                  <button 
                    onClick={() => setIsNotificationOpen(false)}
                    className="p-1.5 text-zinc-500 hover:text-zinc-355 hover:bg-zinc-900 rounded-xl transition-all cursor-pointer border border-transparent active:scale-95"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {/* Tabs (Tất cả / Chưa đọc) */}
              <div className="px-5 py-2 flex items-center gap-2">
                <button
                  onClick={() => setActiveNotifTab("all")}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    activeNotifTab === "all"
                      ? "bg-zinc-900 border-zinc-850 text-white"
                      : "bg-transparent border-transparent text-zinc-400 hover:text-zinc-350"
                  }`}
                >
                  {lang === "en" ? "All" : "Tất cả"}
                </button>
                <button
                  onClick={() => setActiveNotifTab("unread")}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer relative ${
                    activeNotifTab === "unread"
                      ? "bg-zinc-900 border-zinc-850 text-white"
                      : "bg-transparent border-transparent text-zinc-400 hover:text-zinc-350"
                  }`}
                >
                  {lang === "en" ? "Unread" : "Chưa đọc"}
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-4 w-2 h-2 rounded-full bg-red-500" />
                  )}
                </button>
              </div>

              {/* Filter pills */}
              <div className="px-5 py-2 overflow-x-auto flex items-center gap-2 custom-scrollbar flex-shrink-0">
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`py-1.5 px-3 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap cursor-pointer ${
                    activeCategory === "all"
                      ? "bg-zinc-200 border-zinc-200 text-zinc-950 font-black shadow-md"
                      : "bg-zinc-900/60 border-zinc-850 text-zinc-400 hover:text-zinc-250"
                  }`}
                >
                  {lang === "en" ? "All" : "Tất cả"}
                </button>
                {Object.entries(CATEGORY_MAP).map(([catKey, catVal]) => {
                  if (catKey === "all") return null;
                  const CatIcon = (catVal as any).icon;
                  const isSelected = activeCategory === catKey;
                  return (
                    <button
                      key={catKey}
                      onClick={() => setActiveCategory(catKey as any)}
                      className={`py-1.5 px-3 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                        isSelected
                          ? "bg-zinc-200 border-zinc-200 text-zinc-950 font-black shadow-md"
                          : `${(catVal as any).color}`
                      }`}
                    >
                      {CatIcon && <CatIcon className={`w-3.5 h-3.5 ${isSelected ? "text-zinc-950" : ""}`} />}
                      <span>{lang === "en" ? (catVal as any).en : (catVal as any).vi}</span>
                    </button>
                  );
                })}
              </div>

              {/* Notification List Scrollable */}
              <div className="flex-1 overflow-y-auto px-5 py-2 flex flex-col gap-2.5 custom-scrollbar min-h-0">
                {filteredNotifications.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center opacity-40 py-12">
                    <Bell className="w-10 h-10 text-zinc-550" />
                    <span className="text-xs font-semibold text-zinc-400">
                      {lang === "en" ? "No notifications found" : "Không tìm thấy thông báo"}
                    </span>
                  </div>
                ) : (
                  filteredNotifications.map((item) => {
                    const isRead = readNotifications.includes(item.id);
                    const isSelected = selectedNotificationId === item.id;
                    const catInfo = CATEGORY_MAP[item.category];
                    const CatIcon = catInfo.icon;
                    
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedNotificationId(item.id);
                          markAsRead(item.id);
                          setMobileDetailView(true);
                        }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex gap-3 relative group active:scale-[0.99] ${
                          isSelected
                            ? "bg-zinc-900/80 border-indigo-500/30 shadow-md shadow-indigo-500/5"
                            : "bg-zinc-900/20 hover:bg-zinc-900/40 border-zinc-900/60 hover:border-zinc-800"
                        }`}
                      >
                        {/* Category Left Icon */}
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${
                          isRead ? "bg-zinc-900/40 border-zinc-850 text-zinc-500" : catInfo.badgeColor
                        }`}>
                          {CatIcon && <CatIcon className="w-4 h-4" />}
                        </div>

                        {/* Details Content */}
                        <div className="flex-1 min-w-0 flex flex-col gap-1 pr-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.pinned && (
                              <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[8px] font-black uppercase px-1 rounded flex items-center gap-0.5 tracking-wider">
                                <Pin className="w-2 h-2 fill-amber-500" />
                                <span>GHIM</span>
                              </span>
                            )}
                            <span className="text-[10px] text-zinc-500 font-semibold">{item.date}</span>
                          </div>

                          <h4 className={`text-xs font-bold line-clamp-2 leading-snug group-hover:text-white transition-colors ${
                            isRead ? "text-zinc-400" : "text-zinc-150"
                          }`}>
                            {lang === "en" ? item.titleEn : item.titleVi}
                          </h4>
                          
                          <p className="text-[10px] text-zinc-500 truncate">
                            {lang === "en" ? item.snippetEn : item.snippetVi}
                          </p>
                        </div>

                        {/* Unread indicator / selected arrow */}
                        <div className="flex flex-col items-center justify-center gap-1">
                          {!isRead && (
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] flex-shrink-0" />
                          )}
                          <ChevronRight className={`w-4 h-4 text-zinc-600 transition-transform ${isSelected ? "text-indigo-400 translate-x-0.5" : "group-hover:translate-x-0.5"}`} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Pane (Detail View) */}
            <div className={`flex-1 flex flex-col overflow-hidden bg-zinc-950/40 ${!mobileDetailView ? "hidden md:flex" : "flex"}`}>
              {selectedNotification ? (
                <>
                  {/* Detail Header / Nav bar (Mobile only) */}
                  <div className="p-4 border-b border-zinc-850 flex items-center gap-3 md:hidden bg-zinc-950/80 flex-shrink-0">
                    <button
                      onClick={() => setMobileDetailView(false)}
                      className="py-1 px-3 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer"
                    >
                      {lang === "en" ? "Back" : "Quay lại"}
                    </button>
                    <span className="text-xs font-bold text-zinc-400 truncate">
                      {lang === "en" ? selectedNotification.titleEn : selectedNotification.titleVi}
                    </span>
                  </div>

                  {/* Scrollable details content */}
                  <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6 custom-scrollbar">
                    
                    {/* Meta information row */}
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2">
                      <span className="text-xs text-zinc-500 font-bold tracking-wide">
                        {selectedNotification.date}
                      </span>

                      <div className="flex items-center gap-2">
                        {selectedNotification.pinned && (
                          <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Pin className="w-3 h-3 fill-amber-500" />
                            <span>{lang === "en" ? "Pinned" : "Đã ghim"}</span>
                          </span>
                        )}
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-current ${
                          selectedNotification.category === "feature" ? "text-indigo-400" :
                          selectedNotification.category === "update" ? "text-blue-400" :
                          selectedNotification.category === "maintenance" ? "text-amber-400" :
                          selectedNotification.category === "event" ? "text-rose-400" : "text-zinc-400"
                        }`}>
                          {lang === "en" ? CATEGORY_MAP[selectedNotification.category].en : CATEGORY_MAP[selectedNotification.category].vi}
                        </span>
                      </div>
                    </div>

                    {/* Main Title */}
                    <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
                      {lang === "en" ? selectedNotification.titleEn : selectedNotification.titleVi}
                    </h2>

                    {/* Gradient Banner Card */}
                    {((lang === "en" ? selectedNotification.bannerEn : selectedNotification.bannerVi)) && (
                      <div className={`p-6 rounded-2xl bg-gradient-to-br border flex flex-col gap-2 relative overflow-hidden group shadow-lg ${
                        selectedNotification.category === "feature" ? "from-[#1e1b4b]/80 via-[#31106a]/30 to-zinc-950/80 border-[#4f46e5]/20 shadow-purple-500/5" :
                        selectedNotification.category === "update" ? "from-[#082f49]/80 via-[#075985]/30 to-zinc-950/80 border-blue-500/20 shadow-blue-500/5" :
                        selectedNotification.category === "maintenance" ? "from-[#451a03]/80 via-[#78350f]/30 to-zinc-950/80 border-amber-500/20 shadow-amber-500/5" :
                        selectedNotification.category === "event" ? "from-[#4c0519]/80 via-[#881337]/30 to-zinc-950/80 border-rose-500/20 shadow-rose-500/5" :
                        "from-zinc-900 via-zinc-900/60 to-zinc-950/80 border-zinc-800 shadow-zinc-500/5"
                      }`}>
                        {/* Decorative blur elements inside the banner */}
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
                        
                        <span className={`text-[10px] font-black tracking-widest uppercase py-1 px-2.5 rounded-full border self-start ${
                          selectedNotification.category === "feature" ? "bg-[#4f46e5]/10 text-indigo-400 border-indigo-500/20" :
                          selectedNotification.category === "update" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                          selectedNotification.category === "maintenance" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                          selectedNotification.category === "event" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                          "bg-zinc-800 text-zinc-300 border-zinc-700"
                        }`}>
                          {lang === "en" ? selectedNotification.bannerEn?.tag : selectedNotification.bannerVi?.tag}
                        </span>

                        <h3 className="text-lg md:text-xl font-extrabold text-white mt-2 leading-snug">
                          {lang === "en" ? selectedNotification.bannerEn?.title : selectedNotification.bannerVi?.title}
                        </h3>

                        <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                          {lang === "en" ? selectedNotification.bannerEn?.subtitle : selectedNotification.bannerVi?.subtitle}
                        </p>
                      </div>
                    )}

                    {/* Content Blocks */}
                    <div className="flex flex-col gap-4 text-xs md:text-sm text-zinc-300 leading-relaxed">
                      {(lang === "en" ? selectedNotification.blocksEn : selectedNotification.blocksVi).map((block, idx) => {
                        if (block.type === "paragraph") {
                          return (
                            <p key={idx} className="font-medium">
                              {block.text}
                            </p>
                          );
                        } else if (block.type === "highlight") {
                          return (
                            <div key={idx} className="p-4 bg-zinc-900/30 rounded-2xl border border-zinc-850/60 flex flex-col gap-1.5 shadow-inner">
                              <h5 className="font-extrabold text-white flex items-center gap-2">
                                {block.title}
                              </h5>
                              <p className="text-zinc-400 font-medium">
                                {block.text}
                              </p>
                            </div>
                          );
                        } else if (block.type === "tip") {
                          return (
                            <div key={idx} className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 flex gap-3 shadow-inner">
                              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 flex-shrink-0">
                                <Info className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col gap-1">
                                <h5 className="font-extrabold text-white">
                                  {block.title || (lang === "en" ? "Recommendation" : "Gợi ý")}
                                </h5>
                                <p className="text-zinc-400 font-medium">
                                  {block.text}
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>

                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center opacity-40">
                  <Bell className="w-12 h-12 text-zinc-500" />
                  <span className="text-xs font-semibold text-zinc-400">
                    {lang === "en" ? "Select a notification to view details" : "Chọn một thông báo để xem chi tiết"}
                  </span>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    )}

    {/* Admin Publish Notification Modal */}
    {isAddModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        <div className="bg-[#0b0b0f] border border-zinc-800/80 rounded-3xl w-full max-w-3xl h-[85vh] flex flex-col relative shadow-2xl overflow-hidden">
          
          {/* Modal Header */}
          <div className="p-5 border-b border-zinc-850 flex items-center justify-between flex-shrink-0 bg-zinc-950/40">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
                {lang === "en" ? "Publish System Announcement" : "Đăng thông báo hệ thống"}
              </h3>
            </div>
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="p-1.5 text-zinc-500 hover:text-zinc-355 hover:bg-zinc-900 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body / Scrollable Form */}
          <form onSubmit={handleAddNotificationSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 custom-scrollbar min-h-0">
            
            {/* Row 1: Category & Pinned status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  {lang === "en" ? "Category" : "Danh mục"}
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="feature">{lang === "en" ? "New Feature" : "Tính năng mới"}</option>
                  <option value="update">{lang === "en" ? "System Update" : "Cập nhật hệ thống"}</option>
                  <option value="maintenance">{lang === "en" ? "Maintenance Alert" : "Bảo trì hệ thống"}</option>
                  <option value="event">{lang === "en" ? "Featured Event" : "Sự kiện nổi bật"}</option>
                  <option value="info">{lang === "en" ? "General Announcement" : "Thông báo chung"}</option>
                </select>
              </div>

              <div className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  id="newPinned"
                  checked={newPinned}
                  onChange={(e) => setNewPinned(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-800 bg-zinc-900 text-indigo-600 focus:ring-indigo-500/20"
                />
                <label htmlFor="newPinned" className="text-xs text-zinc-300 font-bold cursor-pointer">
                  {lang === "en" ? "Pin to Top" : "Ghim lên đầu trang"}
                </label>
              </div>
            </div>

            {/* Title Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  Tiêu đề (Tiếng Việt) *
                </label>
                <input
                  type="text"
                  required
                  value={newTitleVi}
                  onChange={(e) => setNewTitleVi(e.target.value)}
                  placeholder="e.g. 🚀 [TÍNH NĂNG MỚI] Đăng bài tự động"
                  className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  Title (English) *
                </label>
                <input
                  type="text"
                  required
                  value={newTitleEn}
                  onChange={(e) => setNewTitleEn(e.target.value)}
                  placeholder="e.g. 🚀 [NEW FEATURE] Auto Post Scheduler"
                  className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>

            {/* Snippet Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  Đoạn trích tóm tắt (Tiếng Việt) *
                </label>
                <input
                  type="text"
                  required
                  value={newSnippetVi}
                  onChange={(e) => setNewSnippetVi(e.target.value)}
                  placeholder="e.g. Xem ngay tính năng lên lịch bài đăng thông minh..."
                  className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  Short Snippet (English) *
                </label>
                <input
                  type="text"
                  required
                  value={newSnippetEn}
                  onChange={(e) => setNewSnippetEn(e.target.value)}
                  placeholder="e.g. Check out our brand new auto-scheduling tool..."
                  className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>

            {/* Banner Card Options (Vietnamese) */}
            <div className="border border-zinc-800 p-4 rounded-2xl flex flex-col gap-3.5 bg-zinc-950/20">
              <span className="text-[11px] text-zinc-300 font-black uppercase tracking-wider">
                Cấu hình Banner Card (Tiếng Việt)
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-zinc-550 font-bold uppercase">Nhãn Banner (e.g. 🚀 TÍNH NĂNG MỚI)</label>
                  <input
                    type="text"
                    value={newBannerTagVi}
                    onChange={(e) => setNewBannerTagVi(e.target.value)}
                    placeholder="Trống để dùng mặc định"
                    className="bg-zinc-900/40 border border-zinc-800 rounded-lg py-1.5 px-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[9px] text-zinc-550 font-bold uppercase">Tiêu đề Banner</label>
                  <input
                    type="text"
                    value={newBannerTitleVi}
                    onChange={(e) => setNewBannerTitleVi(e.target.value)}
                    placeholder="e.g. Tải Ảnh Từ Thiết Bị Lên"
                    className="bg-zinc-900/40 border border-zinc-800 rounded-lg py-1.5 px-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-zinc-550 font-bold uppercase">Phụ đề Banner</label>
                <input
                  type="text"
                  value={newBannerSubtitleVi}
                  onChange={(e) => setNewBannerSubtitleVi(e.target.value)}
                  placeholder="e.g. Tự do cá nhân hóa hình ảnh bài đăng..."
                  className="bg-zinc-900/40 border border-zinc-800 rounded-lg py-1.5 px-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>

            {/* Banner Card Options (English) */}
            <div className="border border-zinc-800 p-4 rounded-2xl flex flex-col gap-3.5 bg-zinc-950/20">
              <span className="text-[11px] text-zinc-300 font-black uppercase tracking-wider">
                Banner Card Configurations (English)
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-zinc-550 font-bold uppercase">Banner Tag (e.g. 🚀 NEW FEATURE)</label>
                  <input
                    type="text"
                    value={newBannerTagEn}
                    onChange={(e) => setNewBannerTagEn(e.target.value)}
                    placeholder="Leave blank for default"
                    className="bg-zinc-900/40 border border-zinc-800 rounded-lg py-1.5 px-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[9px] text-zinc-550 font-bold uppercase">Banner Title</label>
                  <input
                    type="text"
                    value={newBannerTitleEn}
                    onChange={(e) => setNewBannerTitleEn(e.target.value)}
                    placeholder="e.g. Direct Device Photo Uploads"
                    className="bg-zinc-900/40 border border-zinc-800 rounded-lg py-1.5 px-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-zinc-550 font-bold uppercase">Banner Subtitle</label>
                <input
                  type="text"
                  value={newBannerSubtitleEn}
                  onChange={(e) => setNewBannerSubtitleEn(e.target.value)}
                  placeholder="e.g. Personalize your posts with custom images..."
                  className="bg-zinc-900/40 border border-zinc-800 rounded-lg py-1.5 px-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/50"
                  />
              </div>
            </div>

            {/* Dynamic Blocks Builder (Vietnamese) */}
            <div className="border border-zinc-800 p-4 rounded-2xl flex flex-col gap-4 bg-zinc-950/20">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-300 font-black uppercase tracking-wider">
                  Khối nội dung chi tiết (Tiếng Việt)
                </span>
                <button
                  type="button"
                  onClick={addBlockVi}
                  className="py-1 px-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer"
                >
                  + Thêm khối
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {newBlocksVi.map((block, idx) => (
                  <div key={idx} className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-xl flex flex-col gap-2 relative">
                    <button
                      type="button"
                      onClick={() => removeBlockVi(idx)}
                      disabled={newBlocksVi.length === 1}
                      className="absolute top-2 right-2 p-1 text-zinc-650 hover:text-red-400 transition-colors disabled:opacity-40"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center gap-2 w-36">
                      <select
                        value={block.type}
                        onChange={(e) => updateBlockVi(idx, "type", e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 rounded py-1 px-2 text-[10px] text-zinc-400"
                      >
                        <option value="paragraph">Paragraph</option>
                        <option value="highlight">Highlight card</option>
                        <option value="tip">Recommendation tip</option>
                      </select>
                    </div>
                    {block.type !== "paragraph" && (
                      <input
                        type="text"
                        value={block.title || ""}
                        onChange={(e) => updateBlockVi(idx, "title", e.target.value)}
                        placeholder="Tiêu đề khối (e.g. 💡 Cơ chế xoay vòng)"
                        className="bg-zinc-950 border border-zinc-800 rounded py-1 px-2 text-xs text-zinc-200 focus:outline-none"
                      />
                    )}
                    <textarea
                      required
                      value={block.text || ""}
                      onChange={(e) => updateBlockVi(idx, "text", e.target.value)}
                      placeholder="Nội dung khối..."
                      rows={2}
                      className="bg-zinc-950 border border-zinc-800 rounded py-1 px-2 text-xs text-zinc-200 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Blocks Builder (English) */}
            <div className="border border-zinc-800 p-4 rounded-2xl flex flex-col gap-4 bg-zinc-950/20">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-300 font-black uppercase tracking-wider">
                  Detailed Content Blocks (English)
                </span>
                <button
                  type="button"
                  onClick={addBlockEn}
                  className="py-1 px-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer"
                >
                  + Add Block
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {newBlocksEn.map((block, idx) => (
                  <div key={idx} className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-xl flex flex-col gap-2 relative">
                    <button
                      type="button"
                      onClick={() => removeBlockEn(idx)}
                      disabled={newBlocksEn.length === 1}
                      className="absolute top-2 right-2 p-1 text-zinc-650 hover:text-red-400 transition-colors disabled:opacity-40"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center gap-2 w-36">
                      <select
                        value={block.type}
                        onChange={(e) => updateBlockEn(idx, "type", e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 rounded py-1 px-2 text-[10px] text-zinc-400"
                      >
                        <option value="paragraph">Paragraph</option>
                        <option value="highlight">Highlight card</option>
                        <option value="tip">Recommendation tip</option>
                      </select>
                    </div>
                    {block.type !== "paragraph" && (
                      <input
                        type="text"
                        value={block.title || ""}
                        onChange={(e) => updateBlockEn(idx, "title", e.target.value)}
                        placeholder="Block Title (e.g. 💡 Rotation details)"
                        className="bg-zinc-950 border border-zinc-800 rounded py-1 px-2 text-xs text-zinc-200 focus:outline-none"
                      />
                    )}
                    <textarea
                      required
                      value={block.text || ""}
                      onChange={(e) => updateBlockEn(idx, "text", e.target.value)}
                      placeholder="Block text content..."
                      rows={2}
                      className="bg-zinc-950 border border-zinc-800 rounded py-1 px-2 text-xs text-zinc-200 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

          </form>

          {/* Modal Footer */}
          <div className="p-5 border-t border-zinc-850 flex items-center justify-end gap-3 flex-shrink-0 bg-zinc-950/40">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="py-2 px-4 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 hover:brightness-105"
            >
              {lang === "en" ? "Cancel" : "Huỷ bỏ"}
            </button>
            <button
              type="button"
              onClick={handleAddNotificationSubmit}
              className="py-2 px-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 active:scale-[0.98] shadow-md shadow-emerald-500/10 cursor-pointer hover:brightness-105"
            >
              {lang === "en" ? "Publish Now" : "Đăng thông báo"}
            </button>
          </div>

        </div>
      </div>
    )}
    {/* Top Right Header Container for Desktop (Language Switcher & Points Box) */}
    <div className="fixed top-5 right-6 z-40 hidden lg:flex items-center gap-3" ref={pointsRef}>
      
      {/* Floating Language Switcher */}
      <button
        onClick={handleToggleLanguage}
        className="flex items-center justify-center gap-1.5 py-2.5 px-3.5 bg-[#0b0b0f]/60 hover:bg-zinc-900/80 text-zinc-200 hover:text-white rounded-full text-xs font-bold transition-all border border-white/5 backdrop-blur-md cursor-pointer active:scale-95 shadow-lg shadow-black/20"
        title={lang === "en" ? "Switch Language" : "Đổi ngôn ngữ"}
      >
        <Globe className="w-3.5 h-3.5 text-[#7c3aed] animate-pulse" />
        <span>{lang === "en" ? "EN" : "VI"}</span>
      </button>

      {/* Points Display Box */}
      {user && (
        <div className="relative">
          <button 
            onClick={() => setIsPointsOpen(!isPointsOpen)}
            className="flex flex-col items-start px-4.5 py-2 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-100 dark:bg-[#18181b]/95 text-zinc-900 dark:text-white shadow-sm hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all cursor-pointer select-none text-left min-w-[155px]"
          >
            <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider">
              <span>{lang === "en" ? "Points" : "Số điểm còn lại"}</span>
              <Info className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 stroke-[2.5]" />
            </div>
            <div className="text-sm font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
              {formatCredits(user?.credits)} {lang === "en" ? "pts" : "điểm"}
            </div>
          </button>

          {/* Popover Dropdown Card */}
          {isPointsOpen && (
            <div className="absolute right-0 mt-2.5 w-76 bg-white dark:bg-[#0b0b0f] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-2xl z-50 text-left flex flex-col gap-3.5 text-zinc-900 dark:text-zinc-100 transition-all duration-200">
              
              {/* Row 1: Plan and Expiry */}
              <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-850 pb-2 flex items-center justify-between">
                <span>{lang === "en" ? `Plan: ${getPlanName()}` : `Gói: ${getPlanName()}`}</span>
                <span className="text-zinc-400">|</span>
                <span>{lang === "en" ? `Expiry: ${getExpiryDate()}` : `HSD: ${getExpiryDate()}`}</span>
              </div>

              {/* Row 2: Detail stats */}
              <div className="flex justify-between items-baseline py-1">
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">{lang === "en" ? "Points Remaining" : "Số điểm còn lại"}</span>
                <span className="text-base font-black text-zinc-900 dark:text-zinc-100">
                  {formatCredits(user?.credits)} {lang === "en" ? "pts" : "điểm"}
                </span>
              </div>

              {/* Row 3: Reset note */}
              {getResetNote() && (
                <div className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-850 pt-2.5">
                  {getResetNote()}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}
