"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft,
  Plus,
  Trash2,
  Edit3,
  Search,
  Filter,
  Check,
  AlertTriangle,
  Loader2,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  HelpCircle,
  Sun,
  Moon,
  Home,
  Calendar,
  MessageSquare,
  Sliders,
  Globe,
  LogOut,
  ChevronDown,
  ChevronRight
} from "lucide-react";

interface Fanpage {
  id: number;
  user_id: number;
  fb_page_id: string;
  name: string;
  avatar_url: string | null;
  is_active: boolean;
}

interface AutoReplyRule {
  id: number;
  fanpage_id: number;
  keyword: string;
  reply_content: string;
  is_active: boolean;
  created_at: string;
  fanpage?: Fanpage;
}

export default function AutoReplyRules() {
  const [token, setToken] = useState<string | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>("http://localhost");
  const [fanpages, setFanpages] = useState<Fanpage[]>([]);
  const [rules, setRules] = useState<AutoReplyRule[]>([]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  
  interface UserProfile {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
  }
  const [user, setUser] = useState<UserProfile | null>(null);
  const [lang, setLang] = useState<"en" | "vi">("vi");

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
  const [selectedPageFilter, setSelectedPageFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Loading & statuses
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<AutoReplyRule | null>(null);
  const [formFanpageId, setFormFanpageId] = useState<string>("");
  const [formKeyword, setFormKeyword] = useState<string>("");
  const [formReplyContent, setFormReplyContent] = useState<string>("");
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  // Load config & credentials
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

    // Initial mock page list
    if (savedPages) {
      try {
        setFanpages(JSON.parse(savedPages));
      } catch (e) {
        console.error("Failed to parse mock pages", e);
      }
    }
  }, []);

  // Fetch data
  useEffect(() => {
    if (token) {
      if (!token.startsWith("mock_")) {
        fetchRealFanpages();
        fetchRules();
      } else {
        // Load mock rules
        const mockRules = localStorage.getItem("zeflyo_mock_rules");
        if (mockRules) {
          try {
            setRules(JSON.parse(mockRules));
          } catch (e) {
            console.error(e);
          }
        } else {
          // Add default mock rule
          const defaultMockRules: AutoReplyRule[] = [
            {
              id: 1,
              fanpage_id: 1,
              keyword: "giá",
              reply_content: "Chào bạn! Bộ sản phẩm Zeflyo Collection hiện có giá ưu đãi là 499k, miễn phí vận chuyển toàn quốc. Bạn có muốn đặt hàng ngay không ạ?",
              is_active: true,
              created_at: new Date().toISOString()
            },
            {
              id: 2,
              fanpage_id: 1,
              keyword: "tư vấn",
              reply_content: "Chào bạn! Chuyên viên tư vấn của Zeflyo sẽ inbox hỗ trợ bạn ngay trong vòng 2 phút. Xin vui lòng đợi một chút nhé!",
              is_active: false,
              created_at: new Date().toISOString()
            }
          ];
          setRules(defaultMockRules);
          localStorage.setItem("zeflyo_mock_rules", JSON.stringify(defaultMockRules));
        }
        setLoading(false);
      }
    }
  }, [token, apiBaseUrl]);

  const showNotification = (type: "success" | "error", message: string) => {
    if (type === "success") {
      setSuccessMsg(message);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(message);
      setTimeout(() => setErrorMsg(null), 5000);
    }
  };

  const fetchRealFanpages = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/fanpages`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFanpages(data.fanpages || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/auto-reply-rules`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRules(data.rules || []);
      }
    } catch (err) {
      console.error("Error fetching rules:", err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle active switch instantly with animations
  const handleToggleActive = async (ruleId: number, currentStatus: boolean) => {
    const updatedStatus = !currentStatus;

    // Optimistically update UI
    setRules(prev => prev.map(rule => rule.id === ruleId ? { ...rule, is_active: updatedStatus } : rule));

    if (token && token.startsWith("mock_")) {
      const updatedRules = rules.map(rule => rule.id === ruleId ? { ...rule, is_active: updatedStatus } : rule);
      localStorage.setItem("zeflyo_mock_rules", JSON.stringify(updatedRules));
      showNotification("success", `Trạng thái luật đã được cập nhật!`);
    } else {
      try {
        const response = await fetch(`${apiBaseUrl}/api/auto-reply-rules/${ruleId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ is_active: updatedStatus })
        });
        if (!response.ok) {
          // Revert on error
          setRules(prev => prev.map(rule => rule.id === ruleId ? { ...rule, is_active: currentStatus } : rule));
          showNotification("error", "Không thể cập nhật trạng thái luật.");
        } else {
          showNotification("success", "Trạng thái luật đã được cập nhật!");
        }
      } catch (err) {
        setRules(prev => prev.map(rule => rule.id === ruleId ? { ...rule, is_active: currentStatus } : rule));
        showNotification("error", "Lỗi kết nối.");
      }
    }
  };

  // Open Modal for Add/Edit
  const openModal = (rule: AutoReplyRule | null = null) => {
    if (rule) {
      setEditingRule(rule);
      setFormFanpageId(rule.fanpage_id.toString());
      setFormKeyword(rule.keyword);
      setFormReplyContent(rule.reply_content);
      setFormIsActive(rule.is_active);
    } else {
      setEditingRule(null);
      setFormFanpageId(fanpages[0]?.id.toString() || "");
      setFormKeyword("");
      setFormReplyContent("");
      setFormIsActive(true);
    }
    setIsModalOpen(true);
  };

  // Handle Save
  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFanpageId) {
      showNotification("error", "Vui lòng chọn Fanpage.");
      return;
    }
    if (!formKeyword.trim()) {
      showNotification("error", "Từ khóa không được để trống.");
      return;
    }
    if (!formReplyContent.trim()) {
      showNotification("error", "Nội dung phản hồi không được để trống.");
      return;
    }

    setSubmitting(true);

    const payload = {
      fanpage_id: parseInt(formFanpageId),
      keyword: formKeyword.trim(),
      reply_content: formReplyContent.trim(),
      is_active: formIsActive
    };

    if (token && token.startsWith("mock_")) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let updatedRules: AutoReplyRule[] = [];
      if (editingRule) {
        // Edit
        updatedRules = rules.map(r => r.id === editingRule.id ? { ...r, ...payload } : r);
        showNotification("success", "Cập nhật luật thành công.");
      } else {
        // Create
        const newRule: AutoReplyRule = {
          id: Math.floor(Math.random() * 100000),
          ...payload,
          created_at: new Date().toISOString()
        };
        updatedRules = [newRule, ...rules];
        showNotification("success", "Thêm luật auto-reply mới thành công.");
      }

      setRules(updatedRules);
      localStorage.setItem("zeflyo_mock_rules", JSON.stringify(updatedRules));
      setIsModalOpen(false);
      setSubmitting(false);
    } else {
      try {
        const url = editingRule 
          ? `${apiBaseUrl}/api/auto-reply-rules/${editingRule.id}` 
          : `${apiBaseUrl}/api/auto-reply-rules`;
        const method = editingRule ? "PUT" : "POST";

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
          showNotification("success", editingRule ? "Cập nhật luật thành công." : "Thêm luật mới thành công.");
          fetchRules();
          setIsModalOpen(false);
        } else {
          showNotification("error", data.error || "Gặp lỗi khi lưu luật.");
        }
      } catch (err) {
        showNotification("error", "Lỗi kết nối đến backend.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Delete rule
  const handleDeleteRule = async (ruleId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa luật phản hồi này không?")) return;

    if (token && token.startsWith("mock_")) {
      const updatedRules = rules.filter(r => r.id !== ruleId);
      setRules(updatedRules);
      localStorage.setItem("zeflyo_mock_rules", JSON.stringify(updatedRules));
      showNotification("success", "Xóa luật phản hồi thành công.");
    } else {
      try {
        const response = await fetch(`${apiBaseUrl}/api/auto-reply-rules/${ruleId}`, {
          method: "DELETE",
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });
        if (response.ok) {
          showNotification("success", "Xóa luật phản hồi thành công.");
          fetchRules();
        } else {
          showNotification("error", "Không thể xóa luật phản hồi.");
        }
      } catch (err) {
        showNotification("error", "Lỗi kết nối.");
      }
    }
  };

  // Filter and search rules
  const filteredRules = rules.filter(rule => {
    const matchesPage = selectedPageFilter === "all" || rule.fanpage_id.toString() === selectedPageFilter;
    const matchesSearch = rule.keyword.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          rule.reply_content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPage && matchesSearch;
  });

  return (
    <div className="min-h-screen animated-gradient text-[#f4f4f5] flex relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-950/10 blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none animate-pulse-glow-delayed" />

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
          {/* Trang chủ */}
          <a
            href="/"
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-all text-xs font-semibold uppercase"
          >
            <Home className="w-4 h-4 text-zinc-500" />
            <span>Trang chủ</span>
          </a>

          {/* Lên lịch đăng bài */}
          <a
            href="/scheduler"
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-all text-xs font-semibold uppercase"
          >
            <Calendar className="w-4 h-4 text-zinc-500" />
            <span>Lên lịch đăng bài</span>
          </a>

          {/* Hộp thư tập trung */}
          <a
            href="/chat"
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-all text-xs font-semibold uppercase"
          >
            <MessageSquare className="w-4 h-4 text-zinc-500" />
            <span>Hộp thư tập trung</span>
          </a>

          {/* Luật Auto-reply (Active) */}
          <a
            href="/rules"
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-zinc-900 text-zinc-200 transition-all text-xs font-bold uppercase tracking-wider shadow-sm"
          >
            <Sliders className="w-4 h-4 text-blue-500" />
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
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto relative z-10">
        
        {/* Mobile Header */}
        <header className="w-full bg-[#18181b]/50 border-b border-zinc-800 px-6 py-4 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-3">
            <a href="/" className="p-2 rounded-xl bg-zinc-900 border border-zinc-805 text-zinc-400">
              <ArrowLeft className="w-4 h-4" />
            </a>
            <span className="font-bold text-sm tracking-wider bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent logo-text">ZEFLYO</span>
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

        {/* Content Pane */}
        <div className="flex-1 p-6 lg:p-10 max-w-7xl w-full mx-auto flex flex-col gap-6">
          
          {/* Header title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-850 pb-5">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-wider text-zinc-150 uppercase flex items-center gap-2">
                Auto-Reply Rules <Sparkles className="w-5 h-5 text-indigo-400" />
              </h1>
              <p className="text-xs text-zinc-550 mt-1">Thiết lập luật tự động phản hồi bình luận và tin nhắn Messenger theo từ khóa</p>
            </div>
            
            <button 
              onClick={() => openModal()}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/15 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm luật phản hồi</span>
            </button>
          </div>

      {/* Control Panel: Filters & Search */}
      <section className="max-w-7xl mx-auto glass-panel rounded-2xl p-4 lg:p-6 mb-8 relative z-10 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm từ khóa hoặc câu trả lời..."
            className="w-full bg-zinc-950/60 border border-zinc-850 focus:border-blue-500/50 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-1 focus:ring-blue-500/30 outline-none transition-all placeholder:text-zinc-600"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
          <span className="text-xs text-zinc-550 flex items-center gap-1.5 font-medium uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5" /> Lọc theo Fanpage:
          </span>
          <select
            value={selectedPageFilter}
            onChange={(e) => setSelectedPageFilter(e.target.value)}
            className="bg-zinc-950/80 border border-zinc-850 hover:border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-300 outline-none focus:ring-1 focus:ring-blue-500/20 cursor-pointer min-w-[180px] transition-all"
          >
            <option value="all">Tất cả Fanpage</option>
            {fanpages.map(page => (
              <option key={page.id} value={page.id}>{page.name}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Rules List Container */}
      <main className="max-w-7xl mx-auto relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <span className="text-sm">Đang tải danh sách luật auto-reply...</span>
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="text-center py-16 text-zinc-650 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/20 max-w-2xl mx-auto">
            <HelpCircle className="w-10 h-10 mx-auto text-zinc-700 mb-3" />
            <p className="text-base font-semibold">Chưa tìm thấy luật phản hồi nào</p>
            <p className="text-xs text-zinc-600 mt-1.5 max-w-sm mx-auto">
              Không có luật nào khớp với bộ lọc hiện tại. Nhấn nút "Thêm luật phản hồi" ở trên để thiết lập phản hồi tự động.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRules.map((rule) => {
              const rulePage = fanpages.find(p => p.id === rule.fanpage_id);
              
              return (
                <div 
                  key={rule.id}
                  className={`glass-card rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
                    rule.is_active ? "border-zinc-800" : "border-zinc-900 opacity-60 hover:opacity-80"
                  }`}
                >
                  <div>
                    {/* Header: Page Badge & Toggle Switch */}
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <span className="px-2.5 py-1 bg-zinc-900 text-zinc-400 rounded-lg text-[10px] font-semibold border border-zinc-800 max-w-[60%] truncate">
                        {rulePage?.name || `Fanpage ID: ${rule.fanpage_id}`}
                      </span>

                      {/* Custom Switch Toggle with micro-animations */}
                      <button
                        onClick={() => handleToggleActive(rule.id, rule.is_active)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 outline-none cursor-pointer ${
                          rule.is_active 
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-500/10" 
                            : "bg-zinc-800"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ${
                            rule.is_active ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Trigger Keyword Badges */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[11px] font-semibold text-zinc-550 uppercase tracking-wide">Từ khóa:</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-bold font-mono">
                        {rule.keyword}
                      </span>
                    </div>

                    {/* Reply Text */}
                    <div className="flex flex-col gap-1 mb-4">
                      <span className="text-[11px] font-semibold text-zinc-550 uppercase tracking-wide">Nội dung phản hồi:</span>
                      <p className="text-xs text-zinc-300 line-clamp-4 whitespace-pre-wrap bg-zinc-950/40 border border-zinc-850 p-2.5 rounded-xl min-h-[70px]">
                        {rule.reply_content}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-zinc-850/60 pt-4 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-600">
                      Tạo ngày: {new Date(rule.created_at).toLocaleDateString("vi-VN")}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openModal(rule)}
                        className="text-zinc-500 hover:text-zinc-200 p-1.5 hover:bg-zinc-850 rounded-lg transition-all cursor-pointer"
                        title="Sửa luật"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-zinc-500 hover:text-red-400 p-1.5 hover:bg-zinc-850 rounded-lg transition-all cursor-pointer"
                        title="Xóa luật"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* CRUD Popover Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 lg:p-8 animate-float-short">
            <h3 className="text-lg font-bold text-zinc-150 mb-5 pb-2 border-b border-zinc-850">
              {editingRule ? "Chỉnh sửa luật Auto-Reply" : "Thêm luật Auto-Reply mới"}
            </h3>

            <form onSubmit={handleSaveRule} className="flex flex-col gap-5">
              {/* Fanpage select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Chọn Fanpage áp dụng</label>
                <select
                  value={formFanpageId}
                  onChange={(e) => setFormFanpageId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500/50 rounded-xl px-3 py-2.5 text-sm text-zinc-300 outline-none transition-all cursor-pointer"
                >
                  <option value="" disabled>-- Chọn Fanpage --</option>
                  {fanpages.map(page => (
                    <option key={page.id} value={page.id}>{page.name}</option>
                  ))}
                </select>
              </div>

              {/* Keyword */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Từ khóa (Keyword)</label>
                <input 
                  type="text"
                  value={formKeyword}
                  onChange={(e) => setFormKeyword(e.target.value)}
                  placeholder="Ví dụ: giá, bao nhiêu, ib, tư vấn"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500/50 rounded-xl px-3 py-2.5 text-sm text-zinc-300 outline-none transition-all placeholder:text-zinc-700"
                />
                <span className="text-[10px] text-zinc-500">
                  Hệ thống sẽ đối khớp từ khóa này để gửi tin nhắn hoặc bình luận phản hồi tự động.
                </span>
              </div>

              {/* Reply Content */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Nội dung phản hồi</label>
                <textarea
                  value={formReplyContent}
                  onChange={(e) => setFormReplyContent(e.target.value)}
                  placeholder="Nhập nội dung bạn muốn tự động gửi cho khách hàng..."
                  rows={4}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500/50 rounded-xl p-3 text-sm text-zinc-300 outline-none resize-none transition-all placeholder:text-zinc-700"
                />
              </div>

              {/* Is Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-zinc-950/60 border border-zinc-850 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-zinc-300">Kích hoạt luật</span>
                  <span className="text-[10px] text-zinc-550">Bật để luật hoạt động ngay sau khi lưu</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 outline-none cursor-pointer ${
                    formIsActive ? "bg-blue-600" : "bg-zinc-800"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ${
                      formIsActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs font-semibold transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/10 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <span>Lưu thay đổi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Notifications */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 p-4 rounded-xl bg-zinc-900 border border-green-500/30 text-green-400 text-sm shadow-2xl flex items-center gap-3 z-50 animate-float-short">
          <Check className="w-5 h-5" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="fixed bottom-6 right-6 p-4 rounded-xl bg-zinc-900 border border-red-500/30 text-red-400 text-sm shadow-2xl flex items-center gap-3 z-50 animate-float-short">
          <AlertTriangle className="w-5 h-5" />
          <span>{errorMsg}</span>
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
    </div>
  );
}
