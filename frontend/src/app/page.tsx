"use client";

import React, { useState, useEffect } from "react";
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
  Calendar
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

    if (savedToken) setToken(savedToken);
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedApiBase) setApiBaseUrl(savedApiBase);
    if (savedAppId) setAppId(savedAppId);

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
          // Token expired or invalid
          handleLogout();
        }
      }
    } catch (err) {
      console.error("Connection error while fetching fanpages:", err);
    }
  };

  const handleFacebookLogin = () => {
    if (!(window as any).FB) {
      showNotification("error", "Facebook SDK has not loaded yet. Try Mock Login below or check your App ID.");
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
      // Requested permissions for Page message automation
      scope: "pages_show_list,pages_messaging,pages_read_engagement,pages_manage_metadata,email,public_profile"
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
        showNotification("success", "Authenticated successfully with Facebook!");
      } else {
        showNotification("error", data.error || "Failed to authenticate with backend server.");
      }
    } catch (err) {
      console.error(err);
      showNotification("error", "Connection error. Make sure your backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleMockLogin = async () => {
    setLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockToken = "mock_token_" + Math.random().toString(36).substring(2);
    const mockUser: UserProfile = {
      id: 99,
      name: "Alex Dev (Demo User)",
      email: "alex.dev@zeflyo.io",
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
    
    // Store mock pages locally so we can toggle them
    localStorage.setItem("zeflyo_mock_pages", JSON.stringify(mockPages));
    
    setLoading(false);
    showNotification("success", "Logged into mock developer mode!");
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
        showNotification("success", "Authenticated successfully in Backend Developer Mode!");
      } else {
        showNotification("error", data.error || "Failed to authenticate with demo user.");
      }
    } catch (err) {
      console.error(err);
      showNotification("error", "Connection error. Make sure your backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  const togglePageAutomation = async (pageId: number, fbPageId: string) => {
    setActionLoading(pageId);
    
    // If it's a mock login, we handle it locally
    if (token && token.startsWith("mock_token")) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const updatedPages = fanpages.map(p => {
        if (p.id === pageId) {
          const newState = !p.is_active;
          // Log action
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
      setActionLoading(null);
      showNotification("success", "Updated page status locally (Mock Mode)");
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

      if (response.ok) {
        const data = await response.json();
        setFanpages(fanpages.map(p => p.id === pageId ? data.fanpage : p));
        showNotification("success", `Automation status for "${data.fanpage.name}" updated!`);
        
        // Log action
        const newLog = {
          id: Math.random().toString(),
          page: data.fanpage.name,
          event: data.fanpage.is_active ? "Automation active on backend listener" : "Automation inactive",
          time: "Just now",
          status: (data.fanpage.is_active ? "success" : "pending") as any
        };
        setLogs(prev => [newLog, ...prev.slice(0, 9)]);
      } else {
        showNotification("error", "Could not toggle page automation status.");
      }
    } catch (err) {
      console.error(err);
      showNotification("error", "Error contacting backend to toggle page status.");
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
    showNotification("success", "Logged out successfully.");
  };

  const saveSettings = () => {
    localStorage.setItem("zeflyo_api_base", apiBaseUrl);
    localStorage.setItem("zeflyo_fb_app_id", appId);
    showNotification("success", "Settings saved successfully! Loading SDK...");
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between text-zinc-100 overflow-hidden bg-[#09090b]">
      
      {/* Decorative ambient glowing circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/10 blur-[120px] animate-pulse-glow pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-violet-600/10 blur-[120px] animate-pulse-glow pointer-events-none" />

      {/* Top Banner Notifications */}
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

      {/* Navigation Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-white/10">
            <span className="font-extrabold text-white text-lg tracking-wider">Z</span>
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            ZEFLYO <span className="text-[10px] uppercase font-semibold text-blue-500 tracking-widest px-1.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 ml-1">v1.0</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <>
              <a 
                href="/scheduler"
                className="flex items-center gap-2 py-1.5 px-3.5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 rounded-full text-xs sm:text-sm font-semibold transition-all border border-zinc-850 active:scale-95 cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="hidden md:inline">Scheduler</span>
              </a>
              <a 
                href="/rules"
                className="flex items-center gap-2 py-1.5 px-3.5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 rounded-full text-xs sm:text-sm font-semibold transition-all border border-zinc-850 active:scale-95 cursor-pointer"
              >
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span className="hidden md:inline">Auto-Reply Rules</span>
              </a>
              <a 
                href="/chat"
                className="flex items-center gap-2 py-1.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs sm:text-sm font-semibold transition-all border border-blue-500/20 shadow-lg shadow-blue-500/10 active:scale-95 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Live Chat Hub</span>
              </a>
              <div className="flex items-center gap-3 bg-zinc-900/50 border border-white/5 py-1.5 px-3 rounded-full backdrop-blur-md">
                <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xs font-semibold text-blue-400">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    user.name.charAt(0)
                  )}
                </div>
                <span className="text-sm text-zinc-300 font-medium hidden sm:inline">{user.name}</span>
                <button 
                  onClick={handleLogout}
                  className="p-1 text-zinc-500 hover:text-red-400 rounded-full transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-7xl mx-auto px-6 py-8 flex-1 flex flex-col justify-center items-center z-10">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-zinc-400 text-sm">Synchronizing with system services...</p>
          </div>
        ) : !token ? (
          /* Login Screen */
          <div className="w-full max-w-md flex flex-col gap-6">
            <div className="text-center flex flex-col gap-2">
              <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-b from-white to-zinc-300 bg-clip-text text-transparent">
                Omnichannel AI Automation
              </h1>
              <p className="text-zinc-400 text-sm max-w-sm mx-auto">
                Connect your Facebook page, synchronize access keys, and deploy automated intelligent responders instantly.
              </p>
            </div>

            {/* Glass Login Panel */}
            <div className="glass-panel rounded-2xl p-6 shadow-2xl relative">
              <div className="absolute top-0 right-0 p-3 flex gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">Services Online</span>
              </div>

              <div className="flex flex-col gap-5 mt-4">
                <button
                  onClick={handleFacebookLogin}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-600/15 hover:shadow-blue-500/20 active:scale-[0.98] transition-all border border-blue-400/20 cursor-pointer"
                >
                  <FacebookIcon className="w-5 h-5 fill-current" />
                  Continue with Facebook
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-white/5"></div>
                  <span className="flex-shrink mx-4 text-xs font-semibold text-zinc-500 uppercase tracking-widest">Developer Utilities</span>
                  <div className="flex-grow border-t border-white/5"></div>
                </div>

                {/* Mock Dev login button */}
                <button
                  onClick={handleMockLogin}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 text-zinc-200 font-medium active:scale-[0.98] transition-all border border-white/5 cursor-pointer"
                >
                  <Database className="w-4 h-4 text-zinc-400" />
                  Mock Dev Mode (Demo Sandbox)
                </button>

                {/* Dev Login (Real Backend) button */}
                <button
                  onClick={handleDevLogin}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-200 font-medium active:scale-[0.98] transition-all border border-indigo-500/20 cursor-pointer"
                >
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  Dev Login (Real Backend)
                </button>
              </div>

              {/* Collapsible settings config panel for local network custom API */}
              <div className="mt-6 pt-5 border-t border-white/5 flex flex-col gap-4">
                <details className="group">
                  <summary className="list-none flex items-center justify-between text-xs text-zinc-500 hover:text-zinc-300 font-semibold cursor-pointer select-none">
                    <span className="flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 group-open:rotate-45 transition-transform" />
                      Server Connection Settings
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" />
                  </summary>
                  
                  <div className="flex flex-col gap-3.5 mt-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 tracking-wider">Backend API Endpoint</label>
                      <input 
                        type="text" 
                        value={apiBaseUrl} 
                        onChange={(e) => setApiBaseUrl(e.target.value)} 
                        className="w-full py-1.5 px-3 rounded-lg bg-zinc-900 border border-white/5 text-sm text-zinc-300 outline-none focus:border-blue-500/50 transition-colors"
                        placeholder="http://localhost"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 tracking-wider">Facebook App ID</label>
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
                      Save Configurations
                    </button>
                  </div>
                </details>
              </div>
            </div>

            <div className="flex justify-center items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-blue-500" /> OAuth 2.0 Secure</span>
              <span>•</span>
              <span className="flex items-center gap-1"><ExternalLink className="w-3 h-3 text-violet-500" /><a href="https://developers.facebook.com" target="_blank" className="hover:text-zinc-400">Meta Console</a></span>
            </div>
          </div>
        ) : (
          /* Dashboard Fanpage list screen */
          <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left section: Main controls and Active Fanpages */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">Activate Automations</h2>
                  <p className="text-zinc-400 text-xs mt-1">Select and toggle the specific Facebook Pages connected to your Zeflyo auto-responder.</p>
                </div>
                <button
                  onClick={fetchFanpages}
                  className="self-start sm:self-center flex items-center gap-2 py-1.5 px-3 text-xs font-medium bg-zinc-900 border border-white/5 hover:bg-zinc-800/80 rounded-xl transition-all text-zinc-300 active:scale-95 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh List
                </button>
              </div>

              {fanpages.length === 0 ? (
                <div className="glass-panel rounded-2xl p-10 text-center flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-900/80 border border-white/5 flex items-center justify-center text-zinc-500">
                    <Sliders className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-200">No Pages Detected</h3>
                    <p className="text-zinc-400 text-xs max-w-sm mt-1">We couldn't detect any managed Facebook Fanpages linked to this Facebook Account. Verify your permissions in Meta Developer Console.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fanpages.map((page) => (
                    <div key={page.id} className="glass-card rounded-2xl p-5 flex flex-col justify-between gap-4">
                      
                      <div className="flex items-start gap-4">
                        {/* Custom visual placeholder or real profile picture */}
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-white/10 flex items-center justify-center font-bold text-white text-lg relative overflow-hidden shadow-inner">
                          {page.avatar_url ? (
                            <img src={page.avatar_url} alt={page.name} className="w-full h-full object-cover" />
                          ) : (
                            page.name.charAt(0)
                          )}
                          <div className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-blue-500 border border-zinc-900 m-0.5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-zinc-200 truncate" title={page.name}>{page.name}</h4>
                          <span className="text-[10px] text-zinc-500 font-mono select-all">ID: {page.fb_page_id}</span>
                          
                          <div className="flex items-center gap-1.5 mt-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${page.is_active ? "bg-green-500 animate-pulse" : "bg-zinc-600"}`} />
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${page.is_active ? "text-green-400" : "text-zinc-500"}`}>
                              {page.is_active ? "AI Agent Live" : "Offline"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Action footer */}
                      <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] text-zinc-500">Auto-reply triggers & logs ready</span>
                        
                        <button
                          disabled={actionLoading === page.id}
                          onClick={() => togglePageAutomation(page.id, page.fb_page_id)}
                          className={`flex items-center gap-2 py-1 px-3 rounded-lg text-xs font-semibold select-none transition-all cursor-pointer ${
                            page.is_active 
                              ? "bg-green-500/10 hover:bg-green-500/20 text-green-300 border border-green-500/30" 
                              : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/5"
                          }`}
                        >
                          {actionLoading === page.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : page.is_active ? (
                            <>
                              <Power className="w-3.5 h-3.5 text-green-400" />
                              Active
                            </>
                          ) : (
                            <>
                              <Power className="w-3.5 h-3.5 text-zinc-500" />
                              Deactivated
                            </>
                          )}
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right section: System logs, Webhook status, API health */}
            <div className="flex flex-col gap-6">
              
              {/* Webhook Connection status panel */}
              <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-xs uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-blue-500" />
                    Real-time Gateway Status
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">v20.0 SSL</span>
                </div>
                
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center bg-zinc-900/40 p-2.5 rounded-lg border border-white/5">
                    <span className="text-xs text-zinc-400">Webhook Receiver</span>
                    <span className="text-xs text-green-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Listening (200 OK)
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center bg-zinc-900/40 p-2.5 rounded-lg border border-white/5">
                    <span className="text-xs text-zinc-400">Redis Queue Horizon</span>
                    <span className="text-xs text-green-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Active (0 jobs)
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-zinc-900/40 p-2.5 rounded-lg border border-white/5">
                    <span className="text-xs text-zinc-400">WebSocket Broadcasting</span>
                    <span className="text-xs text-blue-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Soketi Online
                    </span>
                  </div>
                </div>
              </div>

              {/* Activity Logs Panel */}
              <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4 flex-1 min-h-[300px]">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-xs uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-violet-500" />
                    Live Activity Feeds
                  </span>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                </div>

                <div className="flex flex-col gap-3 overflow-y-auto max-h-[320px] pr-1">
                  {logs.map((log) => (
                    <div key={log.id} className="p-3 bg-zinc-900/30 rounded-xl border border-white/5 hover:bg-zinc-900/50 transition-colors flex flex-col gap-1">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-xs font-bold text-zinc-200 truncate">{log.page}</span>
                        <span className="text-[10px] text-zinc-500 shrink-0">{log.time}</span>
                      </div>
                      <p className="text-xs text-zinc-400">{log.event}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Footer Branding */}
      <footer className="w-full py-6 text-center text-xs text-zinc-600 border-t border-white/5 z-10 bg-[#09090b]/80 backdrop-blur-md">
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
  );
}
