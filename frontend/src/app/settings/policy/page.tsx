"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Printer, 
  FileText, 
  Shield, 
  Scale, 
  DollarSign, 
  ChevronRight,
  ArrowUp
} from "lucide-react";

interface PolicySection {
  id: string;
  titleVi: string;
  titleEn: string;
  contentVi: React.ReactNode;
  contentEn: React.ReactNode;
}

interface PolicyTab {
  id: string;
  titleVi: string;
  titleEn: string;
  icon: React.ComponentType<any>;
  sections: PolicySection[];
}

export default function PolicyPage() {
  const [lang, setLang] = useState<"en" | "vi">("vi");
  const [activeTab, setActiveTab] = useState("privacy");
  const [activeSection, setActiveSection] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

  // Intersection Observer to highlight the active heading on scroll
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-15% 0px -70% 0px",
      threshold: 0
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    // Observe active tab's sections
    const currentTabObj = policyTabs.find(t => t.id === activeTab);
    if (currentTabObj) {
      currentTabObj.sections.forEach(sec => {
        const el = sectionRefs.current[`${activeTab}-${sec.id}`];
        if (el) observer.observe(el);
      });
    }

    return () => observer.disconnect();
  }, [activeTab]);

  // Scroll to top display detection
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleScrollToSection = (sectionId: string) => {
    const fullId = `${activeTab}-${sectionId}`;
    setActiveSection(fullId);
    const target = sectionRefs.current[fullId];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const policyTabs: PolicyTab[] = [
    {
      id: "privacy",
      titleVi: "Chính sách Bảo mật",
      titleEn: "Privacy Policy",
      icon: Shield,
      sections: [
        {
          id: "intro",
          titleVi: "1. Giới thiệu tổng quan",
          titleEn: "1. Overview & Introduction",
          contentVi: (
            <p>
              Chào mừng bạn đến với Zeflyo Hub. Chúng tôi cam kết bảo vệ thông tin cá nhân và dữ liệu liên kết từ tài khoản mạng xã hội (đặc biệt là Facebook API) của bạn. Chính sách Bảo mật này giải thích cách chúng tôi thu thập, sử dụng, bảo mật và chia sẻ thông tin khi bạn đăng ký sử dụng nền tảng Zeflyo.
            </p>
          ),
          contentEn: (
            <p>
              Welcome to Zeflyo Hub. We are fully committed to protecting your personal information and social media API data (especially Facebook API integration). This Privacy Policy explains how we collect, use, store, and share your information when you register and use the Zeflyo platform.
            </p>
          )
        },
        {
          id: "collection",
          titleVi: "2. Dữ liệu chúng tôi thu thập",
          titleEn: "2. Data We Collect",
          contentVi: (
            <div className="space-y-3">
              <p>Chúng tôi thu thập các loại dữ liệu sau để phục vụ tính năng tự động phản hồi tin nhắn:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Thông tin tài khoản:</strong> Tên hiển thị, địa chỉ Email và Múi giờ hệ thống của bạn.</li>
                <li><strong>Facebook OAuth Tokens:</strong> Access tokens tạm thời để truy cập danh sách Fanpage và gửi câu trả lời tự động.</li>
                <li><strong>Dữ liệu hội thoại:</strong> Nội dung tin nhắn và bình luận mới nhất từ các Fanpage được kích hoạt để AI xử lý phản hồi.</li>
              </ul>
            </div>
          ),
          contentEn: (
            <div className="space-y-3">
              <p>We collect the following types of data to operate the AI auto-reply functionality:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Account details:</strong> Display name, Email address, and system Timezone.</li>
                <li><strong>Facebook OAuth Tokens:</strong> Temporary Access Tokens to list Fanpages and authorize automated responses.</li>
                <li><strong>Conversation details:</strong> Latest messages and comments from connected Fanpages for AI context processing.</li>
              </ul>
            </div>
          )
        },
        {
          id: "usage",
          titleVi: "3. Cách thức sử dụng thông tin",
          titleEn: "3. How We Use Your Data",
          contentVi: (
            <div className="space-y-3">
              <p>Zeflyo sử dụng thông tin của bạn vào các mục đích cụ thể:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Vận hành các kịch bản auto-reply tự động đã được người dùng thiết lập.</li>
                <li>Gửi dữ liệu hội thoại đến mô hình trí tuệ nhân tạo Gemini API để tạo nội dung trả lời tối ưu nhất.</li>
                <li>Gửi thông báo hệ thống, cập nhật bảng giá và xác nhận thanh toán/hoàn tiền.</li>
              </ul>
            </div>
          ),
          contentEn: (
            <div className="space-y-3">
              <p>Zeflyo utilizes your information for targeted purposes:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Operating automated auto-reply rules configured by the user.</li>
                <li>Sending conversation text to Gemini AI model APIs to generate optimized responses.</li>
                <li>Sending system notifications, billing updates, and payment/refund invoices.</li>
              </ul>
            </div>
          )
        },
        {
          id: "protection",
          titleVi: "4. Bảo mật & Lưu trữ",
          titleEn: "4. Data Security & Storage",
          contentVi: (
            <p>
              Tất cả các token liên kết Facebook và mật khẩu người dùng đều được mã hóa bằng chuẩn AES-256 trước khi lưu trữ trong cơ sở dữ liệu. Chúng tôi sử dụng cơ chế xác thực Sanctum an toàn cho các phiên gọi API từ frontend. Mọi kết nối đều bắt buộc đi qua giao thức truyền tải siêu văn bản an toàn HTTPS.
            </p>
          ),
          contentEn: (
            <p>
              All Facebook integration tokens and account passwords are encrypted using AES-256 encryption standards before database storage. We implement secure Laravel Sanctum session-based authentication for API calls. All traffic is strictly transmitted through HTTPS secure communication.
            </p>
          )
        },
        {
          id: "rights",
          titleVi: "5. Quyền kiểm soát của người dùng",
          titleEn: "5. User Controls & Rights",
          contentVi: (
            <p>
              Bạn có toàn quyền hủy liên kết tài khoản Facebook bất kỳ lúc nào trực tiếp trong trang Cài đặt Tổng quan. Khi bạn hủy kết nối, toàn bộ Access Token liên quan sẽ bị xóa vĩnh viễn khỏi hệ thống của chúng tôi. Bạn cũng có thể yêu cầu xóa hoàn toàn tài khoản Zeflyo bằng cách liên hệ bộ phận hỗ trợ.
            </p>
          ),
          contentEn: (
            <p>
              You have full rights to disconnect your Facebook integration at any time directly through the General Settings page. When disconnected, all related Facebook Access Tokens are permanently purged from our database. You can also request complete account deletion via support channels.
            </p>
          )
        }
      ]
    },
    {
      id: "terms",
      titleVi: "Điều khoản Sử dụng",
      titleEn: "Terms of Service",
      icon: Scale,
      sections: [
        {
          id: "acceptance",
          titleVi: "1. Chấp nhận các điều khoản",
          titleEn: "1. Acceptance of Terms",
          contentVi: (
            <p>
              Bằng việc đăng ký tài khoản Zeflyo, bạn đồng ý tuân thủ tuyệt đối các điều khoản sử dụng được quy định dưới đây. Nếu bạn không đồng ý với bất kỳ phần nào của điều khoản này, vui lòng ngừng sử dụng dịch vụ của chúng tôi ngay lập tức.
            </p>
          ),
          contentEn: (
            <p>
              By registering an account with Zeflyo, you agree to fully comply with all the terms and conditions outlined below. If you disagree with any section of these terms, please stop using our services immediately.
            </p>
          )
        },
        {
          id: "responsibilities",
          titleVi: "2. Trách nhiệm của chủ tài khoản",
          titleEn: "2. Account Owner Responsibilities",
          contentVi: (
            <p>
              Bạn tự chịu trách nhiệm bảo mật thông tin đăng nhập và mật khẩu của mình. Bạn cam kết không sử dụng Zeflyo vào các mục đích vi phạm pháp luật Việt Nam và quốc tế, không spam tin nhắn rác hoặc tự động hóa gửi thông tin lừa đảo đến khách hàng trên Facebook.
            </p>
          ),
          contentEn: (
            <p>
              You are solely responsible for securing your login credentials and passwords. You commit to not using Zeflyo for activities that violate domestic or international law, spamming customers, or sending fraudulent automated messages.
            </p>
          )
        },
        {
          id: "compliance",
          titleVi: "3. Tuân thủ chính sách Meta (Facebook)",
          titleEn: "3. Compliance with Meta Policies",
          contentVi: (
            <p>
              Người dùng sử dụng module tự động trả lời của Zeflyo phải nghiêm túc tuân thủ Chính sách Nền tảng của Meta (Facebook Platform Terms & Developer Policies). Zeflyo không chịu trách nhiệm trong trường hợp Fanpage của bạn bị khóa hoặc bị giới hạn quyền nhắn tin do vi phạm chính sách gửi tin nhắn trong vòng 24h của Meta.
            </p>
          ),
          contentEn: (
            <p>
              Users deploying Zeflyo's automated response workflows must strictly follow the Meta Platform Terms and Developer Policies. Zeflyo accepts no liability if your Facebook page is restricted or banned due to violating Meta's 24-hour standard messaging policy limit.
            </p>
          )
        },
        {
          id: "sla",
          titleVi: "4. Tính sẵn sàng & Giới hạn dịch vụ",
          titleEn: "4. Availability & SLA Limits",
          contentVi: (
            <p>
              Zeflyo cố gắng duy trì thời gian hoạt động trực tuyến (Uptime) ở mức 99.9%. Tuy nhiên, chúng tôi có quyền tạm ngừng hệ thống để bảo trì định kỳ hoặc do sự cố kỹ thuật từ phía nhà cung cấp hạ tầng đám mây và sự thay đổi đột ngột trong cấu trúc API của Facebook.
            </p>
          ),
          contentEn: (
            <p>
              Zeflyo strives to maintain an online system availability (Uptime) of 99.9%. However, we reserve the right to temporarily pause services for scheduled maintenance, cloud infrastructure outages, or sudden unexpected changes in the Facebook API schemas.
            </p>
          )
        }
      ]
    },
    {
      id: "refund",
      titleVi: "Chính sách Hoàn tiền",
      titleEn: "Refund Policy",
      icon: DollarSign,
      sections: [
        {
          id: "eligibility",
          titleVi: "1. Điều kiện áp dụng hoàn tiền",
          titleEn: "1. Refund Eligibility Conditions",
          contentVi: (
            <p>
              Chúng tôi áp dụng chính sách hoàn tiền cho tất cả các khách hàng mua gói dịch vụ trả phí (Pro hoặc Business) trong vòng <strong>7 ngày đầu tiên</strong> kể từ thời điểm thanh toán thành công nếu hệ thống gặp lỗi nghiêm trọng kéo dài mà đội ngũ hỗ trợ không thể khắc phục được.
            </p>
          ),
          contentEn: (
            <p>
              We offer a full refund guarantee to all subscribers purchasing premium packages (Pro or Business) within the <strong>first 7 days</strong> of successful payment if the system encounters critical bugs that our support team cannot resolve.
            </p>
          )
        },
        {
          id: "nonrefundable",
          titleVi: "2. Các trường hợp không được hoàn tiền",
          titleEn: "2. Non-Refundable Situations",
          contentVi: (
            <div className="space-y-3">
              <p>Zeflyo có quyền từ chối yêu cầu hoàn tiền trong các tình huống sau:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Yêu cầu hoàn tiền được gửi sau 7 ngày kể từ ngày thanh toán.</li>
                <li>Tài khoản bị khóa do vi phạm Điều khoản Sử dụng hoặc chính sách cộng đồng của Meta.</li>
                <li>Người dùng tự ý thay đổi ý định và không muốn sử dụng dịch vụ nữa mà không có lỗi kỹ thuật rõ ràng.</li>
              </ul>
            </div>
          ),
          contentEn: (
            <div className="space-y-3">
              <p>Zeflyo reserves the right to refuse refunds in the following instances:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>The request is initiated after the 7-day payment window has elapsed.</li>
                <li>The account is suspended due to Terms of Service violations or Meta community guidelines breach.</li>
                <li>Change of mind by the user without any identified technical malfunction on our end.</li>
              </ul>
            </div>
          )
        },
        {
          id: "process",
          titleVi: "3. Quy trình gửi yêu cầu",
          titleEn: "3. Refund Request Process",
          contentVi: (
            <p>
              Để yêu cầu hoàn tiền, vui lòng gửi email về địa chỉ <strong>billing@zeflyo.vn</strong> hoặc mở chatbox hỗ trợ kỹ thuật. Vui lòng cung cấp mã giao dịch thanh toán, tên tài khoản Zeflyo và mô tả chi tiết lý do/vấn đề kỹ thuật gặp phải kèm hình ảnh minh họa.
            </p>
          ),
          contentEn: (
            <p>
              To request a refund, please email <strong>billing@zeflyo.vn</strong> or open a tech-support ticket. Make sure to provide the payment transaction ID, your registered account username, and a description of the technical issues encountered (with attachments).
            </p>
          )
        },
        {
          id: "timeframe",
          titleVi: "4. Thời gian giải quyết & Chuyển khoản",
          titleEn: "4. Processing Timeframe",
          contentVi: (
            <p>
              Bộ phận tài chính sẽ phản hồi và giải quyết yêu cầu của bạn trong vòng 3 ngày làm việc. Nếu được phê duyệt, số tiền hoàn trả sẽ được chuyển vào tài khoản ngân hàng hoặc ví điện tử ban đầu của bạn trong vòng 5 đến 7 ngày làm việc tùy thuộc vào ngân hàng thụ hưởng.
            </p>
          ),
          contentEn: (
            <p>
              Our billing department will process and reply to your request within 3 business days. Once approved, the refunded amount will be transferred back to your original payment method within 5 to 7 business days, depending on bank processing speeds.
            </p>
          )
        }
      ]
    }
  ];

  const currentTabObj = policyTabs.find(t => t.id === activeTab) || policyTabs[0];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto relative print:p-0 print:m-0 print:max-w-none">
      
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4 lg:pr-[280px] print:hidden">
        <div>
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            {lang === "en" ? "Legal Policies & Terms" : "Chính sách & Điều khoản"}
          </h2>
          <p className="text-xs text-zinc-450 mt-1">
            {lang === "en" ? "Read and download our privacy policy, refund policy, and terms of service." : "Xem và tải về các điều khoản pháp lý, bảo mật và chính sách hoàn tiền của Zeflyo."}
          </p>
        </div>

        {/* Print Button */}
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 py-2 px-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-zinc-300 hover:text-white text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-md shadow-black/20"
        >
          <Printer className="w-4 h-4 text-[#6C63FF]" />
          <span>{lang === "en" ? "Print Documents" : "Tải PDF / In trang"}</span>
        </button>
      </div>

      {/* Printable Heading (Only visible when printing) */}
      <div className="hidden print:block border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-bold text-black uppercase tracking-tight text-center">
          Zeflyo Hub — {lang === "en" ? currentTabObj.titleEn : currentTabObj.titleVi}
        </h1>
        <p className="text-center text-xs text-zinc-600 mt-1">
          {lang === "en" ? "Official Document. Printed on " : "Văn bản chính thức. Ngày in: "}
          {new Date().toLocaleDateString("vi-VN")}
        </p>
      </div>

      {/* Pill-shaped tab selectors */}
      <div className="flex flex-wrap gap-2.5 p-1 rounded-2xl bg-zinc-950/40 border border-white/5 w-fit print:hidden">
        {policyTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                // Clear active section so TOC updates immediately
                setActiveSection("");
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/20"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{lang === "en" ? tab.titleEn : tab.titleVi}</span>
            </button>
          );
        })}
      </div>

      {/* Double Column Grid: TOC + Document Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative mt-4">
        
        {/* Sticky Table of Contents (TOC) */}
        <nav className="lg:col-span-4 glass-panel p-4 rounded-3xl border border-white/5 sticky top-6 max-h-[calc(100vh-180px)] overflow-y-auto custom-scrollbar flex flex-col gap-1 px-2 print:hidden">
          <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider px-2.5 mb-2 block">
            {lang === "en" ? "Document Sections" : "Mục lục văn bản"}
          </span>

          {currentTabObj.sections.map((sec) => {
            const isSecActive = activeSection === `${activeTab}-${sec.id}`;
            return (
              <button
                key={sec.id}
                onClick={() => handleScrollToSection(sec.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between group ${
                  isSecActive
                    ? "bg-[#6C63FF]/10 text-white font-bold border-l-2 border-[#6C63FF]"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
                }`}
              >
                <span className="truncate mr-2">
                  {lang === "en" ? sec.titleEn : sec.titleVi}
                </span>
                <ChevronRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ${isSecActive ? "text-[#6C63FF]" : "text-zinc-500"}`} />
              </button>
            );
          })}
        </nav>

        {/* Policy document content */}
        <div className="lg:col-span-8 flex flex-col gap-6 print:col-span-12 print:gap-4 print:text-black">
          {currentTabObj.sections.map((sec) => {
            const fullId = `${activeTab}-${sec.id}`;
            return (
              <div
                key={sec.id}
                id={fullId}
                ref={(el) => { sectionRefs.current[fullId] = el; }}
                className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 scroll-mt-6 flex flex-col gap-4 print:bg-white print:border-none print:shadow-none print:p-0 print:text-black"
              >
                {/* Heading */}
                <h3 className="text-base font-bold text-white border-b border-white/5 pb-2.5 print:text-black print:border-black/10">
                  {lang === "en" ? sec.titleEn : sec.titleVi}
                </h3>

                {/* Body paragraph */}
                <div className="text-xs text-zinc-350 leading-relaxed space-y-3 print:text-black font-sans">
                  {lang === "en" ? sec.contentEn : sec.contentVi}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Floating Scroll to Top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-[#6C63FF] hover:bg-[#584feb] text-white shadow-lg shadow-[#6C63FF]/20 active:scale-95 transition-all cursor-pointer print:hidden"
          title={lang === "en" ? "Scroll to Top" : "Quay lại đầu trang"}
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

    </div>
  );
}
