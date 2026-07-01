"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  HelpCircle, 
  AlertTriangle, 
  ArrowUp,
  AlertOctagon,
  Play
} from "lucide-react";

interface GuideChapter {
  id: string;
  titleVi: string;
  titleEn: string;
  icon: string;
  content: {
    stepsVi: string[];
    stepsEn: string[];
    callouts: { type: "tip" | "warning" | "danger"; textVi: string; textEn: string }[];
    screenshot?: {
      url: string;
      captionVi: string;
      captionEn: string;
    };
    videoUrl?: string;
  };
}

export default function GuidePage() {
  const [lang, setLang] = useState<"en" | "vi">("vi");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChapter, setActiveChapter] = useState("quickstart");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeVideos, setActiveVideos] = useState<Record<string, boolean>>({});

  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedLang = localStorage.getItem("zeflyo_lang") || "vi";
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

  // Intersection Observer for scroll tracking
  useEffect(() => {
    const observerOptions = {
      root: null, // viewport
      rootMargin: "-20% 0px -60% 0px", // triggers when element is roughly in center third of screen
      threshold: 0
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveChapter(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    Object.values(contentRefs.current).forEach(el => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [searchQuery]);

  // Scroll event for floating scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 300;
      setShowScrollTop(scrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleVideo = (chapterId: string) => {
    setActiveVideos(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  const chapters: GuideChapter[] = [
    {
      id: "quickstart",
      titleVi: "🚀 Bắt đầu nhanh",
      titleEn: "🚀 Quick Start",
      icon: "🚀",
      content: {
        stepsVi: [
          "Đăng ký tài khoản và đăng nhập qua mạng xã hội Facebook OAuth.",
          "Cấu hình đường dẫn kết nối API Gateway của bạn ở phần Cài đặt.",
          "Bật tự động hóa cho các Fanpage và trải nghiệm hộp thư tập trung ngay lập tức."
        ],
        stepsEn: [
          "Register and login safely via Facebook OAuth.",
          "Configure your API Gateway endpoint address in the settings.",
          "Enable automations for your Fanpages and start using the Live Chat Hub instantly."
        ],
        callouts: [
          { type: "tip", textVi: "Mẹo: Chế độ Giả lập giúp bạn test nhanh các tính năng mà không cần setup API Backend thật.", textEn: "Tip: Mock Mode helps you test the interface immediately without configuring a real Laravel API." }
        ],
        screenshot: {
          url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
          captionVi: "Giao diện Dashboard tổng quan của Zeflyo Hub sau khi đăng nhập.",
          captionEn: "Overview Dashboard interface of Zeflyo Hub after successful authorization."
        },
        videoUrl: "dQw4w9WgXcQ"
      }
    },
    {
      id: "connect",
      titleVi: "📘 Kết nối Fanpage",
      titleEn: "📘 Page Integration",
      icon: "📘",
      content: {
        stepsVi: [
          "Mở Trang chủ, đi tới khu vực quản lý liên kết tài khoản Facebook.",
          "Nhấn 'Kết nối Facebook' và đồng ý cấp quyền trong cửa sổ popup bảo mật.",
          "Lựa chọn bật/tắt các Fanpage muốn đưa vào hệ thống quản lý AI Auto-Reply."
        ],
        stepsEn: [
          "Go to the homepage and open the Facebook accounts connections card.",
          "Click 'Connect Facebook' and authorize Zeflyo in the secure popup.",
          "Toggle active statuses for pages you want to apply AI auto-replies to."
        ],
        callouts: [
          { type: "warning", textVi: "Lưu ý: Bạn phải là Admin hoặc Biên tập viên của Fanpage để kết nối thành công.", textEn: "Warning: You must be an administrator or editor of the Facebook page to connect it." }
        ],
        screenshot: {
          url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80",
          captionVi: "Bảng điều khiển kết nối tài khoản Facebook và quản lý Fanpage.",
          captionEn: "Facebook integrations panel and Fanpage status toggle list."
        },
        videoUrl: "dQw4w9WgXcQ"
      }
    },
    {
      id: "chat",
      titleVi: "💬 Live Chat Hub",
      titleEn: "💬 Live Chat Hub",
      icon: "💬",
      content: {
        stepsVi: [
          "Mở trang Hộp thư tập trung để theo dõi tin nhắn và bình luận Fanpage thời gian thực.",
          "Xem chi tiết thông tin khách hàng, thẻ gắn tag và cấu hình AI cho từng người chat.",
          "Gửi câu trả lời nhanh chóng thông qua trình soạn thảo hỗ trợ xuống dòng và phím tắt gửi tin."
        ],
        stepsEn: [
          "Go to the Live Chat Hub page to monitor page comments and inbox messages in real-time.",
          "View customer profiles, badges, and toggle Gemini auto-replies for individual chats.",
          "Send replies quickly using the keyboard-enabled text area."
        ],
        callouts: [
          { type: "tip", textVi: "Mẹo: Trạng thái kết nối WebSocket ở tiêu đề đầu trang thể hiện độ trễ đồng bộ tin nhắn.", textEn: "Tip: The WebSocket status indicator in the header represents real-time synchronization state." }
        ],
        screenshot: {
          url: "https://images.unsplash.com/photo-1611605698335-8b15d27e03f9?auto=format&fit=crop&w=800&q=80",
          captionVi: "Giao diện Live Chat Hub 3 cột với danh sách hội thoại, nội dung chat và thông tin chi tiết khách hàng.",
          captionEn: "Live Chat Hub 3-column UI featuring conversation list, current chat area, and customer sidebar details."
        },
        videoUrl: "dQw4w9WgXcQ"
      }
    },
    {
      id: "rules",
      titleVi: "🤖 Quy tắc tự động",
      titleEn: "🤖 Auto-Reply Rules",
      icon: "🤖",
      content: {
        stepsVi: [
          "Truy cập Luật Auto-Reply và bấm nút 'Thêm luật phản hồi'.",
          "Nhập từ khóa kích hoạt (hỗ trợ so khớp tương đối) và nội dung văn bản phản hồi tự động.",
          "Bật/Tắt trạng thái hoạt động của luật bằng switch gạt nhanh trên card thông tin."
        ],
        stepsEn: [
          "Navigate to Auto-Reply Rules and click 'Add Rule'.",
          "Enter trigger keywords (supporting containment) and the automated response text.",
          "Toggle the rule status instantly using the cards switch."
        ],
        callouts: [
          { type: "danger", textVi: "Quan trọng: Hãy chắc chắn từ khóa không bị trùng lặp để tránh xung đột kịch bản phản hồi.", textEn: "Important: Ensure keywords do not duplicate to avoid scenario execution conflicts." }
        ],
        screenshot: {
          url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
          captionVi: "Giao diện quản lý các quy tắc trả lời tự động dựa trên từ khóa (Keyword Auto-Reply Rules).",
          captionEn: "Management workspace showing custom keyword-based auto-reply rules."
        },
        videoUrl: "dQw4w9WgXcQ"
      }
    },
    {
      id: "aiwriter",
      titleVi: "✍️ Tạo bài bằng AI",
      titleEn: "✍️ AI Content Writer",
      icon: "✍️",
      content: {
        stepsVi: [
          "Nhập chủ đề hoặc từ khóa chính của bài viết muốn tạo.",
          "Lựa chọn tông giọng viết (Hài hước, Chuyên nghiệp, Thuyết phục, v.v.).",
          "AI sẽ tự động soạn thảo nội dung kèm hashtag chuẩn SEO trong vài giây."
        ],
        stepsEn: [
          "Enter your post topic or target keywords.",
          "Choose the writing tone (Funny, Professional, Persuasive, etc.).",
          "The AI generates the text along with hashtags in seconds."
        ],
        callouts: [
          { type: "tip", textVi: "Mẹo: Bạn có thể chỉnh sửa lại bản nháp trước khi chuyển sang lịch đăng bài.", textEn: "Tip: You can edit the drafted text manually before sending it to the scheduler." }
        ],
        screenshot: {
          url: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80",
          captionVi: "Trình tạo bài viết AI hỗ trợ chọn tông giọng và sinh hashtag tự động.",
          captionEn: "AI writing assistant allowing tone selection and auto-generating relevant hashtags."
        },
        videoUrl: "dQw4w9WgXcQ"
      }
    },
    {
      id: "scheduler",
      titleVi: "📅 Lịch đăng bài",
      titleEn: "📅 Post Scheduler",
      icon: "📅",
      content: {
        stepsVi: [
          "Vào trang Lên lịch đăng bài, nhập nội dung bài viết và tải ảnh đính kèm (nếu có).",
          "Lựa chọn một hoặc nhiều Fanpages đích muốn xuất bản đồng thời.",
          "Chọn ngày giờ trong tương lai và nhấn 'Lên lịch'. Trình đăng bài chạy mỗi phút sẽ tự xuất bản."
        ],
        stepsEn: [
          "Go to the Post Scheduler page, enter your content and upload attachments.",
          "Select one or more destination pages to publish the post simultaneously.",
          "Pick a future publication date and time, and click 'Schedule'."
        ],
        callouts: [
          { type: "warning", textVi: "Lưu ý: Múi giờ đặt lịch mặc định được lấy từ Cấu hình Tài khoản của bạn.", textEn: "Warning: The default scheduling timezone is loaded from your Account Settings." }
        ],
        screenshot: {
          url: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80",
          captionVi: "Lịch lên lịch đăng bài trực quan hiển thị danh sách bài viết theo ngày/giờ.",
          captionEn: "Post scheduling interface displaying posts queue organized by publication dates."
        },
        videoUrl: "dQw4w9WgXcQ"
      }
    },
    {
      id: "autopublish",
      titleVi: "🔄 Đăng bài tự động AI",
      titleEn: "🔄 AI Auto Publisher",
      icon: "🔄",
      content: {
        stepsVi: [
          "Cấu hình tần suất đăng bài mong muốn (ví dụ: 1 bài / ngày).",
          "Lựa chọn các nguồn lấy tin hoặc nhập chủ đề lớn để AI học ngữ cảnh.",
          "Zeflyo sẽ tự động tạo bài viết mới và xuất bản theo đúng khung giờ vàng đã lên lịch."
        ],
        stepsEn: [
          "Configure target post frequency (e.g., 1 post per day).",
          "Select feed sources or input general topics for the AI learning engine.",
          "Zeflyo will automatically write and publish new content during golden hours."
        ],
        callouts: [
          { type: "tip", textVi: "Mẹo: Nên kết hợp với khung giờ vàng của Fanpage để tối ưu lượt tiếp cận.", textEn: "Tip: Connect to page golden hours metrics to optimize organic reach." }
        ],
        screenshot: {
          url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
          captionVi: "Cấu hình chiến dịch đăng bài tự động bằng AI, tự động lên lịch đăng bài theo chu kỳ.",
          captionEn: "AI Auto-publishing campaign setup dashboard configuring auto-writing rules."
        },
        videoUrl: "dQw4w9WgXcQ"
      }
    },
    {
      id: "settings",
      titleVi: "⚙️ Cài đặt & Tài khoản",
      titleEn: "⚙️ Settings & Account",
      icon: "⚙️",
      content: {
        stepsVi: [
          "Mở rộng cấu hình qua menu Cài đặt ở sidebar chính.",
          "Cập nhật thông tin hiển thị, đổi mật khẩu bảo mật và chọn múi giờ hiển thị dữ liệu.",
          "Chọn gói dịch vụ nâng cấp và xem thông tin giấy phép bản quyền đang dùng."
        ],
        stepsEn: [
          "Open the configuration menus from the main sidebar settings item.",
          "Update display name, password credentials and regional timezone.",
          "Select your subscription package and check license terms."
        ],
        callouts: [
          { type: "danger", textVi: "Quan trọng: Vui lòng lưu thông tin cấu hình trước khi rời khỏi trang.", textEn: "Important: Make sure to save changes before navigating away." }
        ],
        screenshot: {
          url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80",
          captionVi: "Giao diện Cài đặt tổng quan, nơi cập nhật hồ sơ, kết nối Facebook và nâng cấp gói.",
          captionEn: "System settings dashboard for profile updates, Facebook connections, and package upgrades."
        },
        videoUrl: "dQw4w9WgXcQ"
      }
    }
  ];

  const filteredChapters = chapters.filter(ch => 
    ch.titleVi.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ch.titleEn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleScrollToChapter = (id: string) => {
    setActiveChapter(id);
    const target = contentRefs.current[id];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto relative">
      
      {/* Search Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/5 pb-4 lg:pr-[280px]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            {lang === "en" ? "User Guide & Docs" : "Hướng dẫn sử dụng"}
          </h2>
          <p className="text-xs text-zinc-450 mt-1">
            {lang === "en" ? "Find step-by-step instructions for all features." : "Cẩm nang hướng dẫn sử dụng chi tiết và đầy đủ các tính năng trên Zeflyo."}
          </p>
        </div>

        {/* Real-time Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder={lang === "en" ? "Search topics..." : "Tìm kiếm hướng dẫn..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/5 focus:border-[#6C63FF]/50 rounded-xl pl-10 pr-4 py-2 text-xs outline-none transition-colors text-zinc-200 placeholder-zinc-500"
          />
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
        
        {/* Left Nav (Doc sidebar) */}
        <nav className="lg:col-span-4 glass-panel p-4 rounded-3xl border border-white/5 sticky top-6 max-h-[calc(100vh-180px)] overflow-y-auto custom-scrollbar flex flex-col gap-1.5">
          <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider px-2.5 mb-2">
            {lang === "en" ? "Documentation Table" : "Danh mục tài liệu"}
          </span>

          {filteredChapters.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-4">
              {lang === "en" ? "No topics matched" : "Không tìm thấy kết quả"}
            </p>
          ) : (
            filteredChapters.map((ch) => (
              <button
                key={ch.id}
                onClick={() => handleScrollToChapter(ch.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeChapter === ch.id
                    ? "bg-[#6C63FF]/10 text-white font-bold border-l-2 border-[#6C63FF]"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
                }`}
              >
                {lang === "en" ? ch.titleEn : ch.titleVi}
              </button>
            ))
          )}
        </nav>

        {/* Right Content Area */}
        <div className="lg:col-span-8 flex flex-col gap-12">
          {filteredChapters.map((ch) => (
            <div
              key={ch.id}
              id={ch.id}
              ref={(el) => { contentRefs.current[ch.id] = el; }}
              className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 scroll-mt-6 flex flex-col gap-6"
            >
              {/* Header Title */}
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                  {lang === "en" ? ch.titleEn : ch.titleVi}
                </h3>
              </div>



              {/* Step-by-Step guides */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                  {lang === "en" ? "Step-by-step instructions" : "Các bước thực hiện"}
                </span>
                <ol className="list-decimal pl-4 space-y-2.5 text-xs text-zinc-350 leading-relaxed">
                  {(lang === "en" ? ch.content.stepsEn : ch.content.stepsVi).map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>

              {/* Callouts */}
              {ch.content.callouts && ch.content.callouts.length > 0 && (
                <div className="flex flex-col gap-3 mt-2">
                  {ch.content.callouts.map((call, idx) => {
                    const isTip = call.type === "tip";
                    const isWarning = call.type === "warning";
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-3 shadow-inner ${
                          isTip
                            ? "bg-green-500/5 border-green-500/10 text-green-700 dark:text-green-300"
                            : isWarning
                              ? "bg-yellow-500/5 border-yellow-500/10 text-yellow-700 dark:text-yellow-300"
                              : "bg-red-500/5 border-red-500/10 text-red-700 dark:text-red-300"
                        }`}
                      >
                        {isTip ? (
                          <HelpCircle className="w-5 h-5 shrink-0 text-green-400 mt-0.5" />
                        ) : isWarning ? (
                          <AlertTriangle className="w-5 h-5 shrink-0 text-yellow-400 mt-0.5" />
                        ) : (
                          <AlertOctagon className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
                        )}
                        <div>
                          <span className="font-bold block uppercase text-[10px] tracking-wider mb-0.5">
                            {call.type === "tip" 
                              ? (lang === "en" ? "💡 Tip" : "💡 Mẹo") 
                              : call.type === "warning"
                                ? (lang === "en" ? "⚠️ Warning" : "⚠️ Lưu ý")
                                : (lang === "en" ? "🚨 Important" : "🚨 Quan trọng")}
                          </span>
                          {lang === "en" ? call.textEn : call.textVi}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Screenshot Image with Caption */}
              {ch.content.screenshot && (
                <div className="mt-4 border-t border-white/5 pt-4 flex flex-col gap-2">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                    {lang === "en" ? "Screenshot illustration" : "Hình ảnh minh họa"}
                  </span>
                  <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-white/5 bg-zinc-950/40">
                    <img
                      src={ch.content.screenshot.url}
                      alt={lang === "en" ? ch.content.screenshot.captionEn : ch.content.screenshot.captionVi}
                      className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 italic text-center">
                    {lang === "en" ? ch.content.screenshot.captionEn : ch.content.screenshot.captionVi}
                  </span>
                </div>
              )}

              {/* Video Embed Toggle Interface */}
              {ch.content.videoUrl && (
                <div className="mt-2 flex flex-col gap-3">
                  {!activeVideos[ch.id] ? (
                    <button
                      onClick={() => toggleVideo(ch.id)}
                      className="w-fit flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/15 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all active:scale-95 cursor-pointer shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-red-400/20" />
                      <span>{lang === "en" ? "Watch Video Guide →" : "Xem video hướng dẫn →"}</span>
                    </button>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => toggleVideo(ch.id)}
                        className="w-fit flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all active:scale-95 cursor-pointer"
                      >
                        <span>{lang === "en" ? "Close Video" : "Đóng video"}</span>
                      </button>
                      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/5 bg-black shadow-lg">
                        <iframe
                          src={`https://www.youtube.com/embed/${ch.content.videoUrl}`}
                          title={lang === "en" ? ch.titleEn : ch.titleVi}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="absolute inset-0 w-full h-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          ))}
        </div>

      </div>



      {/* Floating Scroll Top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all cursor-pointer animate-float"
          title={lang === "en" ? "Scroll to Top" : "Quay lại đầu trang"}
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

    </div>
  );
}
