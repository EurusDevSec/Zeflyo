"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Image as ImageIcon,
  Check,
  Globe,
  ThumbsUp,
  MessageCircle,
  Share2,
  AlertTriangle,
  Loader2,
  Trash2,
  Sparkles,
  Plus
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

export default function PostScheduler() {
  const [token, setToken] = useState<string | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>("http://localhost");
  const [fanpages, setFanpages] = useState<Fanpage[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  
  // Form State
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [content, setContent] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [dragActive, setDragActive] = useState<boolean>(false);
  
  // Date & Time State
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [scheduledTime, setScheduledTime] = useState<string>("");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
  
  // Statuses
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load configuration
  useEffect(() => {
    const savedToken = localStorage.getItem("zeflyo_token");
    const savedApiBase = localStorage.getItem("zeflyo_api_base");
    const savedPages = localStorage.getItem("zeflyo_mock_pages");

    if (savedToken) setToken(savedToken);
    if (savedApiBase) setApiBaseUrl(savedApiBase);

    // Initial page load
    if (savedPages) {
      try {
        setFanpages(JSON.parse(savedPages));
      } catch (e) {
        console.error("Failed to parse mock pages", e);
      }
    }

    // Set default tomorrow date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduledDate(tomorrow.toISOString().split("T")[0]);
    setScheduledTime("09:00");
  }, []);

  // Fetch from Backend if real mode
  useEffect(() => {
    if (token) {
      if (!token.startsWith("mock_")) {
        fetchRealFanpages();
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

  // Drag & Drop Image Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setImageUrl(event.target.result as string);
            showNotification("success", "Image uploaded successfully (local preview)");
          }
        };
        reader.readAsDataURL(file);
      } else {
        showNotification("error", "Please upload an image file.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setImageUrl(event.target.result as string);
            showNotification("success", "Image uploaded successfully (local preview)");
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Toggle Page Selection
  const togglePageSelection = (id: number) => {
    setSelectedPages(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  // Handle Form Submit
  const handleScheduleSubmit = async (status: "pending" | "draft") => {
    if (selectedPages.length === 0) {
      showNotification("error", "Please select at least one Fanpage.");
      return;
    }
    if (!content.trim()) {
      showNotification("error", "Post content cannot be empty.");
      return;
    }

    // Combine Date and Time
    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const now = new Date();

    if (status === "pending" && scheduledDateTime <= now) {
      showNotification("error", "Scheduled date and time must be in the future.");
      return;
    }

    setSubmitting(true);
    
    const postData = {
      fanpage_ids: selectedPages,
      content,
      image_url: imageUrl || null,
      scheduled_at: scheduledDateTime.toISOString(),
      status
    };

    if (token && token.startsWith("mock_")) {
      // Mock Save local
      await new Promise(resolve => setTimeout(resolve, 800));
      const newPost: ScheduledPost = {
        id: Math.floor(Math.random() * 100000),
        user_id: 99,
        fanpage_ids: selectedPages,
        content,
        image_url: imageUrl || null,
        scheduled_at: scheduledDateTime.toISOString(),
        status,
        error_log: null,
        created_at: new Date().toISOString()
      };
      
      const updatedList = [newPost, ...scheduledPosts];
      setScheduledPosts(updatedList);
      localStorage.setItem("zeflyo_mock_scheduled_posts", JSON.stringify(updatedList));
      
      showNotification("success", `Post scheduled successfully as ${status}!`);
      resetForm();
      setSubmitting(false);
    } else {
      // Real API Call
      try {
        const response = await fetch(`${apiBaseUrl}/api/posts/schedule`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(postData)
        });

        const data = await response.json();

        if (response.ok) {
          showNotification("success", `Post scheduled successfully as ${status}!`);
          fetchScheduledPosts();
          resetForm();
        } else {
          showNotification("error", data.error || "Failed to schedule post.");
        }
      } catch (err) {
        showNotification("error", "Connection error. Make sure backend is running.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Delete scheduled post
  const handleDeletePost = async (id: number) => {
    if (token && token.startsWith("mock_")) {
      const updatedList = scheduledPosts.filter(post => post.id !== id);
      setScheduledPosts(updatedList);
      localStorage.setItem("zeflyo_mock_scheduled_posts", JSON.stringify(updatedList));
      showNotification("success", "Scheduled post deleted successfully.");
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
          showNotification("success", "Scheduled post deleted successfully.");
          fetchScheduledPosts();
        } else {
          showNotification("error", "Failed to delete scheduled post.");
        }
      } catch (err) {
        showNotification("error", "Connection error.");
      }
    }
  };

  const resetForm = () => {
    setContent("");
    setImageUrl("");
    setSelectedPages([]);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduledDate(tomorrow.toISOString().split("T")[0]);
    setScheduledTime("09:00");
  };

  // Helper: Find first selected page details for mockup preview
  const previewPage = fanpages.find(p => selectedPages.includes(p.id)) || fanpages[0];

  // Helper: Format scheduled date for preview
  const formatPreviewDate = () => {
    if (!scheduledDate) return "Scheduled Post";
    try {
      const date = new Date(`${scheduledDate}T${scheduledTime}`);
      return date.toLocaleString("en-US", { 
        month: "short", 
        day: "numeric", 
        hour: "numeric", 
        minute: "2-digit" 
      });
    } catch {
      return "Scheduled Post";
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] p-6 lg:p-12 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-900/15 blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-7xl mx-auto flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <a 
            href="/"
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </a>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
              Post Scheduler <Sparkles className="w-5 h-5 text-blue-400" />
            </h1>
            <p className="text-sm text-zinc-400">Lên lịch soạn thảo và tự động đăng bài lên nhiều Fanpage cùng lúc</p>
          </div>
        </div>
      </header>

      {/* Main Layout Grid */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10 mb-12">
        
        {/* Left Side: Form Panel */}
        <div className="glass-panel rounded-2xl p-6 lg:p-8 flex flex-col gap-6">
          <h2 className="text-lg font-semibold text-zinc-200 border-b border-zinc-800 pb-3 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-500/10 text-blue-400 text-xs font-bold">1</span>
            Soạn thảo nội dung
          </h2>

          {/* Select Fanpages Checkbox List */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Chọn Fanpage đăng bài ({selectedPages.length})</label>
            {fanpages.length === 0 ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900/40 border border-amber-950/30 text-amber-500 text-sm">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>Chưa có fanpage kết nối. Vui lòng kết nối Fanpage ở trang chủ trước.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                {fanpages.map((page) => {
                  const isChecked = selectedPages.includes(page.id);
                  return (
                    <div 
                      key={page.id}
                      onClick={() => togglePageSelection(page.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked 
                          ? "bg-blue-500/10 border-blue-500/40 text-blue-300 shadow-sm shadow-blue-500/5" 
                          : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-300"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                        isChecked ? "bg-blue-500 border-blue-500 text-white" : "border-zinc-700 bg-zinc-950"
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{page.name}</p>
                        <p className="text-[10px] text-zinc-500 truncate">ID: {page.fb_page_id}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Post Content Input */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Nội dung bài viết</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Bạn đang nghĩ gì? Gõ nội dung bài đăng tại đây..."
              rows={5}
              className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-blue-500/50 rounded-xl p-4 text-sm focus:ring-1 focus:ring-blue-500/30 outline-none resize-none transition-all placeholder:text-zinc-600"
            />
          </div>

          {/* Image Uploader */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Hình ảnh đính kèm (Tùy chọn)</label>
            
            {imageUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950/60 p-2">
                <img 
                  src={imageUrl} 
                  alt="Post attachment" 
                  className="w-full max-h-[180px] object-cover rounded-lg"
                />
                <button 
                  onClick={() => setImageUrl("")}
                  className="absolute top-4 right-4 bg-zinc-950/80 hover:bg-red-950/80 text-zinc-400 hover:text-red-400 w-8 h-8 rounded-lg flex items-center justify-center border border-zinc-800 hover:border-red-900 transition-all cursor-pointer"
                  title="Remove image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                  dragActive 
                    ? "border-blue-500 bg-blue-500/5" 
                    : "border-zinc-800 bg-zinc-950/20 hover:bg-zinc-900/30 hover:border-zinc-700"
                }`}
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <input 
                  id="file-upload"
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
                  <ImageIcon className="w-5 h-5 text-zinc-400" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-zinc-300">Kéo thả ảnh hoặc click để tải lên</p>
                  <p className="text-[10px] text-zinc-500 mt-1">Hỗ trợ JPG, PNG, WEBP</p>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Hoặc dán URL hình ảnh trực tiếp..."
                className="w-full bg-zinc-950/40 border border-zinc-800 focus:border-blue-500/50 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500/30 outline-none transition-all placeholder:text-zinc-700"
              />
            </div>
          </div>

          {/* Datepicker & Timepicker Container */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Thời gian đăng bài</label>
            
            <div className="relative">
              <button 
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                className="w-full flex items-center justify-between bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 rounded-xl px-4 py-3 text-sm transition-all"
              >
                <div className="flex items-center gap-2.5 text-zinc-300">
                  <CalendarIcon className="w-4 h-4 text-blue-400" />
                  <span>{scheduledDate ? new Date(scheduledDate).toLocaleDateString("vi-VN") : "Chọn ngày"}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>{scheduledTime || "09:00"}</span>
                </div>
              </button>

              {/* Shadcn-like Popover Calendar Block */}
              {isDatePickerOpen && (
                <div className="absolute left-0 right-0 mt-2 p-4 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-20 flex flex-col gap-4 animate-float-short">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Chọn ngày</label>
                      <input 
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={scheduledDate}
                        onChange={(e) => {
                          setScheduledDate(e.target.value);
                        }}
                        className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-300 outline-none focus:border-blue-500 w-full"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Giờ đăng</label>
                      <input 
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-300 outline-none focus:border-blue-500 w-full"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsDatePickerOpen(false)}
                    className="w-full py-2 rounded-lg bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                  >
                    Xác nhận
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 mt-2">
            <button
              onClick={() => handleScheduleSubmit("draft")}
              disabled={submitting}
              className="py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              Lưu bản nháp
            </button>
            <button
              onClick={() => handleScheduleSubmit("pending")}
              disabled={submitting}
              className="py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span>Hẹn giờ đăng</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Live Facebook Mockup Preview */}
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Xem trước bài đăng (Thời gian thực)</h2>
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Globe className="w-3.5 h-3.5 text-zinc-500" /> Công khai
            </span>
          </div>

          {/* Facebook Desktop Feed Preview Card */}
          <div className="bg-[#18181b] rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
            {/* Mock Header */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center text-zinc-500 font-bold text-lg">
                  {previewPage?.avatar_url ? (
                    <img src={previewPage.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{previewPage?.name ? previewPage.name.charAt(0) : "Z"}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100 hover:underline cursor-pointer">
                    {previewPage?.name || "Chọn Fanpage để xem trước"}
                  </h3>
                  <div className="flex items-center gap-1 text-zinc-500 text-xs mt-0.5">
                    <span>{formatPreviewDate()}</span>
                    <span>•</span>
                    <Globe className="w-3 h-3" />
                  </div>
                </div>
              </div>
              <button className="text-zinc-500 hover:text-zinc-300">•••</button>
            </div>

            {/* Mock Body Text */}
            <div className="px-4 pb-3">
              <p className="text-sm text-zinc-200 whitespace-pre-wrap min-h-[40px]">
                {content || <span className="text-zinc-600 italic">Nhập nội dung ở cột trái để hiển thị xem trước tại đây...</span>}
              </p>
            </div>

            {/* Mock Attachment Image */}
            {imageUrl && (
              <div className="border-t border-b border-zinc-800/80 bg-zinc-950/80 flex items-center justify-center overflow-hidden max-h-[350px]">
                <img 
                  src={imageUrl} 
                  alt="Facebook attachment mockup" 
                  className="w-full object-cover aspect-video hover:scale-[1.01] transition-transform duration-500"
                />
              </div>
            )}

            {/* Mock Faux Actions Bar */}
            <div className="px-4 py-2 border-t border-b border-zinc-850 flex items-center justify-between text-zinc-400 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-white text-[9px] font-bold">👍</span>
                <span>12</span>
              </div>
              <div className="flex gap-3">
                <span>4 bình luận</span>
                <span>2 chia sẻ</span>
              </div>
            </div>

            <div className="px-2 py-1.5 flex items-center justify-around text-zinc-400 text-sm">
              <button className="flex items-center justify-center gap-2 py-2 hover:bg-zinc-900 rounded-lg flex-1 transition-all cursor-pointer font-medium text-xs">
                <ThumbsUp className="w-4 h-4" /> Thích
              </button>
              <button className="flex items-center justify-center gap-2 py-2 hover:bg-zinc-900 rounded-lg flex-1 transition-all cursor-pointer font-medium text-xs">
                <MessageCircle className="w-4 h-4" /> Bình luận
              </button>
              <button className="flex items-center justify-center gap-2 py-2 hover:bg-zinc-900 rounded-lg flex-1 transition-all cursor-pointer font-medium text-xs">
                <Share2 className="w-4 h-4" /> Chia sẻ
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Scheduled Posts List Section */}
      <section className="max-w-7xl mx-auto glass-panel rounded-2xl p-6 lg:p-8">
        <h2 className="text-lg font-semibold text-zinc-200 mb-6 flex items-center justify-between">
          <span>Danh sách bài viết đã lên lịch ({scheduledPosts.length})</span>
          {!token?.startsWith("mock_") && (
            <button 
              onClick={fetchScheduledPosts}
              className="text-xs text-zinc-500 hover:text-blue-400 flex items-center gap-1.5 transition-all"
            >
              Refresh
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
            <p className="text-xs text-zinc-600 mt-1">Sử dụng form trên để lên lịch cho bài đăng đầu tiên của bạn.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scheduledPosts.map((post) => {
              const matchedPages = fanpages.filter(p => post.fanpage_ids.includes(p.id));
              
              return (
                <div key={post.id} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-700 transition-all">
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
                  <div className="border-t border-zinc-800/80 pt-3 mt-2 flex items-center justify-between text-[11px] text-zinc-500">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-650 uppercase font-semibold">Giờ đăng</span>
                      <span className="text-zinc-400 font-medium">
                        {new Date(post.scheduled_at).toLocaleString("vi-VN")}
                      </span>
                    </div>

                    <button 
                      onClick={() => handleDeletePost(post.id)}
                      className="text-zinc-600 hover:text-red-400 p-1.5 hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
                      title="Cancel and Delete"
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
      </section>

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
  );
}
