"use client";

import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Sparkles, Plus, Trash2, Loader2, Check, AlertTriangle,
  ChevronDown, ChevronRight, Power, RefreshCw, Clock,
  Globe, Image as ImageIcon, MessageSquare, Search,
  Edit3, Eye, Send, Package, List, Settings, Wand2,
  X, GripVertical, ToggleLeft, ToggleRight, FileText
} from "lucide-react";

// ───────── Type Definitions ─────────
interface Fanpage {
  id: number;
  fb_page_id: string;
  name: string;
  avatar_url: string | null;
  is_active: boolean;
}

interface TopicItem {
  id: number;
  title: string;
  status: "pending" | "generated" | "published" | "failed";
  generated_content: string | null;
  generated_image_url: string | null;
  fb_post_id: string | null;
  error_log: string | null;
  sort_order: number;
}

interface AutoSetupItem {
  id: number;
  name: string;
  source_type: "topic" | "product";
  fanpage_ids: number[];
  language: string;
  post_length: string;
  writing_style: string;
  schedule_mode: string;
  schedule_times: string[];
  publish_mode: "instant" | "review";
  auto_post: boolean;
  auto_repeat: boolean;
  auto_comment: string | null;
  status: "active" | "paused" | "completed";
  topics_count: number;
  topics?: TopicItem[];
  created_at: string;
  updated_at: string;
}

interface ProductItem {
  id: number;
  name: string;
  description: string | null;
  image_urls: string[] | null;
  comment: string | null;
  auto_post_enabled: boolean;
  sort_order: number;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
}

// ───────── Constants ─────────
const POST_LENGTHS = [
  { value: "super_short", label: "Siêu ngắn", labelEn: "Super short" },
  { value: "short", label: "Ngắn", labelEn: "Short" },
  { value: "medium", label: "Trung bình", labelEn: "Medium" },
  { value: "full", label: "Đầy đủ", labelEn: "Full" },
  { value: "detailed", label: "Chi tiết", labelEn: "Detailed" },
];

const WRITING_STYLES = [
  { value: "professional", label: "Chuyên nghiệp", labelEn: "Professional" },
  { value: "humorous", label: "Hài hước", labelEn: "Humorous" },
  { value: "creative", label: "Sáng tạo", labelEn: "Creative" },
  { value: "emotional", label: "Cảm xúc", labelEn: "Emotional" },
  { value: "storytelling", label: "Kể chuyện", labelEn: "Storytelling" },
  { value: "advertising", label: "Quảng cáo", labelEn: "Advertising" },
  { value: "inspirational", label: "Truyền cảm hứng", labelEn: "Inspirational" },
];

const WEEKDAYS = [
  { value: 1, label: "T2", labelEn: "Mon" },
  { value: 2, label: "T3", labelEn: "Tue" },
  { value: 3, label: "T4", labelEn: "Wed" },
  { value: 4, label: "T5", labelEn: "Thu" },
  { value: 5, label: "T6", labelEn: "Fri" },
  { value: 6, label: "T7", labelEn: "Sat" },
  { value: 7, label: "CN", labelEn: "Sun" },
];

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
export default function AutoPostPage() {
  // ── Global state ──
  const [token, setToken] = useState<string | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>("http://localhost");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [lang, setLang] = useState<"en" | "vi">("vi");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeTab, setActiveTab] = useState<"topic_setup" | "manage" | "product_setup" | "product_list">("topic_setup");
  const [fanpages, setFanpages] = useState<Fanpage[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Tab 1: Topic Setup state ──
  const [topicPrompt, setTopicPrompt] = useState("");
  const [topicCount, setTopicCount] = useState(30);
  const [generatedTopics, setGeneratedTopics] = useState<string[]>([]);
  const [newTopicInput, setNewTopicInput] = useState("");
  const [setupName, setSetupName] = useState("");
  const [language, setLanguage] = useState("vi");
  const [postLength, setPostLength] = useState("medium");
  const [writingStyle, setWritingStyle] = useState("professional");
  const [customPrompt, setCustomPrompt] = useState("");
  const [useFanpageInfo, setUseFanpageInfo] = useState(false);
  const [includeContact, setIncludeContact] = useState(false);
  const [contactInfo, setContactInfo] = useState("");
  const [scheduleMode, setScheduleMode] = useState<"weekly" | "fixed">("weekly");
  const [scheduleDays, setScheduleDays] = useState<number[]>([1, 3, 5]);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTimes, setScheduleTimes] = useState<string[]>(["08:00"]);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [autoPost, setAutoPost] = useState(true);
  const [autoRepeat, setAutoRepeat] = useState(false);
  const [publishMode, setPublishMode] = useState<"instant" | "review">("review");
  const [autoComment, setAutoComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [setupMsg, setSetupMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [tempSetupId, setTempSetupId] = useState<number | null>(null);

  // ── Tab 2: Manage state ──
  const [setups, setSetups] = useState<AutoSetupItem[]>([]);
  const [setupSearch, setSetupSearch] = useState("");
  const [setupFilter, setSetupFilter] = useState<"all" | "active" | "paused" | "completed">("all");
  const [expandedSetup, setExpandedSetup] = useState<number | null>(null);
  const [setupTopics, setSetupTopics] = useState<TopicItem[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [approvingTopic, setApprovingTopic] = useState<number | null>(null);

  // ── Topic Edit & Review Modal state ──
  const [reviewTopic, setReviewTopic] = useState<TopicItem | null>(null);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewImageUrl, setReviewImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);



  // ── Tab 3/4: Product state ──
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [productImageUrl, setProductImageUrl] = useState("");
  const [productImageList, setProductImageList] = useState<string[]>([]);
  const [productComment, setProductComment] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [bulkJson, setBulkJson] = useState("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // ── Init ──
  useEffect(() => {
    const savedToken = localStorage.getItem("zeflyo_token");
    const savedBaseUrl = localStorage.getItem("api_base_url");
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    const savedLang = localStorage.getItem("lang") as "en" | "vi" | null;

    if (savedToken) setToken(savedToken);
    if (savedBaseUrl) setApiBaseUrl(savedBaseUrl);
    if (savedTheme) setTheme(savedTheme);
    if (savedLang) setLang(savedLang);

    const today = new Date();
    setScheduleDate(today.toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    if (!token) { setLoading(false); return; }

    const fetchData = async () => {
      try {
        const [userRes, fpRes] = await Promise.all([
          fetch(`${apiBaseUrl}/api/user`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }),
          fetch(`${apiBaseUrl}/api/fanpages`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }),
        ]);
        if (userRes.ok) setUser(await userRes.json());
        if (fpRes.ok) { const d = await fpRes.json(); setFanpages(d.fanpages || d); }
      } catch (e) {
        console.error("Init fetch error:", e);
      }
      setLoading(false);
    };
    fetchData();
  }, [token, apiBaseUrl]);

  // Fetch setups when manage tab is active
  const fetchSetups = useCallback(async () => {
    if (!token) return;
    try {
      const params = new URLSearchParams();
      if (setupFilter !== "all") params.set("status", setupFilter);
      if (setupSearch) params.set("search", setupSearch);
      const res = await fetch(`${apiBaseUrl}/api/auto-setups?${params}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (res.ok) { const d = await res.json(); setSetups(d.setups || []); }
    } catch (e) { console.error(e); }
  }, [token, apiBaseUrl, setupFilter, setupSearch]);

  useEffect(() => {
    if (activeTab === "manage") fetchSetups();
  }, [activeTab, fetchSetups]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    if (!token) return;
    try {
      const params = new URLSearchParams();
      if (productSearch) params.set("search", productSearch);
      const res = await fetch(`${apiBaseUrl}/api/products?${params}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (res.ok) { const d = await res.json(); setProducts(d.products || []); }
    } catch (e) { console.error(e); }
  }, [token, apiBaseUrl, productSearch]);

  useEffect(() => {
    if (activeTab === "product_list" || activeTab === "product_setup") fetchProducts();
  }, [activeTab, fetchProducts]);

  // ── Handlers ──
  const toggleLanguage = () => { const n = lang === "en" ? "vi" : "en"; setLang(n); localStorage.setItem("lang", n); };
  const toggleTheme = () => { const n = theme === "dark" ? "light" : "dark"; setTheme(n); localStorage.setItem("theme", n); };
  const handleLogout = () => { localStorage.removeItem("zeflyo_token"); window.location.href = "/"; };

  const handleGenerateTopics = async () => {
    if (!topicPrompt.trim() || !token || !tempSetupId) return;
    setAiGenerating(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/auto-setups/${tempSetupId}/generate-topics`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ prompt: topicPrompt, count: topicCount }),
      });
      if (res.ok) {
        const d = await res.json();
        setGeneratedTopics(d.topics?.map((t: TopicItem) => t.title) || []);
        setSetupMsg({ type: "success", text: lang === "vi" ? `Đã tạo ${d.topics?.length || 0} chủ đề thành công!` : `Generated ${d.topics?.length || 0} topics!` });
      } else {
        const err = await res.json();
        setSetupMsg({ type: "error", text: err.error || "Failed to generate topics." });
      }
    } catch (e) {
      setSetupMsg({ type: "error", text: "Network error." });
    }
    setAiGenerating(false);
  };

  const handleAddManualTopic = async () => {
    if (!newTopicInput.trim() || !token || !tempSetupId) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/auto-setups/${tempSetupId}/topics`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ title: newTopicInput.trim() }),
      });
      if (res.ok) {
        const d = await res.json();
        setGeneratedTopics(prev => [...prev, d.topic.title]);
        setNewTopicInput("");
      }
    } catch (e) { console.error(e); }
  };

  const handleCreateSetup = async (sourceType: "topic" | "product" = "topic") => {
    if (!token || !setupName.trim() || selectedPages.length === 0) {
      setSetupMsg({ type: "error", text: lang === "vi" ? "Vui lòng điền tên và chọn ít nhất 1 fanpage." : "Please fill name and select at least 1 fanpage." });
      return;
    }
    setSubmitting(true);
    setSetupMsg(null);

    try {
      const body = {
        name: setupName,
        source_type: sourceType,
        fanpage_ids: selectedPages,
        language,
        post_length: postLength,
        writing_style: writingStyle,
        custom_prompt: customPrompt || null,
        use_fanpage_info: useFanpageInfo,
        include_contact: includeContact,
        contact_info: includeContact ? contactInfo : null,
        schedule_mode: scheduleMode,
        schedule_days: scheduleMode === "weekly" ? scheduleDays : null,
        schedule_date: scheduleMode === "fixed" ? scheduleDate : null,
        schedule_times: scheduleTimes,
        auto_post: autoPost,
        auto_repeat: autoRepeat,
        publish_mode: publishMode,
        auto_comment: autoComment || null,
      };

      const res = await fetch(`${apiBaseUrl}/api/auto-setups`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const d = await res.json();
        setTempSetupId(d.setup.id);
        setSetupMsg({ type: "success", text: lang === "vi" ? "Thiết lập đã được tạo! Bây giờ bạn có thể thêm chủ đề." : "Setup created! Now add topics." });
      } else {
        const err = await res.json();
        setSetupMsg({ type: "error", text: err.error || err.message || "Failed." });
      }
    } catch (e) {
      setSetupMsg({ type: "error", text: "Network error." });
    }
    setSubmitting(false);
  };

  const handleToggleSetup = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/auto-setups/${id}/toggle`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (res.ok) fetchSetups();
    } catch (e) { console.error(e); }
  };

  const handleDeleteSetup = async (id: number) => {
    if (!token) return;
    try {
      await fetch(`${apiBaseUrl}/api/auto-setups/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      fetchSetups();
    } catch (e) { console.error(e); }
  };

  const handleExpandSetup = async (id: number) => {
    if (expandedSetup === id) { setExpandedSetup(null); return; }
    setExpandedSetup(id);
    setLoadingTopics(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/auto-setups/${id}/topics`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (res.ok) { const d = await res.json(); setSetupTopics(d.topics || []); }
    } catch (e) { console.error(e); }
    setLoadingTopics(false);
  };

  const handleApproveTopic = async (topicId: number) => {
    if (!token) return;
    setApprovingTopic(topicId);
    try {
      const res = await fetch(`${apiBaseUrl}/api/topics/${topicId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (res.ok) {
        if (expandedSetup) handleExpandSetup(expandedSetup);
      }
    } catch (e) { console.error(e); }
    setApprovingTopic(null);
  };

  const handleOpenReview = (topic: TopicItem) => {
    setReviewTopic(topic);
    setReviewContent(topic.generated_content || "");
    setReviewImageUrl(topic.generated_image_url || "");
    setReviewError(null);
  };

  const handleUploadReviewImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploadingImage(true);
    setReviewError(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(`${apiBaseUrl}/api/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      });

      if (res.ok) {
        const d = await res.json();
        setReviewImageUrl(d.url);
      } else {
        const err = await res.json();
        setReviewError(err.error || "Upload failed");
      }
    } catch (err) {
      setReviewError("Network error during upload");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveAndPublishTopic = async () => {
    if (!reviewTopic || !token) return;
    setReviewSubmitting(true);
    setReviewError(null);

    try {
      const res = await fetch(`${apiBaseUrl}/api/topics/${reviewTopic.id}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          content: reviewContent,
          image_url: reviewImageUrl || null,
        }),
      });

      if (res.ok) {
        setReviewTopic(null);
        if (expandedSetup) handleExpandSetup(expandedSetup);
      } else {
        const err = await res.json();
        setReviewError(err.error || "Failed to publish topic");
      }
    } catch (e) {
      setReviewError("Network error during publish");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleSaveDraftTopic = async () => {
    if (!reviewTopic || !token) return;
    setReviewSubmitting(true);
    setReviewError(null);

    try {
      const res = await fetch(`${apiBaseUrl}/api/topics/${reviewTopic.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          content: reviewContent,
          image_url: reviewImageUrl || null,
        }),
      });

      if (res.ok) {
        setReviewTopic(null);
        if (expandedSetup) handleExpandSetup(expandedSetup);
      } else {
        const err = await res.json();
        setReviewError(err.error || "Failed to save draft");
      }
    } catch (e) {
      setReviewError("Network error during save");
    } finally {
      setReviewSubmitting(false);
    }
  };


  const handleAddProduct = async () => {
    if (!token || !productName.trim()) return;
    setProductSubmitting(true);
    try {
      const body = {
        name: productName,
        description: productDesc || null,
        image_urls: productImageList.length > 0 ? productImageList : null,
        comment: productComment || null,
      };
      const res = await fetch(`${apiBaseUrl}/api/products`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setProductName(""); setProductDesc(""); setProductImageList([]); setProductImageUrl(""); setProductComment("");
        fetchProducts();
        setSetupMsg({ type: "success", text: lang === "vi" ? "Sản phẩm đã được thêm!" : "Product added!" });
      }
    } catch (e) { console.error(e); }
    setProductSubmitting(false);
  };

  const handleDeleteProduct = async (id: number) => {
    if (!token) return;
    try {
      await fetch(`${apiBaseUrl}/api/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      fetchProducts();
    } catch (e) { console.error(e); }
  };

  const handleSeedMockProducts = async () => {
    if (!token || bulkSubmitting) return;
    setBulkSubmitting(true);
    setSetupMsg(null);

    const demoProducts = [
      {
        name: "Khóa học Master ChatGPT & Prompt Engineering",
        description: "Khóa học giúp bạn làm chủ nghệ thuật viết prompt chuyên nghiệp, ứng dụng ChatGPT vào công việc Content Marketing, dịch thuật, lập trình và tự động hóa công việc hàng ngày.",
        image_urls: ["https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&auto=format&fit=crop&q=60"],
        comment: "💬 Liên hệ ngay để nhận voucher giảm giá 20% hôm nay!",
      },
      {
        name: "Tài khoản ChatGPT Plus (Gói 1 Tháng)",
        description: "Mở khóa toàn bộ sức mạnh của GPT-4o, DALL-E 3 tạo ảnh, Advanced Data Analysis phân tích dữ liệu, và sử dụng hàng ngàn GPTs chuyên dụng không giới hạn tốc độ.",
        image_urls: ["https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&auto=format&fit=crop&q=60"],
        comment: "⚡ Nâng cấp chính chủ - Bảo hành 1 đổi 1 suốt thời gian sử dụng.",
      },
      {
        name: "Tài khoản Midjourney Pro (Tự thiết kế ảnh AI)",
        description: "Tài khoản vẽ ảnh nghệ thuật AI đỉnh cao dành cho designer, marketer, sáng tạo nội dung. Tạo ảnh chất lượng cực nét, độc quyền sử dụng thương mại.",
        image_urls: ["https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60"],
        comment: "🎨 Thỏa sức sáng tạo không giới hạn cùng công cụ vẽ AI số 1 thế giới.",
      },
      {
        name: "Tài khoản Canva Pro (Hạn dùng 1 Năm)",
        description: "Mở khóa toàn bộ template thiết kế cao cấp, kho ảnh/video khổng lồ, tính năng xóa nền 1-click và resize thiết kế nhanh chóng. Phù hợp cho cá nhân và nhóm.",
        image_urls: ["https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&auto=format&fit=crop&q=60"],
        comment: "✨ Gia hạn chính chủ tài khoản của bạn, an toàn tuyệt đối.",
      },
      {
        name: "Khóa học Thiết kế & Video AI Automation",
        description: "Học cách sử dụng kết hợp Canva, CapCut và các công cụ AI (HeyGen, ElevenLabs) để sản xuất hàng loạt video ngắn TikTok, Reels, Shorts thu hút triệu view tự động.",
        image_urls: ["https://images.unsplash.com/photo-1616469829581-73993eb86b02?w=800&auto=format&fit=crop&q=60"],
        comment: "🎬 Tặng kèm kho tài nguyên template CapCut & Canva Premium miễn phí.",
      }
    ];

    try {
      let successCount = 0;
      for (const prod of demoProducts) {
        const res = await fetch(`${apiBaseUrl}/api/products`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            name: prod.name,
            description: prod.description,
            image_urls: prod.image_urls,
            comment: prod.comment,
            auto_post_enabled: true
          }),
        });
        if (res.ok) successCount++;
      }
      if (successCount > 0) {
        fetchProducts();
        setSetupMsg({ type: "success", text: lang === "vi" ? `Đã tạo thành công ${successCount} sản phẩm mẫu!` : `Successfully seeded ${successCount} demo products!` });
      } else {
        setSetupMsg({ type: "error", text: lang === "vi" ? "Lỗi tạo sản phẩm mẫu." : "Failed to seed products." });
      }
    } catch (e) {
      console.error(e);
      setSetupMsg({ type: "error", text: "Connection error seeding products." });
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleBulkJsonImport = async () => {
    if (!token || !bulkJson.trim() || bulkSubmitting) return;
    setBulkSubmitting(true);
    setSetupMsg(null);
    try {
      const parsed = JSON.parse(bulkJson.trim());
      const items = Array.isArray(parsed) ? parsed : [parsed];
      let successCount = 0;
      for (const item of items) {
        if (!item.name || !item.name.trim()) continue;
        const res = await fetch(`${apiBaseUrl}/api/products`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            name: item.name,
            description: item.description || null,
            image_urls: Array.isArray(item.image_urls) ? item.image_urls : (item.image_url ? [item.image_url] : []),
            comment: item.comment || null,
            auto_post_enabled: item.auto_post_enabled !== false
          }),
        });
        if (res.ok) successCount++;
      }
      fetchProducts();
      setBulkJson("");
      if (successCount > 0) {
        setSetupMsg({ type: "success", text: lang === "vi" ? `Đã nhập thành công ${successCount} sản phẩm!` : `Imported ${successCount} products!` });
      } else {
        setSetupMsg({ type: "error", text: lang === "vi" ? "Không nhập được sản phẩm nào." : "Failed to import products." });
      }
    } catch (e) {
      console.error(e);
      setSetupMsg({ type: "error", text: lang === "vi" ? "JSON không hợp lệ." : "Invalid JSON format." });
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleToggleProduct = async (product: ProductItem) => {
    if (!token) return;
    try {
      await fetch(`${apiBaseUrl}/api/products/${product.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ auto_post_enabled: !product.auto_post_enabled }),
      });
      fetchProducts();
    } catch (e) { console.error(e); }
  };

  const addImageUrl = () => {
    if (productImageUrl.trim()) {
      setProductImageList(prev => [...prev, productImageUrl.trim()]);
      setProductImageUrl("");
    }
  };

  // ── Sidebar tab mapping ──
  const sidebarTabMap: Record<string, "topic_setup" | "manage" | "product_setup" | "product_list"> = {
    setup: "topic_setup",
    list: "manage",
    automation: "product_setup",
  };

  // ═══════════ RENDER ═══════════
  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080c] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex ${theme === "dark" ? "bg-[#08080c] text-zinc-100" : "bg-gray-50 text-gray-900"}`}>
      <Sidebar
        currentPath="/autopost"
        activeTab={
          activeTab === "topic_setup" ? "setup" :
          activeTab === "manage" ? "list" :
          activeTab === "product_setup" ? "automation" : "product_list"
        }
        setActiveTab={(tab) => {
          const map: Record<string, "topic_setup" | "manage" | "product_setup" | "product_list"> = {
            setup: "topic_setup",
            list: "manage",
            automation: "product_setup",
            product_list: "product_list"
          };
          setActiveTab(map[tab] || "topic_setup");
        }}
        user={user}
        lang={lang}
        toggleLanguage={toggleLanguage}
        theme={theme}
        toggleTheme={toggleTheme}
        handleLogout={handleLogout}
      />

      <main className="flex-1 min-h-screen overflow-y-auto">
        {/* Header */}
        <header className={`sticky top-0 z-10 px-8 py-5 border-b backdrop-blur-xl ${theme === "dark" ? "border-zinc-800/40 bg-[#08080c]/80" : "border-gray-200 bg-white/80"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Wand2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  {lang === "vi" ? "Đăng Bài Tự Động với AI" : "AI Auto-Post"}
                </h1>
                <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-gray-500"}`}>
                  {lang === "vi" ? "Tự động viết và đăng bài Facebook bằng trí tuệ nhân tạo" : "Auto-generate and publish Facebook posts with AI"}
                </p>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex flex-wrap gap-1.5 bg-[#09090b]/40 border border-zinc-800/40 p-1 rounded-xl shadow-inner">
              {[
                { key: "topic_setup" as const, icon: <Sparkles className="w-4 h-4" />, label: lang === "vi" ? "Chủ đề" : "Topics" },
                { key: "manage" as const, icon: <List className="w-4 h-4" />, label: lang === "vi" ? "Quản lý" : "Manage" },
                { key: "product_setup" as const, icon: <Package className="w-4 h-4" />, label: lang === "vi" ? "Thêm sản phẩm" : "Add Product" },
                { key: "product_list" as const, icon: <FileText className="w-4 h-4" />, label: lang === "vi" ? "Danh sách sản phẩm" : "Product List" },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === t.key
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md"
                    : theme === "dark" ? "text-zinc-400 hover:bg-zinc-900/60" : "text-gray-500 hover:bg-gray-150"
                  }`}
                >
                  <span className="flex items-center gap-1.5">{t.icon}{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
          {/* Success / Error Messages */}
          {setupMsg && (
            <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 text-sm font-medium animate-in fade-in ${
              setupMsg.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}>
              {setupMsg.type === "success" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {setupMsg.text}
              <button onClick={() => setSetupMsg(null)} className="ml-auto"><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* ══════ TAB 1: TOPIC SETUP ══════ */}
          {activeTab === "topic_setup" && (
            <div className="space-y-6">
              {/* Setup Name */}
              <SectionCard title={lang === "vi" ? "Tên thiết lập" : "Setup Name"} theme={theme}>
                <input
                  value={setupName}
                  onChange={e => setSetupName(e.target.value)}
                  placeholder={lang === "vi" ? "Ví dụ: Chiến dịch tháng 7..." : "e.g. July Campaign..."}
                  className={inputCls(theme)}
                />
              </SectionCard>

              {/* Step 1: Create setup first, then generate topics */}
              {!tempSetupId ? (
                <>
                  {/* Content Settings */}
                  <SectionCard title={lang === "vi" ? "Cài đặt nội dung" : "Content Settings"} theme={theme}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls(theme)}>{lang === "vi" ? "Ngôn ngữ bài viết" : "Post Language"}</label>
                        <select value={language} onChange={e => setLanguage(e.target.value)} className={inputCls(theme)}>
                          <option value="vi">Tiếng Việt</option>
                          <option value="en">English</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelCls(theme)}>{lang === "vi" ? "Độ dài bài viết" : "Post Length"}</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {POST_LENGTHS.map(l => (
                            <button key={l.value} onClick={() => setPostLength(l.value)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${postLength === l.value
                                ? "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/20"
                                : theme === "dark" ? "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600" : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                              }`}
                            >
                              {lang === "vi" ? l.label : l.labelEn}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className={labelCls(theme)}>{lang === "vi" ? "Phong cách viết" : "Writing Style"}</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {WRITING_STYLES.map(s => (
                          <button key={s.value} onClick={() => setWritingStyle(s.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${writingStyle === s.value
                              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500"
                              : theme === "dark" ? "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600" : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                            }`}
                          >
                            {lang === "vi" ? s.label : s.labelEn}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className={labelCls(theme)}>{lang === "vi" ? "Yêu cầu cá nhân hóa (không bắt buộc)" : "Custom Prompt (optional)"}</label>
                      <textarea
                        value={customPrompt} onChange={e => setCustomPrompt(e.target.value)}
                        rows={3}
                        placeholder={lang === "vi" ? "Ví dụ: Luôn đề cập đến chương trình giảm giá 50%..." : "e.g. Always mention 50% discount program..."}
                        className={inputCls(theme)}
                      />
                    </div>

                    <div className="mt-4 flex flex-col gap-3">
                      <ToggleRow label={lang === "vi" ? "Dùng thông tin fanpage" : "Use fanpage info"} value={useFanpageInfo} onChange={setUseFanpageInfo} theme={theme} />
                      <ToggleRow label={lang === "vi" ? "Thêm thông tin liên hệ" : "Include contact info"} value={includeContact} onChange={setIncludeContact} theme={theme} />
                      {includeContact && (
                        <textarea value={contactInfo} onChange={e => setContactInfo(e.target.value)} rows={2}
                          placeholder={lang === "vi" ? "SĐT: 0123... | Địa chỉ: ..." : "Phone: ... | Address: ..."}
                          className={inputCls(theme)} />
                      )}
                    </div>
                  </SectionCard>

                  {/* Schedule */}
                  <SectionCard title={lang === "vi" ? "Cài đặt lịch trình" : "Schedule Settings"} theme={theme}>
                    <div className="flex gap-3 mb-4">
                      {(["weekly", "fixed"] as const).map(m => (
                        <button key={m} onClick={() => setScheduleMode(m)}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer ${scheduleMode === m
                            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500 shadow-lg shadow-purple-500/20"
                            : theme === "dark" ? "bg-zinc-900 text-zinc-400 border-zinc-800" : "bg-white text-gray-500 border-gray-300"
                          }`}
                        >
                          {m === "weekly" ? (lang === "vi" ? "Lặp theo tuần" : "Weekly") : (lang === "vi" ? "Ngày cố định" : "Fixed Date")}
                        </button>
                      ))}
                    </div>

                    {scheduleMode === "weekly" && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {WEEKDAYS.map(d => (
                          <button key={d.value}
                            onClick={() => setScheduleDays(prev => prev.includes(d.value) ? prev.filter(x => x !== d.value) : [...prev, d.value])}
                            className={`w-10 h-10 rounded-xl text-xs font-bold transition-all border cursor-pointer ${scheduleDays.includes(d.value)
                              ? "bg-purple-600 text-white border-purple-500"
                              : theme === "dark" ? "bg-zinc-900 text-zinc-400 border-zinc-800" : "bg-white text-gray-500 border-gray-300"
                            }`}
                          >
                            {lang === "vi" ? d.label : d.labelEn}
                          </button>
                        ))}
                      </div>
                    )}

                    {scheduleMode === "fixed" && (
                      <div className="mb-4">
                        <label className={labelCls(theme)}>{lang === "vi" ? "Ngày đăng bài" : "Post Date"}</label>
                        <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className={inputCls(theme)} />
                      </div>
                    )}

                    <label className={labelCls(theme)}>{lang === "vi" ? "Khung giờ đăng" : "Post Times"}</label>
                    <div className="flex flex-wrap gap-2">
                      {scheduleTimes.map((t, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <input type="time" value={t} onChange={e => { const n = [...scheduleTimes]; n[i] = e.target.value; setScheduleTimes(n); }}
                            className={`${inputCls(theme)} w-32`} />
                          {scheduleTimes.length > 1 && (
                            <button onClick={() => setScheduleTimes(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
                          )}
                        </div>
                      ))}
                      <button onClick={() => setScheduleTimes(prev => [...prev, "12:00"])}
                        className="px-3 py-2 rounded-lg text-xs font-semibold text-purple-400 border border-dashed border-purple-500/30 hover:bg-purple-500/10 transition-all cursor-pointer">
                        <Plus className="w-3 h-3 inline mr-1" />{lang === "vi" ? "Thêm giờ" : "Add time"}
                      </button>
                    </div>
                  </SectionCard>

                  {/* Fanpage Selection */}
                  <SectionCard title={lang === "vi" ? "Chọn Fanpage đăng bài" : "Select Fanpages"} theme={theme}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {fanpages.map(fp => (
                        <button key={fp.id}
                          onClick={() => setSelectedPages(prev => prev.includes(fp.id) ? prev.filter(x => x !== fp.id) : [...prev, fp.id])}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedPages.includes(fp.id)
                            ? "border-purple-500 bg-purple-500/10 shadow-md shadow-purple-500/10"
                            : theme === "dark" ? "border-zinc-800 bg-zinc-900/50 hover:border-zinc-600" : "border-gray-200 bg-white hover:border-gray-400"
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-400">
                            {fp.avatar_url ? <img src={fp.avatar_url} className="w-full h-full rounded-full object-cover" alt="" /> : fp.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium truncate">{fp.name}</span>
                          {selectedPages.includes(fp.id) && <Check className="w-4 h-4 text-purple-400 ml-auto" />}
                        </button>
                      ))}
                    </div>
                  </SectionCard>

                  {/* Auto Options */}
                  <SectionCard title={lang === "vi" ? "Tùy chọn nâng cao" : "Advanced Options"} theme={theme}>
                    <div className="space-y-3">
                      <ToggleRow label={lang === "vi" ? "Tự động viết và đăng bài" : "Auto-write and post"} value={autoPost} onChange={setAutoPost} theme={theme} />
                      <ToggleRow label={lang === "vi" ? "Tự lặp lại khi hết chủ đề" : "Auto-repeat when done"} value={autoRepeat} onChange={setAutoRepeat} theme={theme} />
                    </div>

                    <div className="mt-4">
                      <label className={labelCls(theme)}>{lang === "vi" ? "Chế độ đăng bài" : "Publish Mode"}</label>
                      <div className="flex gap-3 mt-1">
                        {(["instant", "review"] as const).map(m => (
                          <button key={m} onClick={() => setPublishMode(m)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${publishMode === m
                              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500 shadow-lg"
                              : theme === "dark" ? "bg-zinc-900 text-zinc-400 border-zinc-800" : "bg-white text-gray-500 border-gray-300"
                            }`}
                          >
                            {m === "instant" ? (lang === "vi" ? "⚡ Đăng ngay" : "⚡ Instant") : (lang === "vi" ? "👁 Duyệt trước" : "👁 Review first")}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className={labelCls(theme)}>{lang === "vi" ? "Comment tự động đầu tiên" : "Auto First Comment"}</label>
                      <textarea value={autoComment} onChange={e => setAutoComment(e.target.value)} rows={2}
                        placeholder={lang === "vi" ? "Ví dụ: 📞 Liên hệ hotline 0123..." : "e.g. 📞 Contact us..."}
                        className={inputCls(theme)} />
                    </div>
                  </SectionCard>

                  {/* Submit Button */}
                  <button onClick={() => handleCreateSetup("topic")} disabled={submitting}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm uppercase tracking-wider shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 transition-all disabled:opacity-50 cursor-pointer active:scale-[0.98]">
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
                      <span className="flex items-center justify-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        {lang === "vi" ? "Tạo thiết lập mới" : "Create Setup"}
                      </span>
                    )}
                  </button>
                </>
              ) : (
                /* Step 2: After setup created, show topic generation */
                <>
                  <SectionCard title={lang === "vi" ? "Tạo chủ đề bằng AI" : "Generate Topics with AI"} theme={theme}>
                    <textarea value={topicPrompt} onChange={e => setTopicPrompt(e.target.value)} rows={4}
                      placeholder={lang === "vi" ? "Mô tả nội dung bạn muốn đăng. Ví dụ: Tạo các bài viết về thời trang mùa hè, xu hướng 2026, phong cách công sở..." : "Describe the content. e.g. Create posts about summer fashion trends 2026..."}
                      className={inputCls(theme)} />
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <label className={`text-xs font-semibold ${theme === "dark" ? "text-zinc-400" : "text-gray-600"}`}>{lang === "vi" ? "Số lượng:" : "Count:"}</label>
                        <select value={topicCount} onChange={e => setTopicCount(Number(e.target.value))} className={`${inputCls(theme)} w-20`}>
                          {[10, 20, 30, 50].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                      <button onClick={handleGenerateTopics} disabled={aiGenerating || !topicPrompt.trim()}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all disabled:opacity-50 cursor-pointer">
                        {aiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 inline mr-1" />{lang === "vi" ? "Tạo chủ đề" : "Generate"}</>}
                      </button>
                    </div>
                  </SectionCard>

                  {/* Manual topic add */}
                  <SectionCard title={lang === "vi" ? "Thêm chủ đề thủ công" : "Add Topic Manually"} theme={theme}>
                    <div className="flex gap-2">
                      <input value={newTopicInput} onChange={e => setNewTopicInput(e.target.value)}
                        placeholder={lang === "vi" ? "Nhập tên chủ đề..." : "Enter topic..."}
                        className={`flex-1 ${inputCls(theme)}`}
                        onKeyDown={e => e.key === "Enter" && handleAddManualTopic()} />
                      <button onClick={handleAddManualTopic} className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs cursor-pointer hover:bg-purple-500 transition-all">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </SectionCard>

                  {/* Generated topics list */}
                  {generatedTopics.length > 0 && (
                    <SectionCard title={`${lang === "vi" ? "Danh sách chủ đề" : "Topics"} (${generatedTopics.length})`} theme={theme}>
                      <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                        {generatedTopics.map((t, i) => (
                          <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${theme === "dark" ? "bg-zinc-900/50 border-zinc-800" : "bg-white border-gray-200"}`}>
                            <span className={`text-xs font-bold w-6 text-center ${theme === "dark" ? "text-zinc-500" : "text-gray-400"}`}>{i + 1}</span>
                            <span className="flex-1 text-sm">{t}</span>
                            <button onClick={() => setGeneratedTopics(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-300 cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  )}

                  {/* Activate Button */}
                  <button onClick={() => { handleToggleSetup(tempSetupId); setActiveTab("manage"); setTempSetupId(null); setGeneratedTopics([]); }}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm uppercase tracking-wider shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all cursor-pointer active:scale-[0.98]">
                    <span className="flex items-center justify-center gap-2">
                      <Power className="w-5 h-5" />
                      {lang === "vi" ? "Kích hoạt thiết lập" : "Activate Setup"}
                    </span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* ══════ TAB 2: MANAGE SETUPS ══════ */}
          {activeTab === "manage" && (
            <div className="space-y-6">
              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === "dark" ? "text-zinc-500" : "text-gray-400"}`} />
                  <input value={setupSearch} onChange={e => setSetupSearch(e.target.value)}
                    placeholder={lang === "vi" ? "Tìm kiếm thiết lập..." : "Search setups..."}
                    className={`pl-10 ${inputCls(theme)}`} />
                </div>
                <div className="flex gap-2">
                  {(["all", "active", "paused", "completed"] as const).map(f => (
                    <button key={f} onClick={() => setSetupFilter(f)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${setupFilter === f
                        ? "bg-purple-600 text-white border-purple-500"
                        : theme === "dark" ? "bg-zinc-900 text-zinc-400 border-zinc-800" : "bg-white text-gray-500 border-gray-300"
                      }`}
                    >
                      {f === "all" ? (lang === "vi" ? "Tất cả" : "All") : f === "active" ? (lang === "vi" ? "Đang chạy" : "Active") : f === "paused" ? (lang === "vi" ? "Tạm dừng" : "Paused") : (lang === "vi" ? "Hoàn thành" : "Done")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Setups List */}
              {setups.length === 0 ? (
                <div className={`text-center py-16 rounded-2xl border ${theme === "dark" ? "bg-zinc-900/30 border-zinc-800/40" : "bg-white border-gray-200"}`}>
                  <Settings className={`w-12 h-12 mx-auto mb-3 ${theme === "dark" ? "text-zinc-700" : "text-gray-300"}`} />
                  <p className={`text-sm ${theme === "dark" ? "text-zinc-500" : "text-gray-400"}`}>{lang === "vi" ? "Chưa có thiết lập nào." : "No setups yet."}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {setups.map(setup => (
                    <div key={setup.id} className={`rounded-2xl border overflow-hidden transition-all ${theme === "dark" ? "bg-zinc-900/30 border-zinc-800/40" : "bg-white border-gray-200"}`}>
                      <div className="flex items-center gap-4 p-4">
                        <button onClick={() => handleToggleSetup(setup.id)}
                          className={`w-12 h-7 rounded-full relative transition-all cursor-pointer ${setup.status === "active" ? "bg-emerald-500" : "bg-zinc-700"}`}>
                          <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all ${setup.status === "active" ? "left-5.5" : "left-0.5"}`} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm truncate">{setup.name}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              setup.status === "active" ? "bg-emerald-500/10 text-emerald-400" :
                              setup.status === "paused" ? "bg-amber-500/10 text-amber-400" :
                              "bg-zinc-500/10 text-zinc-400"
                            }`}>{setup.status}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              setup.source_type === "topic" ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"
                            }`}>{setup.source_type === "topic" ? "Chủ đề" : "Sản phẩm"}</span>
                          </div>
                          <p className={`text-xs mt-0.5 ${theme === "dark" ? "text-zinc-500" : "text-gray-400"}`}>
                            {setup.topics_count || 0} {lang === "vi" ? "chủ đề" : "topics"} · {setup.publish_mode === "review" ? "👁 Duyệt trước" : "⚡ Đăng ngay"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleExpandSetup(setup.id)}
                            className={`p-2 rounded-lg transition-all cursor-pointer ${theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-gray-100"}`}>
                            {expandedSetup === setup.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                          <button onClick={() => handleDeleteSetup(setup.id)}
                            className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded: Topics List */}
                      {expandedSetup === setup.id && (
                        <div className={`border-t p-4 ${theme === "dark" ? "border-zinc-800/40 bg-zinc-950/50" : "border-gray-100 bg-gray-50"}`}>
                          {loadingTopics ? (
                            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-purple-500" /></div>
                          ) : setupTopics.length === 0 ? (
                            <p className={`text-center py-4 text-sm ${theme === "dark" ? "text-zinc-500" : "text-gray-400"}`}>{lang === "vi" ? "Không có chủ đề nào." : "No topics."}</p>
                          ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                              {setupTopics.map(topic => (
                                <div key={topic.id} className={`p-3 rounded-xl border ${theme === "dark" ? "bg-zinc-900/50 border-zinc-800" : "bg-white border-gray-200"}`}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full ${
                                        topic.status === "published" ? "bg-emerald-400" :
                                        topic.status === "generated" ? "bg-amber-400" :
                                        topic.status === "failed" ? "bg-red-400" : "bg-zinc-500"
                                      }`} />
                                      <span className="text-sm font-medium">{topic.title.startsWith("[product:") ? `📦 ${topic.title}` : topic.title}</span>
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase ${
                                      topic.status === "published" ? "text-emerald-400" :
                                      topic.status === "generated" ? "text-amber-400" :
                                      topic.status === "failed" ? "text-red-400" : "text-zinc-500"
                                    }`}>{topic.status}</span>
                                  </div>
                                  {topic.generated_content && (
                                    <p className={`mt-2 text-xs leading-relaxed line-clamp-3 ${theme === "dark" ? "text-zinc-400" : "text-gray-500"}`}>{topic.generated_content}</p>
                                  )}
                                  {topic.generated_image_url && (
                                    <div className="mt-2 relative w-24 h-24 rounded-lg overflow-hidden border border-zinc-700/50">
                                      <img src={topic.generated_image_url} alt="" className="w-full h-full object-cover" />
                                    </div>
                                  )}
                                  {topic.status === "generated" && (
                                    <div className="mt-2 flex gap-2">
                                      <button onClick={() => handleOpenReview(topic)}
                                        className="px-4 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold shadow-md cursor-pointer hover:bg-purple-500 transition-all">
                                        <Edit3 className="w-3.5 h-3.5 inline mr-1" />{lang === "vi" ? "Chỉnh sửa & Duyệt" : "Edit & Review"}
                                      </button>
                                      <button onClick={() => handleApproveTopic(topic.id)} disabled={approvingTopic === topic.id}
                                        className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-md cursor-pointer hover:shadow-lg transition-all disabled:opacity-50">
                                        {approvingTopic === topic.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Send className="w-3 h-3 inline mr-1" />{lang === "vi" ? "Đăng ngay" : "Publish Now"}</>}
                                      </button>
                                    </div>
                                  )}
                                  {topic.error_log && (
                                    <p className="mt-1 text-[10px] text-red-400">{topic.error_log}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════ TAB 3: PRODUCT SETUP ══════ */}
          {activeTab === "product_setup" && (
            <div className="space-y-6">
              <SectionCard title={lang === "vi" ? "Thêm sản phẩm mới" : "Add New Product"} theme={theme}>
                <div className="space-y-4">
                  <div>
                    <label className={labelCls(theme)}>{lang === "vi" ? "Tên sản phẩm" : "Product Name"} *</label>
                    <input value={productName} onChange={e => setProductName(e.target.value)} className={inputCls(theme)}
                      placeholder={lang === "vi" ? "Ví dụ: Áo thun in hình..." : "e.g. Printed T-shirt..."} />
                  </div>
                  <div>
                    <label className={labelCls(theme)}>{lang === "vi" ? "Thông tin sản phẩm" : "Description"}</label>
                    <textarea value={productDesc} onChange={e => setProductDesc(e.target.value)} rows={3} className={inputCls(theme)}
                      placeholder={lang === "vi" ? "Mô tả chi tiết sản phẩm..." : "Product details..."} />
                  </div>
                  <div>
                    <label className={labelCls(theme)}>{lang === "vi" ? "Ảnh sản phẩm (URL)" : "Product Images (URL)"}</label>
                    <div className="flex gap-2">
                      <input value={productImageUrl} onChange={e => setProductImageUrl(e.target.value)}
                        placeholder="https://..." className={`flex-1 ${inputCls(theme)}`}
                        onKeyDown={e => e.key === "Enter" && addImageUrl()} />
                      <button onClick={addImageUrl} className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs cursor-pointer hover:bg-purple-500 transition-all">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    {productImageList.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {productImageList.map((url, i) => (
                          <div key={i} className="relative group">
                            <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-zinc-700" onError={e => (e.target as HTMLImageElement).style.display = "none"} />
                            <button onClick={() => setProductImageList(prev => prev.filter((_, idx) => idx !== i))}
                              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className={labelCls(theme)}>{lang === "vi" ? "Comment đầu tiên (riêng SP này)" : "First Comment (for this product)"}</label>
                    <textarea value={productComment} onChange={e => setProductComment(e.target.value)} rows={2} className={inputCls(theme)}
                      placeholder={lang === "vi" ? "Ví dụ: 🛒 Mua ngay tại link..." : "e.g. 🛒 Buy now at..."} />
                  </div>

                  <button onClick={handleAddProduct} disabled={productSubmitting || !productName.trim()}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm uppercase tracking-wider shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 transition-all disabled:opacity-50 cursor-pointer active:scale-[0.98]">
                    {productSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
                      <span className="flex items-center justify-center gap-2">
                        <Package className="w-5 h-5" />
                        {lang === "vi" ? "Thêm sản phẩm" : "Add Product"}
                      </span>
                    )}
                  </button>
                </div>
              </SectionCard>

              {/* Nhập sản phẩm hàng loạt / Seeder */}
              <SectionCard title={lang === "vi" ? "Nhập sản phẩm nhanh (Hàng loạt / Demo)" : "Bulk Import & Demo Seeder"} theme={theme}>
                <div className="space-y-4">
                  <button
                    onClick={handleSeedMockProducts}
                    disabled={bulkSubmitting}
                    className={`w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all border cursor-pointer ${
                      theme === "dark"
                        ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                        : "border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                    }`}
                  >
                    {bulkSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    {lang === "vi" ? "Tự động tạo 5 sản phẩm mẫu (Khoá học & Tài khoản AI)" : "Auto Seed 5 Demo AI Products & Accounts"}
                  </button>

                  <div className="flex items-center">
                    <div className="flex-1 border-t border-zinc-850/40"></div>
                    <span className="px-3 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{lang === "vi" ? "Hoặc nhập JSON" : "Or Import JSON"}</span>
                    <div className="flex-1 border-t border-zinc-850/40"></div>
                  </div>

                  <div>
                    <label className={labelCls(theme)}>{lang === "vi" ? "Mảng JSON sản phẩm" : "JSON Array of Products"}</label>
                    <textarea
                      value={bulkJson}
                      onChange={e => setBulkJson(e.target.value)}
                      rows={4}
                      className={`${inputCls(theme)} font-mono text-[11px]`}
                      placeholder={`[
  {
    "name": "Canva Pro 1 Năm",
    "description": "Gia hạn chính chủ Canva Pro...",
    "image_urls": ["https://images.unsplash.com/..."],
    "comment": "Mua ngay..."
  }
]`}
                    />
                  </div>

                  <button
                    onClick={handleBulkJsonImport}
                    disabled={bulkSubmitting || !bulkJson.trim()}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                  >
                    {bulkSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <FileText className="w-4 h-4" />
                        {lang === "vi" ? "Nhập danh sách sản phẩm" : "Import Product List"}
                      </span>
                    )}
                  </button>
                </div>
              </SectionCard>

              {/* Quick setup for product source_type */}
              <SectionCard title={lang === "vi" ? "Tạo thiết lập từ sản phẩm" : "Create Product Setup"} theme={theme}>
                <p className={`text-xs mb-4 ${theme === "dark" ? "text-zinc-500" : "text-gray-400"}`}>
                  {lang === "vi" ? "Sau khi thêm sản phẩm, tạo thiết lập để AI tự viết bài và đăng từ danh sách sản phẩm." : "After adding products, create a setup to auto-generate posts from your product list."}
                </p>
                <button onClick={() => { setActiveTab("topic_setup"); }}
                  className={`w-full py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${theme === "dark" ? "border-purple-500/30 text-purple-400 hover:bg-purple-500/10" : "border-purple-300 text-purple-600 hover:bg-purple-50"}`}>
                  <Settings className="w-4 h-4 inline mr-2" />{lang === "vi" ? "Mở trang thiết lập" : "Open Setup Page"}
                </button>
              </SectionCard>
            </div>
          )}

          {/* ══════ TAB 4: PRODUCT LIST ══════ */}
          {activeTab === "product_list" && (
            <div className="space-y-6">
              {/* Search */}
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === "dark" ? "text-zinc-500" : "text-gray-400"}`} />
                <input value={productSearch} onChange={e => setProductSearch(e.target.value)}
                  placeholder={lang === "vi" ? "Tìm sản phẩm..." : "Search products..."}
                  className={`pl-10 ${inputCls(theme)}`} />
              </div>

              {products.length === 0 ? (
                <div className={`text-center py-16 rounded-2xl border ${theme === "dark" ? "bg-zinc-900/30 border-zinc-800/40" : "bg-white border-gray-200"}`}>
                  <Package className={`w-12 h-12 mx-auto mb-3 ${theme === "dark" ? "text-zinc-700" : "text-gray-300"}`} />
                  <p className={`text-sm ${theme === "dark" ? "text-zinc-500" : "text-gray-400"}`}>{lang === "vi" ? "Chưa có sản phẩm nào." : "No products yet."}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map(p => (
                    <div key={p.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${theme === "dark" ? "bg-zinc-900/30 border-zinc-800/40" : "bg-white border-gray-200"}`}>
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        {p.image_urls && p.image_urls.length > 0 ? (
                          <img src={p.image_urls[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-6 h-6 text-zinc-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm truncate">{p.name}</h3>
                        {p.description && <p className={`text-xs truncate mt-0.5 ${theme === "dark" ? "text-zinc-500" : "text-gray-400"}`}>{p.description}</p>}
                      </div>
                      <button onClick={() => handleToggleProduct(p)}
                        className={`w-10 h-6 rounded-full relative transition-all cursor-pointer ${p.auto_post_enabled ? "bg-emerald-500" : "bg-zinc-700"}`}>
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all ${p.auto_post_enabled ? "left-4.5" : "left-0.5"}`} />
                      </button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Topic Review / Edit Modal */}
      {reviewTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 ${
            theme === "dark" ? "bg-[#0f0f15] border-zinc-800 text-zinc-100" : "bg-white border-gray-200 text-gray-900"
          }`}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-purple-500" />
                {lang === "vi" ? "Duyệt & Chỉnh sửa bài viết" : "Review & Edit Post"}
              </h3>
              <button onClick={() => setReviewTopic(null)} className={`p-1.5 rounded-lg transition-all ${
                theme === "dark" ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-gray-100 text-gray-500"
              }`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {reviewError && (
              <div className="p-3 text-xs font-semibold rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {reviewError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className={labelCls(theme)}>{lang === "vi" ? "Nội dung bài viết" : "Post Content"}</label>
                <textarea
                  value={reviewContent}
                  onChange={e => setReviewContent(e.target.value)}
                  rows={6}
                  className={inputCls(theme)}
                  placeholder={lang === "vi" ? "Nhập nội dung bài viết..." : "Enter content..."}
                />
              </div>

              <div>
                <label className={labelCls(theme)}>{lang === "vi" ? "Ảnh bài viết (URL hoặc Upload)" : "Post Image (URL or Upload)"}</label>
                <input
                  type="text"
                  value={reviewImageUrl}
                  onChange={e => setReviewImageUrl(e.target.value)}
                  className={inputCls(theme)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="flex items-center justify-center border border-dashed rounded-xl p-4 cursor-pointer transition-all hover:bg-purple-500/5 hover:border-purple-500/50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadReviewImage}
                    className="hidden"
                  />
                  {uploadingImage ? (
                    <span className="flex items-center gap-2 text-xs font-bold text-purple-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {lang === "vi" ? "Đang tải ảnh lên..." : "Uploading image..."}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-xs font-bold text-purple-400">
                      <ImageIcon className="w-4 h-4" />
                      {lang === "vi" ? "Tải ảnh từ máy tính" : "Upload image from computer"}
                    </span>
                  )}
                </label>
              </div>

              {reviewImageUrl && (
                <div className="relative w-full h-32 rounded-xl overflow-hidden border border-zinc-800/40 bg-zinc-950 flex items-center justify-center">
                  <img src={reviewImageUrl} alt="" className="h-full object-contain" onError={e => (e.target as HTMLImageElement).style.display = "none"} />
                  <button
                    onClick={() => setReviewImageUrl("")}
                    className="absolute top-2 right-2 p-1 bg-red-500/80 rounded-full text-white hover:bg-red-600 transition-all shadow-md"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSaveDraftTopic}
                disabled={reviewSubmitting || uploadingImage}
                className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                  theme === "dark"
                    ? "border-zinc-800 text-zinc-400 hover:bg-zinc-900"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {lang === "vi" ? "Lưu bản nháp" : "Save Draft"}
              </button>
              <button
                onClick={handleSaveAndPublishTopic}
                disabled={reviewSubmitting || uploadingImage || !reviewContent.trim()}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50 cursor-pointer active:scale-[0.98]"
              >
                {reviewSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  <span className="flex items-center justify-center gap-1">
                    <Send className="w-3.5 h-3.5" />
                    {lang === "vi" ? "Duyệt & Đăng bài" : "Approve & Publish"}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ───────── Helper Components ─────────
function SectionCard({ title, theme, children }: { title: string; theme: string; children: React.ReactNode }) {
  return (
    <div className={`p-5 rounded-2xl border ${theme === "dark" ? "bg-zinc-900/30 border-zinc-800/40" : "bg-white border-gray-200 shadow-sm"}`}>
      <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${theme === "dark" ? "text-zinc-400" : "text-gray-500"}`}>{title}</h3>
      {children}
    </div>
  );
}

function ToggleRow({ label, value, onChange, theme }: { label: string; value: boolean; onChange: (v: boolean) => void; theme: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm font-medium ${theme === "dark" ? "text-zinc-300" : "text-gray-700"}`}>{label}</span>
      <button onClick={() => onChange(!value)}
        className={`w-10 h-6 rounded-full relative transition-all cursor-pointer ${value ? "bg-purple-600" : theme === "dark" ? "bg-zinc-700" : "bg-gray-300"}`}>
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all ${value ? "left-4.5" : "left-0.5"}`} />
      </button>
    </div>
  );
}

// ───────── Style Helpers ─────────
function inputCls(theme: string) {
  return `w-full px-4 py-2.5 rounded-xl text-sm transition-all outline-none border ${
    theme === "dark"
      ? "bg-zinc-900/80 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
      : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20"
  }`;
}

function labelCls(theme: string) {
  return `block text-xs font-semibold mb-1.5 ${theme === "dark" ? "text-zinc-400" : "text-gray-600"}`;
}
