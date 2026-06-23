"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { 
  Settings, 
  CheckCircle, 
  XCircle, 
  User, 
  LogOut, 
  RefreshCw, 
  Sliders, 
  Activity, 
  Bell, 
  Power, 
  Loader2,
  Shield,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Database,
  MessageSquare,
  Calendar,
  Globe,
  Sun,
  Moon,
  Home,
  ArrowLeft
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

interface Fanpage {
  id: number;
  user_id: number;
  fb_page_id: string;
  name: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
}

const translations = {
  en: {
    title: "Omnichannel AI Automation",
    subtitle: "Connect your Facebook page, synchronize access keys, and deploy automated intelligent responders instantly.",
    loginFb: "Continue with Facebook",
    mockLogin: "Mock Dev Mode (Demo Sandbox)",
    backendLogin: "Dev Login (Real Backend)",
    devUtilities: "Developer Utilities",
    serverSettings: "Server Connection Settings",
    apiEndpoint: "Backend API Endpoint",
    appId: "Facebook App ID",
    saveConfig: "Save Configurations",
    servicesOnline: "Services Online",
    authSecure: "OAuth 2.0 Secure",
    metaConsole: "Meta Console",
    activateAutomations: "Activate Automations",
    activateSub: "Select and toggle the specific Facebook Pages connected to your Zeflyo auto-responder.",
    refreshList: "Refresh List",
    noPages: "No Pages Detected",
    noPagesSub: "We couldn't detect any managed Facebook Fanpages linked to this Facebook Account. Verify your permissions in Meta Developer Console.",
    aiAgentLive: "AI Agent Live",
    offline: "Offline",
    toggleAuto: "Toggle Automation State",
    recentActivity: "Recent Activity Log",
    activitySub: "Live status updates and processing reports.",
    syncServices: "Synchronizing with system services...",
    authSuccess: "Authenticated successfully with Facebook!",
    loginSuccess: "Logged into mock developer mode!",
    backendLoginSuccess: "Authenticated successfully in Backend Developer Mode!",
    pageStatusUpdated: "Fanpage status updated successfully",
    unauthorizedPage: "Unauthorized to access this page",
    connectionError: "Connection error. Make sure your backend server is running.",
    sdkNotLoaded: "Facebook SDK has not loaded yet. Try Mock Login below or check your App ID.",
    signOut: "Sign Out",
    gatewayStatus: "Real-time Gateway Status",
    webhookReceiver: "Webhook Receiver",
    listening: "Listening (200 OK)",
    redisQueue: "Redis Queue Horizon",
    activeJobs: "Active (0 jobs)",
    websocketBroadcasting: "WebSocket Broadcasting",
    soketiOnline: "Soketi Online",
    liveActivity: "Live Activity Feeds",
    logReady: "Auto-reply triggers & logs ready",
    active: "Active",
    deactivated: "Deactivated"
  },
  vi: {
    title: "Tự Động Hóa AI Đa Kênh",
    subtitle: "Kết nối trang Facebook của bạn, đồng bộ hóa mã truy cập và triển khai các phản hồi thông minh tự động ngay lập tức.",
    loginFb: "Tiếp tục với Facebook",
    mockLogin: "Chế độ Giả lập (Hộp cát Demo)",
    backendLogin: "Đăng nhập Developer (Backend thật)",
    devUtilities: "Công cụ Nhà phát triển",
    serverSettings: "Cấu hình Kết nối Máy chủ",
    apiEndpoint: "Địa chỉ Backend API",
    appId: "Facebook App ID",
    saveConfig: "Lưu Cấu hình",
    servicesOnline: "Dịch vụ Hoạt động",
    authSecure: "Bảo mật OAuth 2.0",
    metaConsole: "Bảng điều khiển Meta",
    activateAutomations: "Kích hoạt Tự động hóa",
    activateSub: "Lựa chọn và bật/tắt tự động hóa AI cho các Fanpage đã kết nối Zeflyo.",
    refreshList: "Làm mới danh sách",
    noPages: "Không tìm thấy Trang nào",
    noPagesSub: "Chúng tôi không tìm thấy bất kỳ Fanpage Facebook nào được liên kết với tài khoản Facebook này. Hãy xác minh quyền truy cập trong Meta Developer Console.",
    aiAgentLive: "AI Agent Hoạt động",
    offline: "Ngoại tuyến",
    toggleAuto: "Chuyển trạng thái Tự động hóa",
    recentActivity: "Nhật ký hoạt động gần đây",
    activitySub: "Cập nhật trạng thái trực tiếp và báo cáo xử lý tin nhắn.",
    syncServices: "Đang đồng bộ hóa với hệ thống...",
    authSuccess: "Đăng nhập thành công bằng Facebook!",
    loginSuccess: "Đã đăng nhập chế độ giả lập!",
    backendLoginSuccess: "Đã đăng nhập chế độ Developer với Backend thành công!",
    pageStatusUpdated: "Cập nhật trạng thái Fanpage thành công",
    unauthorizedPage: "Không có quyền truy cập vào Fanpage này",
    connectionError: "Lỗi kết nối. Hãy chắc chắn rằng máy chủ backend đang chạy.",
    sdkNotLoaded: "Facebook SDK chưa được tải xong. Hãy thử chế độ Giả lập hoặc kiểm tra App ID.",
    signOut: "Đăng xuất",
    gatewayStatus: "Trạng thái Cổng kết nối",
    webhookReceiver: "Bộ nhận Webhook",
    listening: "Đang lắng nghe (200 OK)",
    redisQueue: "Hàng đợi Redis Horizon",
    activeJobs: "Hoạt động (0 jobs)",
    websocketBroadcasting: "Phát sóng WebSocket",
    soketiOnline: "Soketi Trực tuyến",
    liveActivity: "Hoạt động Thời gian thực",
    logReady: "Sẵn sàng nhận diện & phản hồi",
    active: "Hoạt động",
    deactivated: "Đã tắt"
  }
};

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [fanpages, setFanpages] = useState<Fanpage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [isSdkLoaded, setIsSdkLoaded] = useState<boolean>(false);
  const [appId, setAppId] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [lang, setLang] = useState<"en" | "vi">("vi"); // Default to Vietnamese
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  
  // Custom API configuration
  const [apiBaseUrl, setApiBaseUrl] = useState<string>("http://localhost");

  // Simulated activity logs for premium dashboard feel
  const [logs, setLogs] = useState<Array<{ id: string; page: string; event: string; time: string; status: "success" | "pending" | "info" }>>([
    { id: "1", page: "Zeflyo Fashion", event: "Webhook handshake verified", time: "2 minutes ago", status: "success" },
    { id: "2", page: "Zeflyo Food & Beverage", event: "Auto-reply sent: 'Hi! Thank you for contacting...'", time: "5 minutes ago", status: "success" },
    { id: "3", page: "Tech Support", event: "AI Agent assigned to customer thread", time: "12 minutes ago", status: "info" }
  ]);

  // Read config & credentials from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("zeflyo_token");
    const savedUser = localStorage.getItem("zeflyo_user");
    const savedApiBase = localStorage.getItem("zeflyo_api_base");
    const savedAppId = localStorage.getItem("zeflyo_fb_app_id");
    const savedLang = localStorage.getItem("zeflyo_lang");
    const savedTheme = localStorage.getItem("zeflyo_theme") || "dark";

    if (savedToken) setToken(savedToken);
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse saved user:", e);
        localStorage.removeItem("zeflyo_user");
      }
    }
    if (savedApiBase) setApiBaseUrl(savedApiBase);
    if (savedAppId) setAppId(savedAppId);
    if (savedLang === "en" || savedLang === "vi") setLang(savedLang);
    
    setTheme(savedTheme as "dark" | "light");
    if (savedTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }

    // Default appId if not set
    const initialAppId = savedAppId || "802422055100000"; // Placeholder test app id
    setAppId(initialAppId);

    setLoading(false);
  }, []);

  // Fetch fanpages when logged in
  useEffect(() => {
    if (token) {
      fetchFanpages();
    }
  }, [token, apiBaseUrl]);

  // Load Facebook SDK
  useEffect(() => {
    if (!appId) return;

    // Remove existing script if any
    const existingScript = document.getElementById("facebook-jssdk");
    if (existingScript) {
      existingScript.remove();
    }

    // Initialize SDK
    (window as any).fbAsyncInit = function() {
      (window as any).FB.init({
        appId      : appId,
        cookie     : true,
        xfbml      : true,
        version    : "v20.0"
      });
      setIsSdkLoaded(true);
      console.log("Facebook SDK initialized successfully.");
    };

    // Load SDK script
    (function(d, s, id) {
      var js: any, fjs: any = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, "script", "facebook-jssdk"));

  }, [appId]);

  const showNotification = (type: "success" | "error", message: string) => {
    if (type === "success") {
      setSuccessMsg(message);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(message);
      setTimeout(() => setErrorMsg(null), 5000);
    }
  };

  const toggleLanguage = () => {
    const nextLang = lang === "en" ? "vi" : "en";
    setLang(nextLang);
    localStorage.setItem("zeflyo_lang", nextLang);
    document.documentElement.lang = nextLang;
  };

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

  const fetchFanpages = async () => {
    if (!token) return;

    // Handle mock token case locally to prevent calling real backend
    if (token.startsWith("mock_")) {
      const savedMockPages = localStorage.getItem("zeflyo_mock_pages");
      if (savedMockPages) {
        try {
          setFanpages(JSON.parse(savedMockPages));
        } catch (e) {
          console.error("Failed to parse mock pages from localStorage", e);
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
        setFanpages(data.fanpages || []);
      } else {
        console.error("Failed to fetch fanpages, server returned status:", response.status);
        if (response.status === 401) {
          handleLogout();
        }
      }
    } catch (err) {
      console.error("Connection error while fetching fanpages:", err);
    }
  };

  const handleFacebookLogin = () => {
    if (!(window as any).FB) {
      showNotification("error", translations[lang].sdkNotLoaded);
      return;
    }

    setLoading(true);
    (window as any).FB.login(function(response: any) {
      console.log("FB.login response:", response);
      if (response.authResponse) {
        const userAccessToken = response.authResponse.accessToken;
        sendTokenToBackend(userAccessToken);
      } else {
        setLoading(false);
        showNotification("error", "User cancelled Facebook login or did not fully authorize.");
      }
    }, {
      scope: "pages_show_list,pages_messaging,pages_read_engagement,pages_manage_metadata,pages_manage_posts,email,public_profile",
      auth_type: "rerequest"
    });
  };

  const sendTokenToBackend = async (accessToken: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/facebook/callback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ access_token: accessToken })
      });

      const data = await response.json();

      if (response.ok && data.token) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("zeflyo_token", data.token);
        localStorage.setItem("zeflyo_user", JSON.stringify(data.user));
        showNotification("success", translations[lang].authSuccess);
      } else {
        showNotification("error", data.error || "Failed to authenticate with backend server.");
      }
    } catch (err) {
      console.error(err);
      showNotification("error", translations[lang].connectionError);
    } finally {
      setLoading(false);
    }
  };

  const handleMockLogin = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockToken = "mock_token_" + Math.random().toString(36).substring(2);
    const mockUser: UserProfile = {
      id: 99,
      name: "Đức Tiến",
      email: "ductien@zeflyo.io",
      avatar: null
    };

    const mockPages: Fanpage[] = [
      {
        id: 1,
        user_id: 99,
        fb_page_id: "109849204982312",
        name: "Zeflyo Fashion Store",
        avatar_url: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        user_id: 99,
        fb_page_id: "304958230495823",
        name: "Zeflyo Food & Beverage",
        avatar_url: null,
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 3,
        user_id: 99,
        fb_page_id: "495829348572934",
        name: "Tech Support Portal",
        avatar_url: null,
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    setToken(mockToken);
    setUser(mockUser);
    setFanpages(mockPages);
    localStorage.setItem("zeflyo_token", mockToken);
    localStorage.setItem("zeflyo_user", JSON.stringify(mockUser));
    localStorage.setItem("zeflyo_mock_pages", JSON.stringify(mockPages));
    
    setLoading(false);
    showNotification("success", translations[lang].loginSuccess);
  };

  const handleDevLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/demo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });

      const data = await response.json();

      if (response.ok && data.token) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("zeflyo_token", data.token);
        localStorage.setItem("zeflyo_user", JSON.stringify(data.user));
        showNotification("success", translations[lang].backendLoginSuccess);
      } else {
        showNotification("error", data.error || "Failed to authenticate with demo user.");
      }
    } catch (err) {
      console.error(err);
      showNotification("error", translations[lang].connectionError);
    } finally {
      setLoading(false);
    }
  };

  const togglePageAutomation = async (pageId: number, fbPageId: string) => {
    setActionLoading(pageId);
    
    if (token && token.startsWith("mock_token")) {
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
      showNotification("success", translations[lang].pageStatusUpdated);
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
        showNotification("success", translations[lang].pageStatusUpdated);
      } else {
        showNotification("error", data.error || translations[lang].unauthorizedPage);
      }
    } catch (err) {
      console.error(err);
      showNotification("error", translations[lang].connectionError);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setFanpages([]);
    localStorage.removeItem("zeflyo_token");
    localStorage.removeItem("zeflyo_user");
    localStorage.removeItem("zeflyo_mock_pages");
  };

  const saveSettings = () => {
    localStorage.setItem("zeflyo_api_base", apiBaseUrl);
    localStorage.setItem("zeflyo_fb_app_id", appId);
    showNotification("success", translations[lang].saveConfig);
  };

  const t = translations[lang];

  return (
    <div className="min-h-screen animated-gradient text-[#f4f4f5] flex relative overflow-hidden font-sans">
      
      {/* Background Glow Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none animate-pulse-glow-delayed" />

      {errorMsg && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-200 backdrop-blur-md transition-all shadow-lg animate-float">
          <XCircle className="w-5 h-5 text-red-400" />
          <span className="text-sm font-medium">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border border-green-500/20 bg-green-500/10 text-green-200 backdrop-blur-md transition-all shadow-lg animate-float">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 min-h-screen py-20 relative z-10">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-zinc-400 text-sm">{t.syncServices}</p>
        </div>
      ) : !token ? (
        /* Login Screen (Centered in the viewport) */
        <div className="flex-1 flex flex-col justify-center items-center p-6 relative z-10 min-h-screen">
          
          {/* Top small language/theme bar for login */}
          <div className="absolute top-6 right-6 flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 rounded-full text-xs font-semibold transition-all border border-zinc-850 cursor-pointer active:scale-95 shadow-sm"
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>{lang === "en" ? "EN" : "VI"}</span>
            </button>
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-8 h-8 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 rounded-full transition-all border border-zinc-850 cursor-pointer active:scale-95 shadow-sm"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>
          </div>

          <div className="w-full max-w-md flex flex-col gap-6">
            <div className="text-center flex flex-col gap-2">
              {/* Logo */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-white/10">
                  <span className="font-extrabold text-white text-lg tracking-wider">Z</span>
                </div>
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent logo-text">
                  ZEFLYO
                </span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-b from-white to-zinc-300 bg-clip-text text-transparent">
                {t.title}
              </h1>
              <p className="text-zinc-400 text-xs max-w-sm mx-auto leading-normal">
                {t.subtitle}
              </p>
            </div>

            {/* Glass Login Panel */}
            <div className="glass-panel rounded-2xl p-6 shadow-2xl relative">
              <div className="absolute top-0 right-0 p-3 flex gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">{t.servicesOnline}</span>
              </div>

              <div className="flex flex-col gap-5 mt-4">
                <button
                  onClick={handleFacebookLogin}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-600/15 hover:shadow-blue-500/20 active:scale-[0.98] transition-all border border-blue-400/20 cursor-pointer"
                >
                  <FacebookIcon className="w-5 h-5 fill-current" />
                  {t.loginFb}
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-zinc-800"></div>
                  <span className="flex-shrink mx-4 text-xs font-semibold text-zinc-500 uppercase tracking-widest">{t.devUtilities}</span>
                  <div className="flex-grow border-t border-zinc-800"></div>
                </div>

                {/* Mock Dev login button */}
                <button
                  onClick={handleMockLogin}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 text-zinc-200 font-medium active:scale-[0.98] transition-all border border-white/5 cursor-pointer"
                >
                  <Database className="w-4 h-4 text-zinc-400" />
                  {t.mockLogin}
                </button>

                {/* Dev Login (Real Backend) button */}
                <button
                  onClick={handleDevLogin}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-200 font-medium active:scale-[0.98] transition-all border border-indigo-500/20 cursor-pointer"
                >
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  {t.backendLogin}
                </button>
              </div>

              {/* Collapsible settings config panel for local network custom API */}
              <div className="mt-6 pt-5 border-t border-white/5 flex flex-col gap-4">
                <details className="group">
                  <summary className="list-none flex items-center justify-between text-xs text-zinc-500 hover:text-zinc-300 font-semibold cursor-pointer select-none">
                    <span className="flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 group-open:rotate-45 transition-transform" />
                      {t.serverSettings}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" />
                  </summary>
                  
                  <div className="flex flex-col gap-3.5 mt-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 tracking-wider">{t.apiEndpoint}</label>
                      <input 
                        type="text" 
                        value={apiBaseUrl} 
                        onChange={(e) => setApiBaseUrl(e.target.value)} 
                        className="w-full py-1.5 px-3 rounded-lg bg-zinc-900 border border-white/5 text-sm text-zinc-300 outline-none focus:border-blue-500/50 transition-colors"
                        placeholder="http://localhost"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 tracking-wider">{t.appId}</label>
                      <input 
                        type="text" 
                        value={appId} 
                        onChange={(e) => setAppId(e.target.value)} 
                        className="w-full py-1.5 px-3 rounded-lg bg-zinc-900 border border-white/5 text-sm text-zinc-300 outline-none focus:border-blue-500/50 transition-colors"
                        placeholder="App ID from Meta Developer console"
                      />
                    </div>
                    <button
                      onClick={saveSettings}
                      className="w-full py-1.5 px-3 text-xs font-semibold text-white rounded-lg bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-800 transition-colors border border-white/5"
                    >
                      {t.saveConfig}
                    </button>
                  </div>
                </details>
              </div>
            </div>

            <div className="flex justify-center items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-blue-500" /> {t.authSecure}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ExternalLink className="w-3.5 h-3.5 text-violet-500" />
                <a href="https://developers.facebook.com" target="_blank" className="hover:text-zinc-400">{t.metaConsole}</a>
              </span>
            </div>
          </div>
          
        </div>
      ) : (
        /* Left Sidebar Layout (Authenticated) */
        <>
          <Sidebar
            currentPath="/"
            user={user}
            lang={lang}
            toggleLanguage={toggleLanguage}
            theme={theme}
            toggleTheme={toggleTheme}
            handleLogout={handleLogout}
          />

          {/* Main Content Workspace */}
          <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto relative z-10">
            
            {/* Mobile Header */}
            <header className="w-full bg-[#18181b]/50 border-b border-zinc-800 px-6 py-4 flex items-center justify-between lg:hidden">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center">
                  <span className="font-extrabold text-white text-xs">Z</span>
                </div>
                <span className="font-bold text-sm tracking-wider bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent logo-text">ZEFLYO</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleLanguage}
                  className="flex items-center justify-center gap-1 py-1 px-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg text-xs font-semibold"
                >
                  {lang === "en" ? "EN" : "VI"}
                </button>
                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-center w-8 h-8 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl"
                >
                  {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-zinc-450 hover:text-red-400"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Content Pane */}
            <div className="flex-1 p-6 lg:p-10 max-w-7xl w-full mx-auto flex flex-col gap-6">
              
              {/* Header title */}
              <div className="flex flex-col gap-1.5 border-b border-zinc-850 pb-5">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-wider text-zinc-150 uppercase">
                  {t.activateAutomations}
                </h1>
                <p className="text-xs text-zinc-550">
                  {t.activateSub}
                </p>
              </div>

              {/* Two-Column Workspace */}
              <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                
                {/* Left Column: Active Fanpages List */}
                <div className="xl:col-span-8 flex flex-col gap-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-base font-bold text-zinc-200">Danh sách Fanpage kết nối</h2>
                    <button
                      onClick={fetchFanpages}
                      className="flex items-center gap-2 py-1.5 px-3 text-xs font-semibold bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl transition-all active:scale-95 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      {t.refreshList}
                    </button>
                  </div>

                  {fanpages.length === 0 ? (
                    <div className="glass-panel rounded-2xl p-10 text-center flex flex-col items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-zinc-900/80 border border-zinc-805 flex items-center justify-center text-zinc-500">
                        <Sliders className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-200">{t.noPages}</h3>
                        <p className="text-zinc-555 text-xs max-w-sm mt-1">{t.noPagesSub}</p>
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
                                  {page.is_active ? t.aiAgentLive : t.offline}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Card Action footer */}
                          <div className="pt-3 border-t border-zinc-850 flex items-center justify-between">
                            <span className="text-[10px] text-zinc-500">{t.logReady}</span>
                            
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
                                  {t.active}
                                </>
                              ) : (
                                <>
                                  <Power className="w-3.5 h-3.5 text-zinc-500" />
                                  {t.deactivated}
                                </>
                              )}
                            </button>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column: Webhook Gateway & Live Activity Logs */}
                <div className="xl:col-span-4 flex flex-col gap-6">
                  
                  {/* Webhook Connection status panel */}
                  <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                      <span className="text-xs uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-blue-500" />
                        {t.gatewayStatus}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">v20.0 SSL</span>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-850">
                        <span className="text-xs text-zinc-455">{t.webhookReceiver}</span>
                        <span className="text-xs text-green-455 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          {t.listening}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-850">
                        <span className="text-xs text-zinc-455">{t.redisQueue}</span>
                        <span className="text-xs text-green-455 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          {t.activeJobs}
                        </span>
                      </div>

                      <div className="flex justify-between items-center bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-850">
                        <span className="text-xs text-zinc-455">{t.websocketBroadcasting}</span>
                        <span className="text-xs text-blue-400 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          {t.soketiOnline}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Activity Logs Panel */}
                  <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4 min-h-[300px]">
                    <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                      <span className="text-xs uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-violet-500" />
                        {t.liveActivity}
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
        </>
      )}
    </div>
  );
}
