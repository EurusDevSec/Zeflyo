"use client";

import React, { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { 
  ArrowLeft, 
  Send, 
  User, 
  Bot, 
  Sparkles, 
  RefreshCw, 
  Activity, 
  Search, 
  Power, 
  Loader2,
  Shield,
  MessageSquare,
  AlertCircle,
  Sun,
  Moon,
  Home,
  Calendar,
  Sliders,
  Globe,
  LogOut,
  ChevronDown,
  ChevronRight,
  HelpCircle
} from "lucide-react";
import { getEchoInstance } from "@/lib/echo";

interface Interaction {
  id: number;
  customer_id: number;
  fanpage_id: number;
  type: 'message' | 'comment';
  fb_item_id: string;
  fb_post_id: string | null;
  content: string;
  is_from_customer: boolean;
  created_at: string;
}

interface Conversation {
  customer_id: number;
  customer_name: string;
  customer_avatar: string | null;
  ai_active: boolean;
  fanpage_id: number;
  fanpage_name: string;
  last_interaction: {
    type: 'message' | 'comment';
    content: string;
    created_at: string;
    is_from_customer: boolean;
  } | null;
  unread?: boolean;
}

interface Fanpage {
  id: number;
  user_id: number;
  fb_page_id: string;
  name: string;
  avatar_url: string | null;
  is_active: boolean;
}

// React.memo Message Bubble to avoid redundant re-renders on large history sets
const MessageBubble = React.memo(function MessageBubble({ msg }: { msg: Interaction }) {
  const isCustomer = msg.is_from_customer;
  const isAi = msg.content.includes("🤖") || msg.fb_item_id.includes(".ai.") || msg.fb_item_id.startsWith("auto_reply");
  
  return (
    <div className={`flex ${isCustomer ? "justify-start" : "justify-end"} transition-all duration-200`}>
      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed border transition-all ${
        isCustomer 
          ? "bg-zinc-900 border-zinc-800 text-zinc-100" 
          : isAi
            ? "bg-amber-500/10 border-amber-500/20 text-amber-200"
            : "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/10"
      }`}>
        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        <span className={`block text-[10px] mt-1 text-right font-medium ${
          isCustomer ? "text-zinc-500" : "text-blue-200"
        }`}>
          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
});

// Premium Glassmorphic Skeleton Loader for messages
const MessageSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="flex justify-start">
      <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-2xl p-4 w-[60%] h-12" />
    </div>
    <div className="flex justify-end">
      <div className="bg-zinc-800/20 border border-zinc-700/20 rounded-2xl p-4 w-[45%] h-10" />
    </div>
    <div className="flex justify-start">
      <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-2xl p-4 w-[75%] h-16" />
    </div>
    <div className="flex justify-end">
      <div className="bg-zinc-800/20 border border-zinc-700/20 rounded-2xl p-4 w-[50%] h-12" />
    </div>
  </div>
);

export default function ChatHub() {
  const [token, setToken] = useState<string | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>("http://localhost");
  const [activeFanpage, setActiveFanpage] = useState<Fanpage | null>(null);
  const [fanpages, setFanpages] = useState<Fanpage[]>([]);
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
  
  // Chat state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Interaction[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>(" ");
  const [inputText, setInputText] = useState<string>("");
  
  // Mobile sliding states
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  
  // Loading & statuses
  const [loadingConvs, setLoadingConvs] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const [togglingAi, setTogglingAi] = useState<boolean>(false);
  const [wsStatus, setWsStatus] = useState<"connected" | "connecting" | "disconnected">("connecting");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Simulator state
  const [simMessage, setSimMessage] = useState<string>("Hello, is this Zeflyo Shop? I have a question.");
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simSuccess, setSimSuccess] = useState<boolean>(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const echoRef = useRef<any>(null);
  const activeChannelRef = useRef<any>(null);

  // 1. Initial configuration load
  useEffect(() => {
    const savedToken = localStorage.getItem("zeflyo_token");
    const savedApiBase = localStorage.getItem("zeflyo_api_base");
    const savedPages = localStorage.getItem("zeflyo_mock_pages");
    const savedTheme = localStorage.getItem("zeflyo_theme") || "dark";
    const savedUser = localStorage.getItem("zeflyo_user");
    const savedLang = localStorage.getItem("zeflyo_lang");

    if (!savedToken) {
      // Redirect to login if not authenticated
      window.location.href = "/";
      return;
    }

    setToken(savedToken);
    if (savedApiBase) setApiBaseUrl(savedApiBase);
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedLang === "en" || savedLang === "vi") setLang(savedLang as "en" | "vi");

    setTheme(savedTheme as "dark" | "light");
    if (savedTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }

    // Try to load connected pages to select active one
    let loadedPages = false;
    if (savedPages) {
      try {
        const pages: Fanpage[] = JSON.parse(savedPages);
        setFanpages(pages);
        if (pages.length > 0) {
          setActiveFanpage(pages[0]);
          loadedPages = true;
        }
      } catch (e) {
        console.error("Failed to parse pages", e);
      }
    }

    // Fallback seed mock pages if in Mock Mode but pages are missing
    if (savedToken.startsWith("mock_") && !loadedPages) {
      const mockPages: Fanpage[] = [
        {
          id: 1,
          user_id: 99,
          fb_page_id: "109849204982312",
          name: "Zeflyo Fashion Store",
          avatar_url: null,
          is_active: true,
        },
        {
          id: 2,
          user_id: 99,
          fb_page_id: "304958230495823",
          name: "Zeflyo Food & Beverage",
          avatar_url: null,
          is_active: false,
        }
      ];
      setFanpages(mockPages);
      setActiveFanpage(mockPages[0]);
      localStorage.setItem("zeflyo_mock_pages", JSON.stringify(mockPages));
    }
    
    // Clear initial space query
    setSearchQuery("");
  }, []);

  // 2. Fetch real pages if token is valid (non-mock)
  useEffect(() => {
    if (token && !token.startsWith("mock_")) {
      fetchRealFanpages();
    }
  }, [token, apiBaseUrl]);

  // 3. Fetch conversations when active page changes
  useEffect(() => {
    if (token && activeFanpage) {
      fetchConversations(activeFanpage.id);
      initWebSocket(activeFanpage.id);
    }

    return () => {
      // Cleanup WebSockets on unmount or active page change
      if (activeChannelRef.current && echoRef.current) {
        console.log("Leaving broadcast channel:", `fanpage.${activeFanpage?.id}`);
        echoRef.current.leave(`fanpage.${activeFanpage?.id}`);
      }
    };
  }, [token, activeFanpage, apiBaseUrl]);

  // 4. Fetch messages when selected conversation changes
  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.customer_id);
    } else {
      setMessages([]);
    }
  }, [selectedConv]);

  // 5. Auto-scroll to bottom of chat on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 6. Textarea auto-resize logic
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  // 7. Polling fallback: every 5s refresh conversations & active messages (for real mode)
  useEffect(() => {
    if (!token || token.startsWith("mock_") || !activeFanpage) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/conversations?fanpage_id=${activeFanpage.id}`, {
          headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data: Conversation[] = await res.json();
          setConversations(prev => {
            const merged = [...prev];
            data.forEach(incoming => {
              const idx = merged.findIndex(c => c.customer_id === incoming.customer_id);
              if (idx >= 0) {
                // Preserving local unread flag if state was updated
                merged[idx] = { 
                  ...merged[idx], 
                  last_interaction: incoming.last_interaction,
                  unread: merged[idx].unread || incoming.unread 
                };
              } else {
                merged.push(incoming);
              }
            });
            return merged.sort((a, b) => {
              const aT = a.last_interaction ? new Date(a.last_interaction.created_at).getTime() : 0;
              const bT = b.last_interaction ? new Date(b.last_interaction.created_at).getTime() : 0;
              return bT - aT;
            });
          });
        }
      } catch (_) { /* silent fail */ }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [token, activeFanpage, apiBaseUrl]);

  // 8. Polling for active conversation messages
  useEffect(() => {
    if (!token || token.startsWith("mock_") || !selectedConv) return;

    const msgPollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/conversations/${selectedConv.customer_id}/messages`, {
          headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const incoming: Interaction[] = data.data || [];
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const existingFbIds = new Set(prev.map(m => m.fb_item_id));
            const newMsgs = incoming.filter(m => !existingIds.has(m.id) && !existingFbIds.has(m.fb_item_id));
            if (newMsgs.length === 0) return prev;
            return [...prev, ...newMsgs];
          });
        }
      } catch (_) { /* silent fail */ }
    }, 5000);

    return () => clearInterval(msgPollInterval);
  }, [token, selectedConv, apiBaseUrl]);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior: "smooth"
          });
        }
      }, 50);
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
        const pages = data.fanpages || [];
        setFanpages(pages);
        if (pages.length > 0) {
          const targetPage = pages.find((p: Fanpage) => p.fb_page_id === "1028776643660761") || pages[0];
          setActiveFanpage(targetPage);
        } else {
          setLoadingConvs(false);
        }
      } else {
        setLoadingConvs(false);
      }
    } catch (err) {
      console.error("Failed to fetch real fanpages", err);
      setLoadingConvs(false);
    }
  };

  const fetchConversations = async (pageId: number) => {
    if (!token) return;
    setLoadingConvs(true);
    setErrorMsg(null);

    // Mock Mode fallback
    if (token.startsWith("mock_")) {
      setTimeout(() => {
        const mockConvs: Conversation[] = [
          {
            customer_id: 101,
            customer_name: "Jane Dove (Mock)",
            customer_avatar: null,
            ai_active: true,
            fanpage_id: pageId,
            fanpage_name: activeFanpage?.name || "Mock Page",
            last_interaction: {
              type: "message",
              content: "Hello! Is this store open?",
              created_at: new Date().toISOString(),
              is_from_customer: true
            },
            unread: false
          }
        ];
        setConversations(mockConvs);
        setSelectedConv(mockConvs[0]);
        setLoadingConvs(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/conversations?fanpage_id=${pageId}`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const formattedConvs = data.map((c: Conversation) => ({ ...c, unread: false }));
        setConversations(formattedConvs);
        if (formattedConvs.length > 0 && !selectedConv) {
          setSelectedConv(formattedConvs[0]);
        }
      } else {
        setErrorMsg("Failed to load conversations.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error loading conversations.");
    } finally {
      setLoadingConvs(false);
    }
  };

  const fetchMessages = async (customerId: number) => {
    if (!token) return;
    setLoadingMessages(true);

    // Mock Mode fallback
    if (token.startsWith("mock_")) {
      setTimeout(() => {
        setMessages([
          {
            id: 1,
            customer_id: customerId,
            fanpage_id: activeFanpage?.id || 1,
            type: "message",
            fb_item_id: "mock.msg.1",
            fb_post_id: null,
            content: "Hello! Is this store open?",
            is_from_customer: true,
            created_at: new Date(Date.now() - 60000).toISOString()
          }
        ]);
        setLoadingMessages(false);
      }, 300);
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/conversations/${customerId}/messages`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching messages", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // WebSocket / Echo Client Init
  const initWebSocket = (pageId: number) => {
    if (!token || token.startsWith("mock_")) {
      setWsStatus("connected");
      return;
    }

    setWsStatus("connecting");
    
    // Close existing connection if any
    if (echoRef.current) {
      echoRef.current.disconnect();
    }

    try {
      const echo = getEchoInstance(token, apiBaseUrl);
      echoRef.current = echo;

      // Handle socket connection states
      echo.connector.pusher.connection.bind('state_change', (states: any) => {
        console.log("WS Connection State Changed:", states.current);
        if (states.current === 'connected') {
          setWsStatus("connected");
        } else if (states.current === 'unavailable' || states.current === 'failed' || states.current === 'disconnected') {
          setWsStatus("disconnected");
        } else {
          setWsStatus("connecting");
        }
      });

      console.log(`Subscribing to channel: private-fanpage.${pageId}`);
      
      const channel = echo.private(`fanpage.${pageId}`);
      activeChannelRef.current = channel;

      // Listen to incoming messages from customers
      channel.listen("MessageReceived", (event: any) => {
        console.log("MessageReceived event caught:", event);
        handleIncomingEvent(event);
      });

      // Listen to admin outgoing responses (AI or other browser tabs)
      channel.listen("MessageSent", (event: any) => {
        console.log("MessageSent event caught:", event);
        handleIncomingEvent(event);
      });

    } catch (e) {
      console.error("WebSocket setup failed", e);
      setWsStatus("disconnected");
    }
  };

  const handleIncomingEvent = (event: any) => {
    const { interaction, customer } = event;
    if (!interaction) return;

    // 1. Update active chat messages timeline in real-time
    if (selectedConv && selectedConv.customer_id === interaction.customer_id) {
      setMessages((prev) => {
        if (prev.some((msg) => msg.id === interaction.id || msg.fb_item_id === interaction.fb_item_id)) {
          return prev;
        }
        return [...prev, interaction];
      });
    }

    // 2. Update conversations list sidebar in real-time
    setConversations((prev) => {
      const exists = prev.some((c) => c.customer_id === interaction.customer_id);
      
      if (exists) {
        return prev.map((c) => {
          if (c.customer_id === interaction.customer_id) {
            const isCurrentlySelected = selectedConv?.customer_id === interaction.customer_id;
            return {
              ...c,
              last_interaction: {
                type: interaction.type,
                content: interaction.content,
                created_at: interaction.created_at,
                is_from_customer: interaction.is_from_customer
              },
              unread: isCurrentlySelected ? false : (interaction.is_from_customer ? true : c.unread)
            };
          }
          return c;
        }).sort((a, b) => {
          const aTime = a.last_interaction ? new Date(a.last_interaction.created_at).getTime() : 0;
          const bTime = b.last_interaction ? new Date(b.last_interaction.created_at).getTime() : 0;
          return bTime - aTime;
        });
      } else {
        const newConv: Conversation = {
          customer_id: customer.id,
          customer_name: customer.name || "Facebook User",
          customer_avatar: customer.avatar_url,
          ai_active: customer.ai_active ?? true,
          fanpage_id: interaction.fanpage_id,
          fanpage_name: activeFanpage?.name || "Facebook Page",
          last_interaction: {
            type: interaction.type,
            content: interaction.content,
            created_at: interaction.created_at,
            is_from_customer: interaction.is_from_customer
          },
          unread: selectedConv?.customer_id === customer.id ? false : interaction.is_from_customer
        };
        return [newConv, ...prev];
      }
    });
  };

  // Select conversation safely, clearing its unread status
  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConv(conv);
    setMobileView("chat");
    
    // Clear unread indicator
    setConversations(prev => 
      prev.map(c => c.customer_id === conv.customer_id ? { ...c, unread: false } : c)
    );
  };

  // Send Response API
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConv || sendingMessage) return;

    const messageText = inputText;
    setInputText("");
    setSendingMessage(true);

    // Mock Mode fallback
    if (token && token.startsWith("mock_")) {
      const newMsg: Interaction = {
        id: Date.now(),
        customer_id: selectedConv.customer_id,
        fanpage_id: activeFanpage?.id || 1,
        type: "message",
        fb_item_id: `mock.outbound.${Date.now()}`,
        fb_post_id: null,
        content: messageText,
        is_from_customer: false,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, newMsg]);
      
      setConversations((prev) => 
        prev.map((c) => {
          if (c.customer_id === selectedConv.customer_id) {
            return {
              ...c,
              last_interaction: {
                type: "message",
                content: messageText,
                created_at: new Date().toISOString(),
                is_from_customer: false
              }
            };
          }
          return c;
        })
      );

      setSendingMessage(false);
      
      // Simulate AI Autoreply after 2s if AI is active
      if (selectedConv.ai_active) {
        setTimeout(() => {
          const aiMsg: Interaction = {
            id: Date.now() + 1,
            customer_id: selectedConv.customer_id,
            fanpage_id: activeFanpage?.id || 1,
            type: "message",
            fb_item_id: `mock.ai.${Date.now()}`,
            fb_post_id: null,
            content: "🤖 [AI AutoReply]: Chào bạn! Cảm ơn bạn đã nhắn tin. Chúng tôi sẽ phản hồi sớm nhất.",
            is_from_customer: false,
            created_at: new Date().toISOString()
          };
          setMessages((prev) => [...prev, aiMsg]);
        }, 2000);
      }
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/conversations/${selectedConv.customer_id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ content: messageText })
      });

      if (response.ok) {
        const data = await response.json();
        const interaction: Interaction = data.interaction;
        setMessages((prev) => {
          if (prev.some((msg) => msg.id === interaction.id || msg.fb_item_id === interaction.fb_item_id)) {
            return prev;
          }
          return [...prev, interaction];
        });
        
        setConversations((prev) => 
          prev.map((c) => {
            if (c.customer_id === selectedConv.customer_id) {
              return {
                ...c,
                last_interaction: {
                  type: interaction.type,
                  content: interaction.content,
                  created_at: interaction.created_at,
                  is_from_customer: false
                }
              };
            }
            return c;
          })
        );
      } else {
        alert("Failed to send message.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error sending message.");
    } finally {
      setSendingMessage(false);
    }
  };

  // Toggle customer AI status
  const handleToggleAi = async () => {
    if (!selectedConv || togglingAi) return;

    setTogglingAi(true);

    // Mock Mode fallback
    if (token && token.startsWith("mock_")) {
      setTimeout(() => {
        const updated = { ...selectedConv, ai_active: !selectedConv.ai_active };
        setSelectedConv(updated);
        setConversations((prev) => 
          prev.map((c) => c.customer_id === selectedConv.customer_id ? updated : c)
        );
        setTogglingAi(false);
      }, 300);
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/customers/${selectedConv.customer_id}/toggle-ai`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const updated = { ...selectedConv, ai_active: data.ai_active };
        setSelectedConv(updated);
        setConversations((prev) => 
          prev.map((c) => c.customer_id === selectedConv.customer_id ? updated : c)
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingAi(false);
    }
  };

  // Simulation Helper for Local Webhook Testing
  const handleSimulateWebhookMessage = async () => {
    if (isSimulating || !activeFanpage || !simMessage.trim()) return;
    setIsSimulating(true);
    setSimSuccess(false);

    if (token && token.startsWith("mock_")) {
      const mockInteraction: Interaction = {
        id: Date.now(),
        customer_id: 101,
        fanpage_id: activeFanpage.id,
        type: "message",
        fb_item_id: `mid.sim.${Date.now()}`,
        fb_post_id: null,
        content: simMessage,
        is_from_customer: true,
        created_at: new Date().toISOString()
      };
      // Instead of receiving jSON from Facebook Graph API, we create a mock data
      const mockCustomer = { id: 101, name: "Jane Dove (Mock)", avatar_url: null, ai_active: true };
      
      handleIncomingEvent({ interaction: mockInteraction, customer: mockCustomer });
      setSimSuccess(true);
      setSimMessage("");
      setTimeout(() => setSimSuccess(false), 3000);
      setIsSimulating(false);
      return;
    }

    try {
      const webhookPayload = {
        object: "page",
        entry: [
          {
            id: activeFanpage.fb_page_id,
            time: Date.now(),
            messaging: [
              {
                sender: { id: "27359560893712066" },
                recipient: { id: activeFanpage.fb_page_id },
                timestamp: Date.now(),
                message: {
                  mid: `mid.simulated.${Date.now()}`,
                  text: simMessage
                }
              }
            ]
          }
        ]
      };

      const response = await fetch(`${apiBaseUrl}/api/webhook/facebook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookPayload)
      });

      if (response.ok) {
        setSimSuccess(true);
        setSimMessage("");
        setTimeout(() => setSimSuccess(false), 3000);
      } else {
        alert(`Webhook simulation failed (Status ${response.status})`);
      }
    } catch (err) {
      console.error(err);
      alert("Connection error simulating webhook.");
    } finally {
      setIsSimulating(false);
    }
  };

  const filteredConversations = conversations.filter((c) => 
    c.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.last_interaction?.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen animated-gradient text-[#f4f4f5] flex relative overflow-hidden font-sans">
      
      {/* Dynamic Background Glowing Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none animate-pulse-glow-delayed" />

      <Sidebar
        currentPath="/chat"
        user={user}
        lang={lang}
        toggleLanguage={toggleLanguage}
        theme={theme}
        toggleTheme={toggleTheme}
        handleLogout={handleLogout}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-hidden relative z-10">
        
        {/* Mobile Header */}
        <header className="w-full bg-[#18181b]/50 border-b border-zinc-800 px-6 py-4 flex items-center justify-between lg:hidden z-20">
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

        {/* Header */}
        <header className="glass-panel w-full border-b border-white/5 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                Live Chat Hub
              </h1>
              <p className="text-xs text-[#a1a1aa] mt-0.5">Quản lý tin nhắn đa kênh thời gian thực</p>
            </div>
          </div>

        {/* WebSocket connection status indicator */}
        <div className="flex items-center gap-4">
          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-9 h-9 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl transition-all border border-white/5 cursor-pointer active:scale-95 shadow-sm"
            title="Toggle Light/Dark theme"
          >
            {theme === "dark" ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-indigo-400" />}
          </button>

          {activeFanpage && (
            <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 text-sm">
              <span className="font-medium text-[#f4f4f5]">{activeFanpage.name}</span>
              <span className="text-xs text-[#a1a1aa] hidden sm:inline">({activeFanpage.fb_page_id})</span>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-xs shadow-inner">
            <span className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px] transition-all duration-350 ${
              wsStatus === "connected" ? "bg-green-500 shadow-green-500/50" :
              wsStatus === "connecting" ? "bg-yellow-500 animate-pulse shadow-yellow-500/50" :
              "bg-red-500 shadow-red-500/50"
            }`} />
            <span className="font-semibold text-zinc-350">
              {wsStatus === "connected" ? "Đã kết nối" :
               wsStatus === "connecting" ? "Đang kết nối..." :
               "Mất kết nối"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Grid View */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 z-10 overflow-hidden">
        
        {/* Column 1: Sidebar (Conversations List) */}
        <section className={`glass-panel rounded-3xl overflow-hidden flex flex-col h-[calc(100vh-140px)] border border-white/5 transition-all duration-300 md:col-span-4 lg:col-span-4 ${
          mobileView === "chat" ? "hidden md:flex" : "flex"
        }`}>
          <div className="p-4 border-b border-white/5 flex flex-col gap-3">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a1a1aa]" />
              <input 
                type="text" 
                placeholder="Tìm khách hàng hoặc nội dung..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/5 focus:border-blue-500/40 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/20 text-[#f4f4f5] placeholder-[#a1a1aa] transition-all"
              />
            </div>

            {/* Fanpage Selector if user manages multiple pages */}
            {fanpages.length > 1 && (
              <select 
                value={activeFanpage?.id || ""} 
                onChange={(e) => {
                  const p = fanpages.find(page => page.id === parseInt(e.target.value));
                  if (p) {
                    setActiveFanpage(p);
                    setSelectedConv(null);
                  }
                }}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-sm text-[#f4f4f5] focus:outline-none cursor-pointer"
              >
                {fanpages.map((p) => (
                  <option key={p.id} value={p.id} className="bg-zinc-950">{p.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
            {!activeFanpage ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-5 gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-zinc-300">Không tìm thấy Fanpage hoạt động</span>
                  <p className="text-[10px] text-zinc-500 leading-normal mt-1">
                    Hãy đảm bảo:
                  </p>
                  <ul className="text-[10px] text-zinc-500 text-left list-disc pl-4 mt-1 space-y-1">
                    <li>Địa chỉ Backend API là HTTPS (ở Trang chủ).</li>
                    <li>Đăng nhập thành công và có ít nhất 1 Fanpage kết nối.</li>
                  </ul>
                </div>
              </div>
            ) : loadingConvs ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#a1a1aa] gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="text-sm">Đang tải cuộc hội thoại...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#a1a1aa] px-4 text-center">
                <MessageSquare className="w-10 h-10 text-white/10 mb-3" />
                <span className="text-sm">Không tìm thấy cuộc hội thoại nào</span>
                <span className="text-[10px] text-zinc-500 mt-2 block">Hãy gửi tin nhắn giả lập bên phải để bắt đầu cuộc hội thoại.</span>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = selectedConv?.customer_id === c.customer_id;
                const lastMsg = c.last_interaction;
                const hasUnread = c.unread;

                return (
                  <div 
                    key={c.customer_id}
                    onClick={() => handleSelectConversation(c)}
                    className={`p-4 flex items-center gap-3 cursor-pointer transition-all border-l-4 ${
                      isSelected 
                        ? "bg-white/5 border-blue-600 text-white" 
                        : "hover:bg-white/[0.02] border-transparent text-zinc-300"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative">
                      {c.customer_avatar ? (
                        <img 
                          src={c.customer_avatar} 
                          alt={c.customer_name} 
                          className="w-11 h-11 rounded-full object-cover border border-white/10"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400 font-bold text-sm">
                          {c.customer_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      
                      {/* Pulsing notification badge if unread */}
                      {hasUnread && (
                        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-orange-500 rounded-full border-2 border-[#09090b] shadow-[0_0_8px_#f97316] animate-pulse" />
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-semibold truncate text-sm ${hasUnread ? "text-white font-bold" : "text-[#e4e4e7]"}`}>
                          {c.customer_name}
                        </span>
                        {lastMsg && (
                          <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                            {new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs truncate ${hasUnread ? "text-orange-400 font-medium" : "text-zinc-400"}`}>
                        {lastMsg ? lastMsg.content : "Chưa có cuộc hội thoại nào"}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Column 2: Chat Area */}
        <section className={`glass-panel rounded-3xl overflow-hidden flex flex-col h-[calc(100vh-140px)] border border-white/5 transition-all duration-300 md:col-span-8 lg:col-span-5 ${
          mobileView === "list" ? "hidden md:flex" : "flex"
        }`}>
          {selectedConv ? (
            <>
              {/* Active Header */}
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-3">
                  {/* Back button for mobile view */}
                  <button 
                    onClick={() => setMobileView("list")}
                    className="md:hidden p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <ArrowLeft className="w-4.5 h-4.5" />
                  </button>

                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400 font-bold text-sm">
                    {selectedConv.customer_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-200">{selectedConv.customer_name}</h2>
                    <span className="text-[10px] text-zinc-550 flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedConv.ai_active ? "bg-green-400 animate-pulse" : "bg-zinc-650"}`} />
                      {selectedConv.ai_active ? "Tự động phản hồi AI hoạt động" : "Tự động phản hồi AI đã tắt"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message Timeline */}
              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {loadingMessages ? (
                  <MessageSkeleton />
                ) : (
                  <>
                    {messages.map((msg) => (
                      <MessageBubble key={msg.id} msg={msg} />
                    ))}
                  </>
                )}
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-zinc-950/40">
                <div className="flex items-end gap-2 bg-zinc-950/80 border border-zinc-850 rounded-2xl p-2 focus-within:border-blue-500/40 transition-all">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    placeholder="Gõ phản hồi của bạn... (Enter để gửi, Shift+Enter xuống dòng)"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (inputText.trim() && !sendingMessage) {
                          handleSendMessage(e);
                        }
                      }
                    }}
                    disabled={sendingMessage}
                    className="flex-1 bg-transparent text-sm text-[#f4f4f5] placeholder-zinc-500 outline-none resize-none p-2 max-h-32 custom-scrollbar"
                  />
                  <button 
                    type="submit"
                    disabled={!inputText.trim() || sendingMessage}
                    className="p-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-blue-500/10 active:scale-95"
                  >
                    {sendingMessage ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#a1a1aa]">
              <MessageSquare className="w-16 h-16 text-white/5 mb-4 animate-bounce" />
              <h2 className="text-lg font-semibold text-white mb-1">Chưa chọn cuộc hội thoại</h2>
              <p className="text-sm max-w-xs">Chọn một khách hàng từ danh sách bên trái để bắt đầu chat và quản lý tự động hóa AI.</p>
            </div>
          )}
        </section>

        {/* Column 3: Customer Details & Toolings */}
        <section className="glass-panel hidden lg:flex lg:col-span-3 rounded-3xl p-6 flex flex-col gap-6 h-[calc(100vh-140px)] border border-white/5 overflow-y-auto custom-scrollbar">
          {selectedConv ? (
            <>
              <div>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Chi tiết Khách hàng</h3>
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400 font-bold text-3xl shadow-inner">
                    {selectedConv.customer_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-zinc-200">{selectedConv.customer_name}</h4>
                    <p className="text-xs text-zinc-500 mt-1">Mã KH: {selectedConv.customer_id}</p>
                  </div>
                </div>
              </div>

              <hr className="border-white/5" />

              {/* Bot Control Panel */}
              <div className="p-5 rounded-2xl bg-zinc-950/40 border border-zinc-850 hover:border-zinc-800 transition-all flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                      <Sparkles className="w-4.5 h-4.5 text-amber-400" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold block text-zinc-200">Tự động trả lời AI</span>
                      <span className="text-[10px] text-zinc-500">Google Gemini tự phản hồi</span>
                    </div>
                  </div>
                  
                  {/* Premium Slide Switch */}
                  <button 
                    onClick={handleToggleAi}
                    disabled={togglingAi}
                    className={`w-12 h-6.5 rounded-full relative transition-all duration-350 outline-none cursor-pointer flex items-center ${
                      selectedConv.ai_active 
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20" 
                        : "bg-zinc-800 border border-zinc-700"
                    }`}
                  >
                    {togglingAi ? (
                      <Loader2 className={`w-3.5 h-3.5 animate-spin text-white absolute ${
                        selectedConv.ai_active ? "right-1.5" : "left-1.5"
                      }`} />
                    ) : (
                      <span className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transition-all duration-350 absolute ${
                        selectedConv.ai_active ? "left-6.5" : "left-1"
                      }`} />
                    )}
                  </button>
                </div>
              </div>

              <hr className="border-white/5" />

              <div>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Nguồn Fanpage</h3>
                <div className="p-4 rounded-2xl bg-zinc-950/40 border border-zinc-850 text-xs space-y-2">
                  <div className="flex justify-between gap-2">
                    <span className="text-zinc-500">Tên trang:</span>
                    <span className="font-semibold text-zinc-300 truncate max-w-[70%]">{selectedConv.fanpage_name}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-zinc-500">ID trang:</span>
                    <span className="font-mono text-zinc-300 truncate max-w-[70%]">{selectedConv.fanpage_id}</span>
                  </div>
                </div>
              </div>

              <hr className="border-white/5" />
            </>
          ) : (
            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-xs text-[#a1a1aa] text-center">
              <MessageSquare className="w-8 h-8 text-blue-500/30 mx-auto mb-2" />
              Chọn một khách hàng bên trái để xem chi tiết
            </div>
          )}

          {/* Webhook Simulator */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Mô phỏng Webhook</h3>
            <div className="p-4 rounded-2xl bg-zinc-950/40 border border-zinc-850 flex flex-col gap-3">
              <div className="flex items-start gap-2 text-[11px] text-[#a1a1aa]">
                <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p>Giả lập khách hàng nhắn tin vào trang để test real-time.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-zinc-500 font-medium">Nội dung tin nhắn:</label>
                <textarea 
                  value={simMessage}
                  onChange={(e) => setSimMessage(e.target.value)}
                  rows={3}
                  className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-[#f4f4f5] focus:outline-none focus:border-blue-500 resize-none outline-none"
                />
              </div>

              <button
                onClick={handleSimulateWebhookMessage}
                disabled={isSimulating || !activeFanpage || !simMessage.trim()}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors text-white text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSimulating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Đang giả lập...
                  </>
                ) : (
                  <>
                    <Activity className="w-3.5 h-3.5" />
                    Gửi tin nhắn giả lập
                  </>
                )}
              </button>

              {!activeFanpage && (
                <p className="text-[10px] text-yellow-500/90 text-center leading-relaxed mt-2 bg-yellow-500/5 border border-yellow-500/10 p-2 rounded-xl">
                  ⚠️ Hãy cấu hình **Địa chỉ Backend API** thành HTTPS (Ví dụ: `https://c74a7c0939d2ee.lhr.life`) ở Trang chủ để tải được Fanpage trước khi gửi giả lập.
                </p>
              )}

              {simSuccess && (
                <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] text-center font-medium">
                  ✅ Gửi thành công! Tin nhắn vừa xuất hiện trong chat.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer Branding */}
      <footer className="w-full py-4 text-center text-xs text-zinc-650 border-t border-zinc-850 z-10 bg-[#09090b]/80 backdrop-blur-md">
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
