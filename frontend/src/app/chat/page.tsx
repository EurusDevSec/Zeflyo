"use client";

import React, { useState, useEffect, useRef } from "react";
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
  AlertCircle
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
}

interface Fanpage {
  id: number;
  user_id: number;
  fb_page_id: string;
  name: string;
  avatar_url: string | null;
  is_active: boolean;
}

export default function ChatHub() {
  const [token, setToken] = useState<string | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>("http://localhost");
  const [activeFanpage, setActiveFanpage] = useState<Fanpage | null>(null);
  const [fanpages, setFanpages] = useState<Fanpage[]>([]);
  
  // Chat state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Interaction[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [inputText, setInputText] = useState<string>("");
  
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const echoRef = useRef<any>(null);
  const activeChannelRef = useRef<any>(null);

  // 1. Initial configuration load
  useEffect(() => {
    const savedToken = localStorage.getItem("zeflyo_token");
    const savedApiBase = localStorage.getItem("zeflyo_api_base");
    const savedPages = localStorage.getItem("zeflyo_mock_pages");

    if (savedToken) setToken(savedToken);
    if (savedApiBase) setApiBaseUrl(savedApiBase);

    // Try to load connected pages to select active one
    if (savedPages) {
      try {
        const pages: Fanpage[] = JSON.parse(savedPages);
        setFanpages(pages);
        if (pages.length > 0) {
          setActiveFanpage(pages[0]);
        }
      } catch (e) {
        console.error("Failed to parse pages", e);
      }
    }
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

  // 5. Auto-scroll to bottom of chat
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 6. Polling fallback: every 5s refresh conversations & active messages (for real mode)
  useEffect(() => {
    if (!token || token.startsWith("mock_") || !activeFanpage) return;

    const pollInterval = setInterval(async () => {
      // Silently refresh conversations list
      try {
        const res = await fetch(`${apiBaseUrl}/api/conversations?fanpage_id=${activeFanpage.id}`, {
          headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data: Conversation[] = await res.json();
          setConversations(prev => {
            // Merge: keep existing ones, add new ones, update last_interaction
            const merged = [...prev];
            data.forEach(incoming => {
              const idx = merged.findIndex(c => c.customer_id === incoming.customer_id);
              if (idx >= 0) {
                merged[idx] = { ...merged[idx], last_interaction: incoming.last_interaction };
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
          // Auto-select first if nothing selected
          if (data.length > 0) {
            setSelectedConv(prev => prev ?? data[0]);
          }
        }
      } catch (_) { /* silent fail */ }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [token, activeFanpage, apiBaseUrl]);

  // 7. Polling for active conversation messages
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
            const existingIds = new Set(prev.map(m => m.fb_item_id));
            const newMsgs = incoming.filter(m => !existingIds.has(m.fb_item_id));
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
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
          // Select page 1028776643660761 (Zeflyo Shop) if present, otherwise default to first
          const targetPage = pages.find((p: Fanpage) => p.fb_page_id === "1028776643660761") || pages[0];
          setActiveFanpage(targetPage);
        }
      }
    } catch (err) {
      console.error("Failed to fetch real fanpages", err);
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
            }
          }
        ];
        setConversations(mockConvs);
        setSelectedConv(mockConvs[0]); // Auto-select first conversation
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
        setConversations(data);
        if (data.length > 0 && !selectedConv) {
          setSelectedConv(data[0]); // Auto-select first conversation
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
        // Laravel paginate response returns items inside 'data' key
        setMessages(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching messages", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // 6. WebSocket / Echo Client Init
  const initWebSocket = (pageId: number) => {
    if (!token || token.startsWith("mock_")) {
      setWsStatus("connected"); // Simulate connection in mock mode
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

      // Listen to incoming messages
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
        // Prevent duplicate messages if already rendered
        if (prev.some((msg) => msg.fb_item_id === interaction.fb_item_id)) {
          return prev;
        }
        return [...prev, interaction];
      });
    }

    // 2. Update conversations list sidebar in real-time
    setConversations((prev) => {
      const exists = prev.some((c) => c.customer_id === interaction.customer_id);
      
      if (exists) {
        // Update existing item and bubble to top
        return prev.map((c) => {
          if (c.customer_id === interaction.customer_id) {
            return {
              ...c,
              last_interaction: {
                type: interaction.type,
                content: interaction.content,
                created_at: interaction.created_at,
                is_from_customer: interaction.is_from_customer
              }
            };
          }
          return c;
        }).sort((a, b) => {
          const aTime = a.last_interaction ? new Date(a.last_interaction.created_at).getTime() : 0;
          const bTime = b.last_interaction ? new Date(b.last_interaction.created_at).getTime() : 0;
          return bTime - aTime;
        });
      } else {
        // Insert new conversation from new customer
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
          }
        };
        return [newConv, ...prev];
      }
    });
  };

  // 7. Send Response API
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConv || sendingMessage) return;

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
        content: inputText,
        is_from_customer: false,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, newMsg]);
      
      // Update sidebar
      setConversations((prev) => 
        prev.map((c) => {
          if (c.customer_id === selectedConv.customer_id) {
            return {
              ...c,
              last_interaction: {
                type: "message",
                content: inputText,
                created_at: new Date().toISOString(),
                is_from_customer: false
              }
            };
          }
          return c;
        })
      );

      setInputText("");
      setSendingMessage(false);
      
      // Simulate AI Autoreply after 3s if AI is active
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
        body: JSON.stringify({ content: inputText })
      });

      if (response.ok) {
        const data = await response.json();
        const interaction: Interaction = data.interaction;
        
        // Append locally
        setMessages((prev) => [...prev, interaction]);
        
        // Update list
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
        
        setInputText("");
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

  // 8. Toggle customer AI status
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

  // 9. Simulation Helper for Local Webhook Testing
  const handleSimulateWebhookMessage = async () => {
    if (isSimulating || !activeFanpage || !simMessage.trim()) return;
    setIsSimulating(true);
    setSimSuccess(false);

    // ── MOCK MODE: simulate 100% locally, no backend needed ──────────────
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
      const mockCustomer = { id: 101, name: "Jane Dove (Mock)", avatar_url: null, ai_active: true };
      handleIncomingEvent({ interaction: mockInteraction, customer: mockCustomer });
      setSimSuccess(true);
      setSimMessage("");
      setTimeout(() => setSimSuccess(false), 3000);
      setIsSimulating(false);
      return;
    }

    // ── REAL MODE: POST actual webhook payload to backend ─────────────────
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
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col relative overflow-hidden font-sans">
      
      {/* Dynamic Background Glowing Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse-glow" />

      {/* Header */}
      <header className="glass-panel w-full border-b border-white/5 px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <a 
            href="/"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
          >
            <ArrowLeft className="w-5 h-5" />
          </a>
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
          {activeFanpage && (
            <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 text-sm">
              <span className="font-medium text-[#f4f4f5]">{activeFanpage.name}</span>
              <span className="text-xs text-[#a1a1aa]">({activeFanpage.fb_page_id})</span>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${
              wsStatus === "connected" ? "bg-green-500 shadow-[0_0_8px_#22c55e]" :
              wsStatus === "connecting" ? "bg-yellow-500 animate-pulse" :
              "bg-red-500"
            }`} />
            <span className="font-medium">
              {wsStatus === "connected" ? "Connected" :
               wsStatus === "connecting" ? "Connecting..." :
               "Disconnected"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Grid View */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 z-10 overflow-hidden">
        
        {/* Column 1: Sidebar (Conversations List) */}
        <section className="glass-panel md:col-span-4 rounded-3xl overflow-hidden flex flex-col h-[calc(100vh-140px)] border border-white/5">
          <div className="p-4 border-b border-white/5 flex flex-col gap-3">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a1a1aa]" />
              <input 
                type="text" 
                placeholder="Tìm khách hàng hoặc nội dung..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 text-[#f4f4f5] placeholder-[#a1a1aa] transition-all"
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
                className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-sm text-[#f4f4f5] focus:outline-none"
              >
                {fanpages.map((p) => (
                  <option key={p.id} value={p.id} className="bg-zinc-950">{p.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {loadingConvs ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#a1a1aa] gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="text-sm">Đang tải cuộc hội thoại...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#a1a1aa] px-4 text-center">
                <MessageSquare className="w-10 h-10 text-white/10 mb-3" />
                <span className="text-sm">Không tìm thấy cuộc hội thoại nào</span>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = selectedConv?.customer_id === c.customer_id;
                const lastMsg = c.last_interaction;
                const unread = lastMsg && lastMsg.is_from_customer;

                return (
                  <div 
                    key={c.customer_id}
                    onClick={() => setSelectedConv(c)}
                    className={`p-4 flex items-center gap-3 cursor-pointer transition-all ${
                      isSelected 
                        ? "bg-white/5 border-l-4 border-blue-500" 
                        : "hover:bg-white/[0.02] border-l-4 border-transparent"
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
                      
                      {/* Pulse notification badge if unread */}
                      {unread && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-orange-500 rounded-full border-2 border-[#09090b] animate-pulse" />
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-semibold truncate text-sm ${unread ? "text-white" : "text-[#e4e4e7]"}`}>
                          {c.customer_name}
                        </span>
                        {lastMsg && (
                          <span className="text-[10px] text-[#a1a1aa] whitespace-nowrap">
                            {new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs truncate ${unread ? "text-white font-medium" : "text-[#a1a1aa]"}`}>
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
        <section className="glass-panel md:col-span-5 rounded-3xl overflow-hidden flex flex-col h-[calc(100vh-140px)] border border-white/5">
          {selectedConv ? (
            <>
              {/* Active Header */}
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400 font-bold text-sm">
                    {selectedConv.customer_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">{selectedConv.customer_name}</h2>
                    <span className="text-[10px] text-[#a1a1aa] flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedConv.ai_active ? "bg-green-400 animate-pulse" : "bg-zinc-500"}`} />
                      {selectedConv.ai_active ? "AI auto-reply active" : "AI auto-reply offline"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message Timeline */}
              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-20 text-[#a1a1aa]">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => {
                      const isCustomer = msg.is_from_customer;
                      const isAi = msg.content.startsWith("🤖");
                      
                      return (
                        <div 
                          key={msg.id}
                          className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}
                        >
                          <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            isCustomer 
                              ? "bg-white/5 border border-white/5 text-[#f4f4f5]" 
                              : isAi
                                ? "bg-amber-500/10 border border-amber-500/20 text-amber-200"
                                : "bg-blue-600 text-white shadow-lg shadow-blue-500/10"
                          }`}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            <span className={`block text-[10px] mt-1 text-right ${
                              isCustomer ? "text-[#a1a1aa]" : "text-white/70"
                            }`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-white/[0.01]">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Gõ phản hồi của bạn..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={sendingMessage}
                    className="flex-1 bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 text-[#f4f4f5] placeholder-[#a1a1aa] transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={!inputText.trim() || sendingMessage}
                    className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 text-white flex items-center justify-center"
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
        <section className="glass-panel md:col-span-3 rounded-3xl p-6 flex flex-col gap-6 h-[calc(100vh-140px)] border border-white/5 overflow-y-auto">
          {selectedConv ? (
            <>
              <div>
                <h3 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider mb-4">Chi tiết Khách hàng</h3>
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400 font-bold text-3xl">
                    {selectedConv.customer_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{selectedConv.customer_name}</h4>
                    <p className="text-xs text-[#a1a1aa] mt-1">ID: {selectedConv.customer_id}</p>
                  </div>
                </div>
              </div>

              <hr className="border-white/5" />

              {/* Bot Control Panel */}
              <div>
                <h3 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider mb-3">Tự động hóa AI</h3>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <div>
                      <span className="text-sm font-medium block">Tự động trả lời</span>
                      <span className="text-[10px] text-[#a1a1aa]">AI sẽ tự động chat với khách</span>
                    </div>
                  </div>
                  
                  {/* Custom Toggle Switch */}
                  <button 
                    onClick={handleToggleAi}
                    disabled={togglingAi}
                    className={`w-11 h-6 rounded-full relative transition-all ${
                      selectedConv.ai_active ? "bg-blue-600" : "bg-zinc-700"
                    }`}
                  >
                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                      selectedConv.ai_active ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>
              </div>

              <hr className="border-white/5" />

              <div>
                <h3 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider mb-3">Nguồn Fanpage</h3>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#a1a1aa]">Tên trang:</span>
                    <span className="font-medium text-white">{selectedConv.fanpage_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a1a1aa]">ID trang:</span>
                    <span className="font-medium text-white">{selectedConv.fanpage_id}</span>
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

          {/* ── Webhook Simulator ── always visible ─────────────── */}
          <div>
            <h3 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider mb-3">Mô phỏng Webhook</h3>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-3">
              <div className="flex items-start gap-2 text-[11px] text-[#a1a1aa]">
                <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p>Giả lập khách hàng nhắn tin vào trang để test real-time.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-[#a1a1aa] font-medium">Nội dung tin nhắn:</label>
                <textarea 
                  value={simMessage}
                  onChange={(e) => setSimMessage(e.target.value)}
                  rows={3}
                  className="w-full bg-[#09090b] border border-white/5 rounded-xl px-3 py-2 text-xs text-[#f4f4f5] focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <button
                onClick={handleSimulateWebhookMessage}
                disabled={isSimulating || !activeFanpage || !simMessage.trim()}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors text-white text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
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

              {simSuccess && (
                <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] text-center font-medium">
                  ✅ Gửi thành công! Tin nhắn vừa xuất hiện trong chat.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

    </div>
  );
}
