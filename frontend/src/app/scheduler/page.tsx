"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Image as ImageIcon,
  Check,
  Globe,
  AlertTriangle,
  Loader2,
  Trash2,
  Sparkles,
  Plus,
  Sun,
  Moon,
  ChevronDown,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Copy,
  Home,
  MessageSquare,
  Sliders,
  Activity,
  Bell,
  Power,
  RefreshCw,
  LogOut,
  HelpCircle
} from "lucide-react";

interface Fanpage {
  id: number;
  user_id: number;
  fb_page_id: string;
  name: string;
  avatar_url: string | null;
  is_active: boolean;
}

interface ScheduledPost {
  id: number;
  user_id: number;
  fanpage_ids: number[];
  content: string;
  image_url: string | null;
  scheduled_at: string;
  status: "draft" | "pending" | "published" | "failed";
  error_log: string | null;
  created_at: string;
}

interface QueuePost {
  id: string;
  content: string;
  imageUrl: string;
}

export default function PostScheduler() {
  const [token, setToken] = useState<string | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>("http://localhost");
  const [fanpages, setFanpages] = useState<Fanpage[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeTab, setActiveTab] = useState<"setup" | "list" | "automation">("setup");
  
  interface UserProfile {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
  }
  const [user, setUser] = useState<UserProfile | null>(null);
  const [lang, setLang] = useState<"en" | "vi">("vi");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [logs, setLogs] = useState<Array<{ id: string; page: string; event: string; time: string; status: "success" | "pending" | "info" }>>([
    { id: "1", page: "Zeflyo Fashion", event: "Webhook handshake verified", time: "2 minutes ago", status: "success" },
    { id: "2", page: "Zeflyo Food & Beverage", event: "Auto-reply sent: 'Hi! Thank you for contacting...'", time: "5 minutes ago", status: "success" },
    { id: "3", page: "Tech Support", event: "AI Agent assigned to customer thread", time: "12 minutes ago", status: "info" }
  ]);

  // Form State
  const [setupName, setSetupName] = useState<string>("");
  const [queue, setQueue] = useState<QueuePost[]>([
    { id: "1", content: "", imageUrl: "" }
  ]);
  const [activeQueueIndex, setActiveQueueIndex] = useState<number>(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [scheduleMode, setScheduleMode] = useState<"weekly" | "fixed">("weekly");
  const [scheduleTimes, setScheduleTimes] = useState<string[]>(["08:00"]);
  const [scheduleDays, setScheduleDays] = useState<number[]>([1, 3, 5]); // 1 = Mon, ..., 7 = Sun
  
  // Extra options
  const [includeContactInfo, setIncludeContactInfo] = useState<boolean>(false);
  const [repeatQueue, setRepeatQueue] = useState<boolean>(false);
  const [autoWritePost, setAutoWritePost] = useState<boolean>(false);

  // Statuses
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load configuration & theme
  useEffect(() => {
    const savedToken = localStorage.getItem("zeflyo_token");
    const savedApiBase = localStorage.getItem("zeflyo_api_base");
    const savedPages = localStorage.getItem("zeflyo_mock_pages");
    const savedTheme = localStorage.getItem("zeflyo_theme") || "dark";
    const savedUser = localStorage.getItem("zeflyo_user");
    const savedLang = localStorage.getItem("zeflyo_lang");

    if (savedToken) setToken(savedToken);
    if (savedApiBase) setApiBaseUrl(savedApiBase);
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedLang === "en" || savedLang === "vi") setLang(savedLang as "en" | "vi");

    setTheme(savedTheme as "dark" | "light");
    if (savedTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }

    // Initial page load
    if (savedPages) {
      try {
        const pagesList = JSON.parse(savedPages);
        setFanpages(pagesList);
        if (pagesList.length > 0) {
          // Pre-select first fanpage by default
          setSelectedPages([pagesList[0].id]);
        }
      } catch (e) {
        console.error("Failed to parse mock pages", e);
      }
    }
  }, []);

  // Fetch from Backend if real mode
  useEffect(() => {
    if (token) {
      fetchFanpagesList();
      if (!token.startsWith("mock_")) {
        fetchScheduledPosts();
      } else {
        // Load mock scheduled posts
        const mockPosts = localStorage.getItem("zeflyo_mock_scheduled_posts");
        if (mockPosts) {
          try {
            setScheduledPosts(JSON.parse(mockPosts));
          } catch (e) {
            console.error(e);
          }
        }
        setLoading(false);
      }
    }
  }, [token, apiBaseUrl]);

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

  const toggleLanguage = () => {
    const nextLang = lang === "en" ? "vi" : "en";
    setLang(nextLang);
    localStorage.setItem("zeflyo_lang", nextLang);
    document.documentElement.lang = nextLang;
  };

  const handleLogout = () => {
    localStorage.removeItem("zeflyo_token");
    localStorage.removeItem("zeflyo_user");
    localStorage.removeItem("zeflyo_mock_pages");
    window.location.href = "/";
  };

  const showNotification = (type: "success" | "error", message: string) => {
    if (type === "success") {
      setSuccessMsg(message);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(message);
      setTimeout(() => setErrorMsg(null), 5000);
    }
  };

  const fetchFanpagesList = async () => {
    if (!token) return;

    if (token.startsWith("mock_")) {
      const savedMockPages = localStorage.getItem("zeflyo_mock_pages");
      if (savedMockPages) {
        try {
          const pagesList = JSON.parse(savedMockPages);
          setFanpages(pagesList);
          if (pagesList.length > 0 && selectedPages.length === 0) {
            setSelectedPages([pagesList[0].id]);
          }
        } catch (e) {
          console.error("Failed to parse mock pages", e);
        }
      } else {
        const defaultMockPages = [
          { id: 1, user_id: 99, fb_page_id: "109849204982312", name: "Zeflyo Fashion Store", avatar_url: null, is_active: true },
          { id: 2, user_id: 99, fb_page_id: "304958230495823", name: "Zeflyo Food & Beverage", avatar_url: null, is_active: false },
          { id: 3, user_id: 99, fb_page_id: "495829348572934", name: "Tech Support Portal", avatar_url: null, is_active: false }
        ];
        setFanpages(defaultMockPages);
        localStorage.setItem("zeflyo_mock_pages", JSON.stringify(defaultMockPages));
        if (selectedPages.length === 0) {
          setSelectedPages([1]);
        }
      }
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/fanpages`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const pagesList = data.fanpages || [];
        setFanpages(pagesList);
        if (pagesList.length > 0 && selectedPages.length === 0) {
          setSelectedPages([pagesList[0].id]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const togglePageAutomation = async (pageId: number, fbPageId: string) => {
    setActionLoading(pageId);
    
    if (token && token.startsWith("mock_")) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const updatedPages = fanpages.map(p => {
        if (p.id === pageId) {
          const newState = !p.is_active;
          const newLog = {
            id: Math.random().toString(),
            page: p.name,
            event: newState ? "Automation activated (polling/webhook status UP)" : "Automation paused",
            time: "Just now",
            status: (newState ? "success" : "pending") as any
          };
          setLogs(prev => [newLog, ...prev.slice(0, 9)]);
          return { ...p, is_active: newState };
        }
        return p;
      });
      setFanpages(updatedPages);
      localStorage.setItem("zeflyo_mock_pages", JSON.stringify(updatedPages));
      showNotification("success", "Cập nhật trạng thái Fanpage thành công");
      setActionLoading(null);
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/fanpages/${pageId}/toggle`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setFanpages(fanpages.map(p => p.id === pageId ? { ...p, is_active: data.fanpage.is_active } : p));
        showNotification("success", "Cập nhật trạng thái Fanpage thành công");
      } else {
        showNotification("error", data.error || "Không có quyền truy cập vào Fanpage này");
      }
    } catch (err) {
      console.error(err);
      showNotification("error", "Lỗi kết nối. Hãy chắc chắn rằng máy chủ backend đang chạy.");
    } finally {
      setActionLoading(null);
    }
  };

  const fetchScheduledPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/posts/schedule`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setScheduledPosts(data.posts || []);
      }
    } catch (err) {
      console.error("Error fetching scheduled posts:", err);
    } finally {
      setLoading(false);
    }
  };

  // Queue Item Actions
  const handleAddQueueItem = () => {
    const newItem = { id: Math.random().toString(), content: "", imageUrl: "" };
    setQueue(prev => [...prev, newItem]);
    setActiveQueueIndex(queue.length);
  };

  const handleDeleteQueueItem = (index: number) => {
    if (queue.length <= 1) {
      setQueue([{ id: Math.random().toString(), content: "", imageUrl: "" }]);
      setActiveQueueIndex(0);
      return;
    }
    const updated = queue.filter((_, idx) => idx !== index);
    setQueue(updated);
    setActiveQueueIndex(prev => Math.max(0, Math.min(updated.length - 1, prev - 1)));
  };

  const handleDuplicateQueueItem = (index: number) => {
    const itemToDuplicate = queue[index];
    if (!itemToDuplicate) return;
    const newItem = {
      ...itemToDuplicate,
      id: Math.random().toString()
    };
    setQueue(prev => [
      ...prev.slice(0, index + 1),
      newItem,
      ...prev.slice(index + 1)
    ]);
    setActiveQueueIndex(index + 1);
  };

  const handleContentChange = (val: string) => {
    setQueue(prev => prev.map((item, idx) => idx === activeQueueIndex ? { ...item, content: val } : item));
  };

  const handleImageUrlChange = (val: string) => {
    setQueue(prev => prev.map((item, idx) => idx === activeQueueIndex ? { ...item, imageUrl: val } : item));
  };

  // Excel Mock Actions
  const handleImportExcel = () => {
    const mockImported = [
      {
        id: Math.random().toString(),
        content: "🔥 SIÊU KHUYẾN MÃI MÙA HÈ - GIẢM GIÁ ĐẾN 50%!\nBộ sưu tập mới nhất đã có mặt tại Zeflyo Store. Chất liệu mát lạnh, form cực chuẩn cho ngày hè năng động.\n👉 Inbox ngay để nhận ưu đãi!",
        imageUrl: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80"
      },
      {
        id: Math.random().toString(),
        content: "✨ GÓC CHIA SẺ BÍ QUYẾT PHỐI ĐỒ\nLàm sao để vừa thanh lịch vừa cá tính khi đi làm? Hãy thử kết hợp áo sơ mi oversized cùng quần jeans ống rộng từ Zeflyo nhé.\n💬 Bạn thích màu nào hơn?",
        imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80"
      },
      {
        id: Math.random().toString(),
        content: "⭐ FEEDBACK SIÊU XỊN TỪ KHÁCH HÀNG THÂN YÊU\nSự hài lòng của mọi người là động lực lớn nhất của Zeflyo. Cảm ơn quý khách đã tin tưởng lựa chọn chất lượng hàng đầu của chúng tôi.\n❤️ Chúc cả nhà ngày mới vui vẻ!",
        imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80"
      }
    ];
    setQueue(mockImported);
    setActiveQueueIndex(0);
    showNotification("success", "Đã import thành công 3 bài viết mẫu từ file Excel!");
  };

  const handleDownloadTemplate = () => {
    showNotification("success", "Đã tải file Excel Template về thiết bị (Giả lập)!");
  };

  // Date calculation scheduler logic
  const calculateTargetDates = () => {
    const dates: Date[] = [];
    const now = new Date();
    
    // Check next 14 days for slots matching selectedDays and selectedTimes
    for (let d = 0; d < 14; d++) {
      const checkDate = new Date(now);
      checkDate.setDate(now.getDate() + d);
      
      let jsDay = checkDate.getDay();
      if (jsDay === 0) jsDay = 7; // Map Sunday to 7
      
      if (scheduleDays.includes(jsDay)) {
        scheduleTimes.forEach(time => {
          const [hours, minutes] = time.split(":").map(Number);
          const slot = new Date(checkDate);
          slot.setHours(hours, minutes, 0, 0);
          
          if (slot > now) {
            dates.push(slot);
          }
        });
      }
    }
    
    return dates.sort((a, b) => a.getTime() - b.getTime());
  };

  // Submit Save
  const handleSaveSetup = async () => {
    if (selectedPages.length === 0) {
      showNotification("error", "Vui lòng chọn ít nhất một Fanpage để đăng bài.");
      return;
    }
    
    const validQueue = queue.filter(item => item.content.trim() !== "");
    if (validQueue.length === 0) {
      showNotification("error", "Hàng chờ bài viết đang rỗng hoặc các bài viết không có nội dung.");
      return;
    }
    
    if (scheduleMode === "weekly" && scheduleDays.length === 0) {
      showNotification("error", "Vui lòng chọn ít nhất một ngày trong tuần.");
      return;
    }
    
    if (scheduleTimes.length === 0) {
      showNotification("error", "Vui lòng chọn ít nhất một khung giờ đăng.");
      return;
    }
    
    setSubmitting(true);
    
    let targetDates: Date[] = [];
    if (scheduleMode === "weekly") {
      targetDates = calculateTargetDates();
    } else {
      // Fixed date mode: Schedule starting from tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Map times
      scheduleTimes.forEach(time => {
        const [hours, minutes] = time.split(":").map(Number);
        const slot = new Date(tomorrow);
        slot.setHours(hours, minutes, 0, 0);
        targetDates.push(slot);
      });
      targetDates.sort((a, b) => a.getTime() - b.getTime());
    }
    
    if (targetDates.length === 0) {
      showNotification("error", "Không thể tìm thấy khung giờ đăng hợp lệ trong tương lai.");
      setSubmitting(false);
      return;
    }
    
    const postsToSchedule: any[] = [];
    const limit = Math.min(targetDates.length, repeatQueue ? 50 : validQueue.length);
    
    for (let i = 0; i < limit; i++) {
      const slot = targetDates[i];
      const postItem = validQueue[i % validQueue.length];
      
      let finalContent = postItem.content;
      if (includeContactInfo) {
        finalContent += "\n\n📞 Liên hệ đặt hàng: 0987-654-321 | 🌐 Website: zeflyo.vn";
      }
      
      postsToSchedule.push({
        fanpage_ids: selectedPages,
        content: finalContent,
        image_url: postItem.imageUrl || null,
        scheduled_at: slot.toISOString(),
        status: "pending"
      });
    }
    
    if (token && token.startsWith("mock_")) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newMockPosts = postsToSchedule.map(p => ({
        id: Math.floor(Math.random() * 100000),
        user_id: 99,
        fanpage_ids: p.fanpage_ids,
        content: p.content,
        image_url: p.image_url,
        scheduled_at: p.scheduled_at,
        status: "pending" as const,
        error_log: null,
        created_at: new Date().toISOString()
      }));
      
      const updatedList = [...newMockPosts, ...scheduledPosts];
      setScheduledPosts(updatedList);
      localStorage.setItem("zeflyo_mock_scheduled_posts", JSON.stringify(updatedList));
      
      showNotification("success", `Đã thiết lập lịch đăng thành công! Lên lịch ${newMockPosts.length} bài viết.`);
      setActiveTab("list");
      setSubmitting(false);
    } else {
      try {
        let successCount = 0;
        for (const postData of postsToSchedule) {
          const response = await fetch(`${apiBaseUrl}/api/posts/schedule`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(postData)
          });
          if (response.ok) {
            successCount++;
          }
        }
        
        if (successCount > 0) {
          showNotification("success", `Đã thiết lập lịch đăng thành công! Lên lịch thành công ${successCount}/${postsToSchedule.length} bài viết.`);
          fetchScheduledPosts();
          setActiveTab("list");
        } else {
          showNotification("error", "Lỗi lên lịch đăng bài.");
        }
      } catch (err) {
        showNotification("error", "Lỗi kết nối đến backend.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleDeletePost = async (id: number) => {
    if (token && token.startsWith("mock_")) {
      const updatedList = scheduledPosts.filter(post => post.id !== id);
      setScheduledPosts(updatedList);
      localStorage.setItem("zeflyo_mock_scheduled_posts", JSON.stringify(updatedList));
      showNotification("success", "Đã xóa bài đăng hẹn giờ.");
    } else {
      try {
        const response = await fetch(`${apiBaseUrl}/api/posts/schedule/${id}`, {
          method: "DELETE",
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });
        if (response.ok) {
          showNotification("success", "Đã xóa bài đăng hẹn giờ.");
          fetchScheduledPosts();
        } else {
          showNotification("error", "Không thể xóa bài đăng.");
        }
      } catch (err) {
        showNotification("error", "Lỗi kết nối.");
      }
    }
  };

  const activePost = queue[activeQueueIndex] || { content: "", imageUrl: "" };

  return (
    <div className="min-h-screen animated-gradient text-[#f4f4f5] flex relative overflow-hidden font-sans">
      
      {/* Background Glow Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none animate-pulse-glow-delayed" />

      {/* Sidebar Navigation */}
      <aside className="hidden lg:flex w-72 bg-[#18181b] border-r border-zinc-800 flex-col relative z-20 transition-all duration-300">
        {/* Sidebar Header / Logo */}
        <div className="p-6 border-b border-zinc-850 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="font-extrabold text-white text-base">Z</span>
          </div>
          <span className="text-lg font-bold tracking-wider bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent logo-text">
            ZEFLYO
          </span>
        </div>

        {/* User Stats Card */}
        <div className="p-4 mx-4 mt-6 bg-[#09090b]/40 rounded-2xl border border-green-500/20 text-center flex flex-col gap-1 shadow-inner">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Tổng điểm</span>
          <span className="text-3xl font-extrabold text-emerald-400">200</span>
        </div>

        {/* Sidebar Navigation Menu */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto flex flex-col gap-3 custom-scrollbar">
          {/* Dashboard Link */}
          <a
            href="/"
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-all text-xs font-semibold uppercase"
          >
            <Home className="w-4 h-4 text-zinc-500" />
            <span>Trang chủ</span>
          </a>

          {/* Post Scheduler Link (Active) */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between px-3.5 py-3 bg-zinc-900 text-zinc-200 rounded-xl text-xs font-semibold tracking-wider uppercase">
              <span className="flex items-center gap-3">
                <CalendarIcon className="w-4 h-4 text-blue-500" />
                Lên lịch đăng bài
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="pl-4 mt-1 flex flex-col gap-1.5 border-l border-zinc-800 ml-5">
              <button 
                onClick={() => setActiveTab("setup")}
                className={`w-full text-left px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "setup" 
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/10" 
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
                }`}
              >
                Thiết lập lịch đăng
              </button>
              <button 
                onClick={() => setActiveTab("list")}
                className={`w-full text-left px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "list" 
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/10" 
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
                }`}
              >
                Quản lý lịch đăng
              </button>
              <button 
                onClick={() => setActiveTab("automation")}
                className={`w-full text-left px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "automation" 
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/10" 
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
                }`}
              >
                Kích hoạt tự động hóa
              </button>
            </div>
          </div>

          {/* Live Chat Hub Link */}
          <a
            href="/chat"
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-all text-xs font-semibold uppercase"
          >
            <MessageSquare className="w-4 h-4 text-zinc-500" />
            <span>Hộp thư tập trung</span>
          </a>

          {/* Auto-reply Rules Link */}
          <a
            href="/rules"
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-all text-xs font-semibold uppercase"
          >
            <Sliders className="w-4 h-4 text-zinc-500" />
            <span>Luật Auto-Reply</span>
          </a>
        </nav>

        {/* Sidebar Footer with user info & toggles */}
        <div className="p-4 border-t border-zinc-850 flex flex-col gap-4">
          {/* User profile row */}
          {user && (
            <div className="flex items-center justify-between bg-zinc-950/40 border border-zinc-850/50 p-2.5 rounded-xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xs font-semibold text-blue-450 flex-shrink-0">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    user.name.charAt(0)
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-zinc-200 font-bold truncate block">{user.name}</span>
                  <span className="text-[10px] text-zinc-500 truncate block">{user.email || "user@zeflyo.io"}</span>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer flex-shrink-0"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Utility actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={toggleLanguage}
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-full text-xs font-semibold transition-all border border-zinc-850 cursor-pointer active:scale-95 shadow-sm"
              title="Switch Language / Đổi ngôn ngữ"
            >
              <Globe className="w-3.5 h-3.5 text-blue-455" />
              <span>{lang === "en" ? "EN" : "VI"}</span>
            </button>
            
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-8 h-8 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-full transition-all border border-zinc-850 cursor-pointer active:scale-95 shadow-sm"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto">
        
        {/* Mobile Header */}
        <header className="w-full bg-[#18181b]/50 border-b border-zinc-800 px-6 py-4 flex items-center justify-between relative z-10 lg:hidden">
          <div className="flex items-center gap-3">
            <a href="/" className="p-2 rounded-xl bg-zinc-900 border border-zinc-805 text-zinc-400">
              <ArrowLeft className="w-4 h-4" />
            </a>
            <span className="font-bold text-sm tracking-wider bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent logo-text">ZEFLYO</span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab(activeTab === "setup" ? "list" : activeTab === "list" ? "automation" : "setup")}
              className="px-3 py-1.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-lg text-xs font-semibold"
            >
              {activeTab === "setup" ? "Xem danh sách" : activeTab === "list" ? "Tự động hóa" : "Thiết lập lịch"}
            </button>
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

        {/* Content Pane */}
        <div className="flex-1 p-6 lg:p-10 max-w-7xl w-full mx-auto flex flex-col gap-6 relative z-10">
          
          {/* Header title */}
          <div className="flex flex-col gap-1.5 border-b border-zinc-850 pb-5">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-wider text-zinc-150 uppercase">
              {activeTab === "setup" ? "THIẾT LẬP LỊCH ĐĂNG CHO BÀI VIẾT CÓ SẴN" : 
               activeTab === "list" ? "QUẢN LÝ LỊCH ĐĂNG BÀI VIẾT" : 
               "KÍCH HOẠT TỰ ĐỘNG HÓA AI"}
            </h1>
            <p className="text-xs text-zinc-500">
              {activeTab === "setup" 
                ? "Lên lịch hàng loạt bài viết tự động theo khung giờ cố định hoặc lặp lại hàng tuần" 
                : activeTab === "list"
                ? "Quản lý và theo dõi trạng thái các bài viết đã hẹn giờ đăng lên Fanpage"
                : "Lựa chọn và bật/tắt tự động hóa AI cho các Fanpage đã kết nối Zeflyo."}
            </p>
          </div>

          {activeTab === "setup" ? (
            <div className="flex flex-col gap-8 animate-fade-in">
              {/* Setup Name Box */}
              <div className="glass-panel rounded-2xl p-5 flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tên thiết lập</label>
                <input 
                  type="text" 
                  value={setupName}
                  onChange={(e) => setSetupName(e.target.value)}
                  placeholder="Ví dụ: Chiến dịch khuyến mãi T10"
                  className="w-full bg-zinc-950/60 border border-zinc-850 focus:border-blue-500/50 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-blue-500/30 outline-none transition-all text-zinc-200 placeholder:text-zinc-650"
                />
              </div>

              {/* Two-Column Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                
                {/* Left Column: Post Queue Management */}
                <div className="xl:col-span-7 flex flex-col gap-6">
                  
                  <div className="glass-panel rounded-2xl p-6 flex flex-col gap-6">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
                      <div>
                        <h2 className="text-base font-bold text-zinc-200">Quản lý hàng chờ bài viết</h2>
                        <span className="text-[10px] text-zinc-550 font-bold uppercase">{queue.length} bài viết</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={handleDownloadTemplate}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-300 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                          title="Tải template file Excel"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Tải Template</span>
                        </button>
                        <button 
                          onClick={handleImportExcel}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/20 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                          title="Import danh sách bài từ file Excel"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>Import Excel</span>
                        </button>
                        <button 
                          onClick={handleAddQueueItem}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-500 transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm bài viết</span>
                        </button>
                      </div>
                    </div>

                    {/* Queued Posts list */}
                    <div className="flex gap-3 overflow-x-auto pb-3 custom-scrollbar">
                      {queue.map((item, idx) => {
                        const isActive = idx === activeQueueIndex;
                        return (
                          <div 
                            key={item.id}
                            onClick={() => setActiveQueueIndex(idx)}
                            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border cursor-pointer min-w-[140px] max-w-[200px] flex-shrink-0 transition-all ${
                              isActive 
                                ? "bg-blue-600/10 border-blue-500/50 text-blue-300 shadow-md shadow-blue-500/5" 
                                : "bg-zinc-900/40 border-zinc-850 hover:border-zinc-800 text-zinc-400"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold truncate">Bài #{idx + 1}</p>
                              <p className="text-[10px] text-zinc-550 font-medium truncate">
                                {item.content.trim() ? item.content : "Chờ đăng"}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicateQueueItem(idx);
                                }}
                                className="text-zinc-500 hover:text-zinc-300 p-0.5"
                                title="Nhân bản"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteQueueItem(idx);
                                }}
                                className="text-zinc-500 hover:text-red-400 p-0.5"
                                title="Xóa"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Post Content Input Area */}
                    <div className="flex flex-col gap-2 border-t border-zinc-850 pt-5">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Nội dung bài viết #{activeQueueIndex + 1}</label>
                      <textarea
                        value={activePost.content}
                        onChange={(e) => handleContentChange(e.target.value)}
                        placeholder="Nhập nội dung bài viết..."
                        rows={6}
                        className="w-full bg-zinc-950/60 border border-zinc-850 focus:border-blue-500/50 rounded-xl p-4 text-sm focus:ring-1 focus:ring-blue-500/30 outline-none resize-none transition-all text-zinc-200 placeholder:text-zinc-650"
                      />
                    </div>

                    {/* Media Attach Section */}
                    <div className="flex flex-col gap-3">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Liên kết media (Ảnh hoặc Video)</label>
                      <input 
                        type="text" 
                        value={activePost.imageUrl}
                        onChange={(e) => handleImageUrlChange(e.target.value)}
                        placeholder="Nhập URL video hoặc ảnh..."
                        className="w-full bg-zinc-950/40 border border-zinc-850 focus:border-blue-500/50 rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-blue-500/30 outline-none transition-all text-zinc-350 placeholder:text-zinc-700"
                      />
                      
                      {/* Media preview */}
                      {activePost.imageUrl ? (
                        <div className="relative rounded-xl overflow-hidden border border-zinc-850 bg-zinc-950/60 p-2 animate-fade-in">
                          <img 
                            src={activePost.imageUrl} 
                            alt="Upload preview" 
                            className="w-full max-h-[160px] object-cover rounded-lg"
                          />
                          <button 
                            onClick={() => handleImageUrlChange("")}
                            className="absolute top-4 right-4 bg-zinc-950/80 hover:bg-red-950/80 text-zinc-400 hover:text-red-400 w-8 h-8 rounded-lg flex items-center justify-center border border-zinc-850 hover:border-red-900 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="border-2 border-dashed border-zinc-850 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-zinc-950/20 hover:bg-zinc-900/10 hover:border-zinc-800 transition-all"
                          onClick={() => {
                            const mockImages = [
                              "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80",
                              "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80",
                              "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80"
                            ];
                            const randomImg = mockImages[Math.floor(Math.random() * mockImages.length)];
                            handleImageUrlChange(randomImg);
                            showNotification("success", "Đã tải hình ảnh lên hàng chờ (Mẫu)!");
                          }}
                        >
                          <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-850">
                            <ImageIcon className="w-5 h-5 text-zinc-500" />
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-semibold text-zinc-350">Tải ảnh hoặc video từ thiết bị</p>
                            <p className="text-[10px] text-zinc-650 mt-1">Hỗ trợ JPG, PNG, WEBP, MP4 (Cloudinary, Imgur, v.v.)</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={handleAddQueueItem}
                      className="w-full py-3.5 border border-dashed border-zinc-850 hover:border-zinc-700 rounded-xl text-zinc-400 hover:text-zinc-200 text-xs font-bold transition-all cursor-pointer text-center bg-zinc-900/10"
                    >
                      + Thêm bài viết vào hàng chờ
                    </button>
                  </div>

                  {/* Free Storage Tips box */}
                  <div className="glass-panel rounded-2xl p-5 border border-amber-500/10 bg-amber-500/[0.02] flex flex-col gap-3">
                    <h3 className="text-xs font-bold text-amber-450 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> Mẹo lưu trữ & lấy liên kết media miễn phí:
                    </h3>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Nếu bạn chưa có sẵn link trực tuyến cho ảnh/video, bạn có thể tải chúng lên miễn phí tại các dịch vụ lưu trữ sau để lấy liên kết trực tiếp dán vào bài viết:
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs font-semibold">
                      <a href="https://imgbb.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">🌐 ImgBB (Tải ảnh nhanh)</a>
                      <a href="https://cloudinary.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">🌐 Cloudinary (Ảnh & Video)</a>
                    </div>
                  </div>

                </div>

                {/* Right Column: Schedule Settings */}
                <div className="xl:col-span-5 flex flex-col gap-6">
                  
                  <div className="glass-panel rounded-2xl p-6 flex flex-col gap-6">
                    <h2 className="text-base font-bold text-zinc-200 border-b border-zinc-850 pb-4">Lịch đăng & thiết lập</h2>

                    {/* Account Selector */}
                    <div className="flex flex-col gap-3">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Chọn tài khoản để đăng bài</label>
                      
                      {fanpages.length === 0 ? (
                        <p className="text-xs text-amber-500 bg-amber-500/5 p-3 rounded-lg border border-amber-500/10">
                          Kết nối facebook fanpage hoặc Zalo OA trong hồ sơ trước khi sử dụng tính năng này.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-2.5 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                          {fanpages.map(page => {
                            const isChecked = selectedPages.includes(page.id);
                            return (
                              <div 
                                key={page.id}
                                onClick={() => {
                                  setSelectedPages(prev => prev.includes(page.id) ? prev.filter(id => id !== page.id) : [...prev, page.id]);
                                }}
                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                  isChecked 
                                    ? "bg-blue-600/10 border-blue-500/30 text-blue-300" 
                                    : "bg-zinc-950/40 border-zinc-850 hover:border-zinc-800 text-zinc-400"
                                }`}
                              >
                                <div className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                                  isChecked ? "bg-blue-600 border-blue-600 text-white" : "border-zinc-700 bg-zinc-950"
                                }`}>
                                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs font-semibold truncate block">{page.name}</span>
                                  <span className="text-[10px] text-zinc-500 truncate block">ID: {page.fb_page_id}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Schedule Mode */}
                    <div className="flex flex-col gap-3">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Chế độ lịch đăng bài</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div 
                          onClick={() => setScheduleMode("weekly")}
                          className={`p-4 rounded-xl border cursor-pointer flex flex-col gap-1 transition-all ${
                            scheduleMode === "weekly" 
                              ? "bg-blue-600/10 border-blue-500/50 text-blue-300 shadow-sm" 
                              : "bg-zinc-950/40 border-zinc-850 hover:border-zinc-800 text-zinc-400"
                          }`}
                        >
                          <span className="text-xs font-bold flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-blue-400" /> Lặp lại theo tuần
                          </span>
                          <span className="text-[10px] text-zinc-550 leading-normal">Đăng bài lặp lại theo các ngày trong tuần.</span>
                        </div>
                        <div 
                          onClick={() => setScheduleMode("fixed")}
                          className={`p-4 rounded-xl border cursor-pointer flex flex-col gap-1 transition-all ${
                            scheduleMode === "fixed" 
                              ? "bg-blue-600/10 border-blue-500/50 text-blue-300 shadow-sm" 
                              : "bg-zinc-950/40 border-zinc-850 hover:border-zinc-800 text-zinc-400"
                          }`}
                        >
                          <span className="text-xs font-bold flex items-center gap-1.5">
                            <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" /> Ngày cố định
                          </span>
                          <span className="text-[10px] text-zinc-550 leading-normal">Đăng bài vào các ngày cụ thể đã đặt.</span>
                        </div>
                      </div>
                      
                      {scheduleMode === "weekly" && (
                        <p className="text-[10px] text-amber-500 bg-amber-500/5 px-3 py-2 rounded-lg border border-amber-500/15 flex items-center gap-1">
                          💡 Mẹo: Chế độ lặp lại theo tuần phù hợp cho lịch đăng bài thường xuyên và đều đặn.
                        </p>
                      )}
                    </div>

                    {/* Giờ đăng bài */}
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Giờ đăng bài</label>
                        <button 
                          onClick={() => setScheduleTimes(prev => [...prev, "12:00"])}
                          className="text-[10.5px] text-blue-400 hover:text-blue-300 font-bold transition-all cursor-pointer"
                        >
                          + Thêm giờ đăng
                        </button>
                      </div>
                      <div className="flex flex-col gap-2.5">
                        {scheduleTimes.map((time, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input 
                              type="time" 
                              value={time}
                              onChange={(e) => {
                                const val = e.target.value;
                                setScheduleTimes(prev => prev.map((t, i) => i === idx ? val : t));
                              }}
                              className="flex-1 bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-zinc-300 outline-none focus:border-blue-500/50"
                            />
                            {scheduleTimes.length > 1 && (
                              <button 
                                onClick={() => setScheduleTimes(prev => prev.filter((_, i) => i !== idx))}
                                className="text-zinc-500 hover:text-red-400 p-2 border border-zinc-850 rounded-xl bg-zinc-950/20 cursor-pointer"
                                title="Xóa giờ đăng"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Ngày đăng bài (Weekdays Selector) */}
                    {scheduleMode === "weekly" && (
                      <div className="flex flex-col gap-3">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Ngày đăng bài</label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { name: "Thứ 2", value: 1 },
                            { name: "Thứ 3", value: 2 },
                            { name: "Thứ 4", value: 3 },
                            { name: "Thứ 5", value: 4 },
                            { name: "Thứ 6", value: 5 },
                            { name: "Thứ 7", value: 6 },
                            { name: "Chủ nhật", value: 7 }
                          ].map(day => {
                            const isSelected = scheduleDays.includes(day.value);
                            return (
                              <button
                                key={day.value}
                                type="button"
                                onClick={() => {
                                  setScheduleDays(prev => prev.includes(day.value) ? prev.filter(d => d !== day.value) : [...prev, day.value]);
                                }}
                                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                  isSelected 
                                    ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/10" 
                                    : "bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:border-zinc-805 hover:text-zinc-300"
                                }`}
                              >
                                {day.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Switches */}
                    <div className="flex flex-col gap-4 border-t border-zinc-850 pt-5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-300">Thêm thông tin liên hệ</span>
                        <button
                          type="button"
                          onClick={() => setIncludeContactInfo(!includeContactInfo)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 outline-none cursor-pointer ${
                            includeContactInfo ? "bg-blue-600" : "bg-zinc-850"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ${
                              includeContactInfo ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-300">Lặp lại hàng chờ khi hết bài</span>
                        <button
                          type="button"
                          onClick={() => setRepeatQueue(!repeatQueue)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 outline-none cursor-pointer ${
                            repeatQueue ? "bg-blue-600" : "bg-zinc-850"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ${
                              repeatQueue ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-300">Tự động viết và đăng bài</span>
                        <button
                          type="button"
                          onClick={() => setAutoWritePost(!autoWritePost)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 outline-none cursor-pointer ${
                            autoWritePost ? "bg-blue-600" : "bg-zinc-850"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ${
                              autoWritePost ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button 
                      onClick={handleSaveSetup}
                      disabled={submitting}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-blue-500/10 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 active:scale-[0.98]"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang lưu thiết lập...</span>
                        </>
                      ) : (
                        <span>Lưu thiết lập</span>
                      )}
                    </button>

                  </div>

                </div>

              </div>
            </div>
          ) : activeTab === "list" ? (
            /* Tab list of scheduled posts */
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="glass-panel rounded-2xl p-6 lg:p-8">
                <h2 className="text-lg font-semibold text-zinc-250 mb-6 flex items-center justify-between border-b border-zinc-850 pb-3">
                  <span>Danh sách bài viết đã lên lịch ({scheduledPosts.length})</span>
                  {!token?.startsWith("mock_") && (
                    <button 
                      onClick={fetchScheduledPosts}
                      className="text-xs text-zinc-500 hover:text-blue-450 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      Làm mới
                    </button>
                  )}
                </h2>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-500 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <span className="text-sm">Đang tải danh sách bài đăng...</span>
                  </div>
                ) : scheduledPosts.length === 0 ? (
                  <div className="text-center py-12 text-zinc-650 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20">
                    <Clock className="w-8 h-8 mx-auto text-zinc-700 mb-2.5" />
                    <p className="text-sm font-medium">Chưa có bài đăng nào được lên lịch</p>
                    <p className="text-xs text-zinc-600 mt-1">Sử dụng form thiết lập để lên lịch cho các bài đăng của bạn.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {scheduledPosts.map((post) => {
                      const matchedPages = fanpages.filter(p => post.fanpage_ids.includes(p.id));
                      
                      return (
                        <div key={post.id} className="bg-zinc-900/40 border border-zinc-850 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-800 transition-all">
                          <div>
                            {/* Header: Targets & Status */}
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="flex flex-wrap gap-1.5 max-w-[70%]">
                                {matchedPages.map(page => (
                                  <span 
                                    key={page.id}
                                    className="px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded text-[10px] font-medium truncate max-w-[100px]"
                                    title={page.name}
                                  >
                                    {page.name}
                                  </span>
                                ))}
                              </div>
                              
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                post.status === "published" ? "bg-green-500/10 text-green-400" :
                                post.status === "failed" ? "bg-red-500/10 text-red-400" :
                                post.status === "draft" ? "bg-zinc-500/20 text-zinc-400" :
                                "bg-amber-500/10 text-amber-400"
                              }`}>
                                {post.status === "published" ? "Đã đăng" :
                                 post.status === "failed" ? "Lỗi" :
                                 post.status === "draft" ? "Nháp" :
                                 "Đang chờ"}
                              </span>
                            </div>

                            {/* Content */}
                            <p className="text-xs text-zinc-300 line-clamp-3 mb-3 whitespace-pre-wrap">{post.content}</p>

                            {/* Attachment thumbnail */}
                            {post.image_url && (
                              <div className="w-full h-28 rounded-lg overflow-hidden border border-zinc-850 mb-3 bg-zinc-950 flex items-center justify-center">
                                <img src={post.image_url} alt="Attachment thumbnail" className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>

                          {/* Footer details */}
                          <div className="border-t border-zinc-850/80 pt-3 mt-2 flex items-center justify-between text-[11px] text-zinc-550">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-zinc-650 uppercase font-semibold">Giờ đăng</span>
                              <span className="text-zinc-400 font-medium">
                                {new Date(post.scheduled_at).toLocaleString("vi-VN")}
                              </span>
                            </div>

                            <button 
                              onClick={() => handleDeletePost(post.id)}
                              className="text-zinc-600 hover:text-red-400 p-1.5 hover:bg-zinc-900 rounded-lg transition-all cursor-pointer"
                              title="Hủy lịch & Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          {/* Error Log if failed */}
                          {post.status === "failed" && post.error_log && (
                            <div className="mt-3 p-2 bg-red-950/20 border border-red-900/30 text-red-400 rounded-lg text-[10px] font-mono break-all max-h-[80px] overflow-y-auto">
                              <strong>Lỗi:</strong> {post.error_log}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Tab automation activation */
            <div className="flex flex-col gap-8 animate-fade-in">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                
                {/* Left section: Main controls and Active Fanpages */}
                <div className="xl:col-span-8 flex flex-col gap-6">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-bold text-zinc-200">Danh sách Fanpage kết nối</h2>
                      <p className="text-zinc-500 text-xs mt-1">Lựa chọn và bật/tắt tự động hóa AI cho các Fanpage đã kết nối Zeflyo.</p>
                    </div>
                    <button
                      onClick={fetchFanpagesList}
                      className="self-start sm:self-center flex items-center gap-2 py-1.5 px-3 text-xs font-semibold bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl transition-all active:scale-95 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Làm mới danh sách
                    </button>
                  </div>

                  {fanpages.length === 0 ? (
                    <div className="glass-panel rounded-2xl p-10 text-center flex flex-col items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-zinc-900/80 border border-zinc-805 flex items-center justify-center text-zinc-500">
                        <Sliders className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-200">Không tìm thấy Trang nào</h3>
                        <p className="text-zinc-500 text-xs max-w-sm mt-1">Chúng tôi không tìm thấy bất kỳ Fanpage Facebook nào được liên kết với tài khoản này. Hãy xác minh trong Meta Developer Console.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {fanpages.map((page) => (
                        <div key={page.id} className="glass-card rounded-2xl p-5 flex flex-col justify-between gap-4">
                          
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-zinc-850 flex items-center justify-center font-bold text-white text-lg relative overflow-hidden shadow-inner">
                              {page.avatar_url ? (
                                <img src={page.avatar_url} alt={page.name} className="w-full h-full object-cover" />
                              ) : (
                                page.name.charAt(0)
                              )}
                              <div className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-blue-500 border border-zinc-900 m-0.5" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-zinc-250 truncate" title={page.name}>{page.name}</h4>
                              <span className="text-[10px] text-zinc-500 font-mono select-all">ID: {page.fb_page_id}</span>
                              
                              <div className="flex items-center gap-1.5 mt-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${page.is_active ? "bg-green-500 animate-pulse" : "bg-zinc-650"}`} />
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${page.is_active ? "text-green-400" : "text-zinc-500"}`}>
                                  {page.is_active ? "AI Agent Hoạt động" : "Ngoại tuyến"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Card Action footer */}
                          <div className="pt-3 border-t border-zinc-850 flex items-center justify-between">
                            <span className="text-[10px] text-zinc-500">Sẵn sàng nhận diện & phản hồi</span>
                            
                            <button
                              disabled={actionLoading === page.id}
                              onClick={() => togglePageAutomation(page.id, page.fb_page_id)}
                              className={`flex items-center gap-2 py-1 px-3 rounded-lg text-xs font-semibold select-none transition-all cursor-pointer ${
                                page.is_active 
                                  ? "bg-green-500/10 hover:bg-green-500/20 text-green-300 border border-green-500/30" 
                                  : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-850"
                              }`}
                            >
                              {actionLoading === page.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : page.is_active ? (
                                <>
                                  <Power className="w-3.5 h-3.5 text-green-400" />
                                  Hoạt động
                                </>
                              ) : (
                                <>
                                  <Power className="w-3.5 h-3.5 text-zinc-500" />
                                  Đã tắt
                                </>
                              )}
                            </button>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right section: Webhook status and logs */}
                <div className="xl:col-span-4 flex flex-col gap-6">
                  
                  {/* Webhook Connection status panel */}
                  <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                      <span className="text-xs uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-blue-500" />
                        Trạng thái Cổng kết nối
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">v20.0 SSL</span>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-850">
                        <span className="text-xs text-zinc-450">Bộ nhận Webhook</span>
                        <span className="text-xs text-green-455 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          Đang lắng nghe (200 OK)
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-850">
                        <span className="text-xs text-zinc-455">Hàng đợi Redis Horizon</span>
                        <span className="text-xs text-green-455 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          Hoạt động (0 jobs)
                        </span>
                      </div>

                      <div className="flex justify-between items-center bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-850">
                        <span className="text-xs text-zinc-455">Phát sóng WebSocket</span>
                        <span className="text-xs text-blue-400 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          Soketi Trực tuyến
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Activity Logs Panel */}
                  <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4 min-h-[300px]">
                    <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                      <span className="text-xs uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-violet-500" />
                        Hoạt động Thời gian thực
                      </span>
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                    </div>

                    <div className="flex flex-col gap-3 overflow-y-auto max-h-[320px] pr-1">
                      {logs.map((log) => (
                        <div key={log.id} className="p-3 bg-zinc-950/30 rounded-xl border border-zinc-850 hover:bg-zinc-900/10 transition-colors flex flex-col gap-1">
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-xs font-bold text-zinc-350 truncate">{log.page}</span>
                            <span className="text-[10px] text-zinc-550 shrink-0">{log.time}</span>
                          </div>
                          <p className="text-xs text-zinc-455 leading-relaxed">{log.event}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

        </div>

        {/* Footer Branding */}
        <footer className="w-full py-6 text-center text-xs text-zinc-650 border-t border-zinc-850 z-10 bg-[#09090b]/80 backdrop-blur-md mt-auto">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} Zeflyo Omnichannel Hub. All rights reserved.</p>
            <div className="flex gap-4 items-center">
              <span className="flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5" /> Phase 1 Setup Verified</span>
              <span>•</span>
              <span className="flex items-center gap-1.5"><Sliders className="w-3.5 h-3.5" /> Multi-Tenant Architecture</span>
            </div>
          </div>
        </footer>
        
      </div>

      {/* Global Notifications */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 p-4 rounded-xl bg-zinc-900 border border-green-500/30 text-green-400 text-sm shadow-2xl flex items-center gap-3 z-50 animate-fade-in">
          <Check className="w-5 h-5" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="fixed bottom-6 right-6 p-4 rounded-xl bg-zinc-900 border border-red-500/30 text-red-400 text-sm shadow-2xl flex items-center gap-3 z-50 animate-fade-in">
          <AlertTriangle className="w-5 h-5" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
