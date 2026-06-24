"use client";

import React, { useState, useEffect } from "react";
import { 
  Loader2, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  Download, 
  Printer, 
  X, 
  ArrowRight,
  FileText,
  CreditCard,
  AlertTriangle
} from "lucide-react";

interface PaymentRecord {
  id: number;
  user_id: number;
  code: string;
  plan_id: string;
  cycle: string | null;
  amount: number;
  status: "pending" | "completed" | "failed" | "cancelled";
  created_at: string;
  updated_at: string;
}

export default function BillingPage() {
  const [lang, setLang] = useState<"en" | "vi">("vi");
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [userProfile, setUserProfile] = useState<{ display_name?: string; email?: string } | null>(null);

  const fetchPaymentsAndProfile = async () => {
    setLoading(true);
    const savedToken = localStorage.getItem("zeflyo_token");
    const savedApiBase = localStorage.getItem("zeflyo_api_base") || "http://localhost";
    
    // Retrieve profile details to display on invoice
    const savedUser = localStorage.getItem("zeflyo_user");
    if (savedUser) {
      try {
        setUserProfile(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }

    if (!savedToken || savedToken.startsWith("mock_")) {
      // Setup premium mock payments list for developer sandbox testing
      setTimeout(() => {
        const mockPayments: PaymentRecord[] = [
          {
            id: 101,
            user_id: 1,
            code: "ZF8B3K5D",
            plan_id: "pro",
            cycle: "3months",
            amount: 489000,
            status: "completed",
            created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
            updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 102,
            user_id: 1,
            code: "ZF2W9N7P",
            plan_id: "credit_standard",
            cycle: null,
            amount: 55000,
            status: "completed",
            created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
            updated_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 103,
            user_id: 1,
            code: "ZF9R2M4X",
            plan_id: "basic",
            cycle: "monthly",
            amount: 79000,
            status: "pending",
            created_at: new Date().toISOString(), // today
            updated_at: new Date().toISOString()
          }
        ];
        setPayments(mockPayments);
        setLoading(false);
      }, 800);
      return;
    }

    try {
      const res = await fetch(`${savedApiBase}/api/user/payments`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${savedToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPayments(data.payments);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedLang = localStorage.getItem("zeflyo_lang") || "vi";
    setLang(savedLang as "en" | "vi");

    const handleLangChange = () => {
      const updatedLang = localStorage.getItem("zeflyo_lang") || "vi";
      setLang(updatedLang as "en" | "vi");
    };

    window.addEventListener("zeflyo_lang_changed", handleLangChange);
    fetchPaymentsAndProfile();

    return () => {
      window.removeEventListener("zeflyo_lang_changed", handleLangChange);
    };
  }, []);

  const getPlanTitle = (planId: string, cycle: string | null) => {
    if (planId.startsWith("credit_")) {
      switch (planId) {
        case "credit_savings": return lang === "en" ? "Savings Package (300 pts)" : "Gói Tiết Kiệm (300 điểm)";
        case "credit_standard": return lang === "en" ? "Standard Package (700 pts)" : "Gói Tiêu Chuẩn (700 điểm)";
        case "credit_premium": return lang === "en" ? "Premium Package (2000 pts)" : "Gói Cao Cấp (2000 điểm)";
        case "credit_enterprise": return lang === "en" ? "Enterprise Package (5000 pts)" : "Gói Doanh Nghiệp (5000 điểm)";
        default: return planId.toUpperCase();
      }
    }

    const name = planId === "basic" ? (lang === "en" ? "Basic Plan" : "Gói Cơ Bản") :
                 planId === "pro" ? (lang === "en" ? "Professional Plan" : "Gói Chuyên Nghiệp") :
                 planId === "premium" ? (lang === "en" ? "Premium Plan" : "Gói Cao Cấp") : planId.toUpperCase();

    if (!cycle) return name;
    const cycleText = cycle === "monthly" ? (lang === "en" ? "Monthly" : "Theo Tháng") :
                      cycle === "3months" ? (lang === "en" ? "3 Months" : "3 Tháng") :
                      cycle === "yearly" ? (lang === "en" ? "Yearly" : "Theo Năm") : cycle;

    return `${name} (${cycleText})`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = (payment?: PaymentRecord) => {
    const activePayment = payment || selectedPayment;
    if (!activePayment) return;

    const invoiceCode = activePayment.code;
    const dateFormatted = new Date(activePayment.created_at).toLocaleDateString(lang === "en" ? "en-US" : "vi-VN", {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
    const buyerName = userProfile?.display_name || (lang === "en" ? "Zeflyo Customer" : "Khách hàng Zeflyo");
    const buyerEmail = userProfile?.email || "customer@zeflyo.com";
    
    let paymentStatus = "";
    if (activePayment.status === "completed") {
      paymentStatus = lang === "en" ? "PAID" : "ĐÃ THANH TOÁN";
    } else if (activePayment.status === "pending") {
      paymentStatus = lang === "en" ? "PENDING" : "CHỜ THANH TOÁN";
    } else if (activePayment.status === "cancelled") {
      paymentStatus = lang === "en" ? "CANCELLED" : "ĐÃ HUỶ";
    } else {
      paymentStatus = lang === "en" ? "EXPIRED" : "QUÁ HẠN";
    }

    const itemTitle = getPlanTitle(activePayment.plan_id, activePayment.cycle);
    const amount = activePayment.amount;

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          td { font-family: 'Arial', sans-serif; font-size: 10pt; vertical-align: middle; }
          .header-title { font-size: 16pt; font-weight: bold; color: #1e293b; text-align: center; }
          .section-title { font-size: 11pt; font-weight: bold; color: #475569; background-color: #f1f5f9; }
          .table-header { font-weight: bold; color: #ffffff; background-color: #4f46e5; border: 1px solid #cbd5e1; text-align: center; }
          .table-cell { border: 1px solid #e2e8f0; }
          .number { text-align: right; }
          .paid { color: #16a34a; font-weight: bold; }
          .pending { color: #ca8a04; font-weight: bold; }
          .cancelled { color: #dc2626; font-weight: bold; }
          .total { font-weight: bold; color: #4f46e5; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="5" class="header-title">HÓA ĐƠN CHI TIẾT / OFFICIAL INVOICE</td>
          </tr>
          <tr>
            <td colspan="5" style="text-align: center; font-size: 9pt; color: #64748b;">Mã đơn hàng: #${invoiceCode} | Ngày lập: ${dateFormatted}</td>
          </tr>
          <tr><td colspan="5"></td></tr>
          
          <tr class="section-title">
            <td colspan="2">ĐƠN VỊ CUNG CẤP</td>
            <td></td>
            <td colspan="2">THÔNG TIN KHÁCH HÀNG</td>
          </tr>
          <tr>
            <td colspan="2"><b>CÔNG TY CỔ PHẦN ZEFLYO</b></td>
            <td></td>
            <td colspan="2"><b>${buyerName}</b></td>
          </tr>
          <tr>
            <td colspan="2">Mã số thuế: 0317926888</td>
            <td></td>
            <td colspan="2">Email: ${buyerEmail}</td>
          </tr>
          <tr>
            <td colspan="2">Địa chỉ: Tòa nhà Zeflyo Tower, Quận 1, TP. HCM</td>
            <td></td>
            <td colspan="2">Trạng thái: <span class="${activePayment.status === "completed" ? "paid" : activePayment.status === "pending" ? "pending" : "cancelled"}">${paymentStatus}</span></td>
          </tr>
          <tr><td colspan="5"></td></tr>

          <tr class="table-header">
            <td colspan="2">Tên sản phẩm / Dịch vụ</td>
            <td>Số lượng</td>
            <td>Đơn giá (VND)</td>
            <td>Thành tiền (VND)</td>
          </tr>
          <tr>
            <td colspan="2" class="table-cell">${itemTitle}</td>
            <td class="table-cell" style="text-align: center;">1</td>
            <td class="table-cell number">${amount}</td>
            <td class="table-cell number">${amount}</td>
          </tr>
          <tr><td colspan="5"></td></tr>

          <tr>
            <td colspan="3"></td>
            <td style="font-weight: bold; background-color: #f8fafc;">Tạm tính:</td>
            <td class="number" style="font-weight: bold;">${amount}</td>
          </tr>
          <tr>
            <td colspan="3"></td>
            <td style="font-weight: bold; background-color: #f8fafc;">Thuế GTGT (0%):</td>
            <td class="number" style="font-weight: bold;">0</td>
          </tr>
          <tr>
            <td colspan="3"></td>
            <td style="font-weight: bold; background-color: #f1f5f9;" class="total">Tổng thanh toán:</td>
            <td class="number" style="font-weight: bold; background-color: #f1f5f9; color: #4f46e5;">${amount}</td>
          </tr>
          <tr><td colspan="5"></td></tr>
          
          <tr>
            <td colspan="5" style="font-size: 8pt; color: #94a3b8; font-style: italic; text-align: center;">
              Cảm ơn bạn đã tin dùng Zeflyo! Hóa đơn này được tạo tự động từ hệ thống.
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `HoaDon_Zeflyo_${invoiceCode}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCancelPendingPayment = async (paymentId: number) => {
    const savedToken = localStorage.getItem("zeflyo_token");
    const savedApiBase = localStorage.getItem("zeflyo_api_base") || "http://localhost";

    if (!savedToken || savedToken.startsWith("mock_")) {
      // Mock mode: Update frontend local state directly
      setPayments(prev =>
        prev.map(p => p.id === paymentId ? { ...p, status: "failed" as const } : p)
      );
      setSelectedPayment(prev =>
        prev && prev.id === paymentId ? { ...prev, status: "failed" as const } : prev
      );
      return;
    }

    try {
      const res = await fetch(`${savedApiBase}/api/payments/${paymentId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${savedToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPayments(prev =>
            prev.map(p => p.id === paymentId ? { ...p, status: "failed" as const } : p)
          );
          setSelectedPayment(prev =>
            prev && prev.id === paymentId ? { ...prev, status: "failed" as const } : prev
          );
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto print:p-0">
      
      {/* Header */}
      <div className="print:hidden">
        <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
          {lang === "en" ? "Purchase History" : "Lịch sử mua hàng"}
        </h2>
        <p className="text-xs text-zinc-455 mt-1">
          {lang === "en" 
            ? "Manage your purchase history and download detailed invoices for your subscription packages." 
            : "Quản lý lịch sử mua hàng của bạn và tải xuống các hóa đơn chi tiết cho gói dịch vụ."}
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-450 print:hidden">
          <Loader2 className="w-8 h-8 animate-spin text-[#6C63FF]" />
          <span className="text-xs">{lang === "en" ? "Loading purchase history..." : "Đang tải lịch sử mua hàng..."}</span>
        </div>
      ) : payments.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-white/5 bg-zinc-900/30 text-center flex flex-col items-center gap-4 print:hidden">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/40 border border-white/5 flex items-center justify-center text-zinc-500">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-300">
              {lang === "en" ? "No purchase history found" : "Chưa có lịch sử mua hàng"}
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
              {lang === "en" 
                ? "You haven't made any purchases yet. Your subscription packages will appear here." 
                : "Tài khoản của bạn chưa có bất kỳ giao dịch nâng cấp nào. Các đơn hàng sẽ hiển thị tại đây."}
            </p>
          </div>
          <a
            href="/settings/pricing"
            className="px-4 py-2 bg-[#6C63FF] hover:bg-[#584feb] text-white text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center gap-1.5 shadow-lg shadow-[#6C63FF]/15"
          >
            <span>{lang === "en" ? "View Pricing Table" : "Xem bảng giá dịch vụ"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden bg-zinc-900/30 print:hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-zinc-950/40 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-5">{lang === "en" ? "Date" : "Ngày tạo"}</th>
                  <th className="p-5">{lang === "en" ? "Invoice Code" : "Mã đơn hàng"}</th>
                  <th className="p-5">{lang === "en" ? "Subscription / Plan" : "Gói dịch vụ"}</th>
                  <th className="p-5">{lang === "en" ? "Amount" : "Số tiền"}</th>
                  <th className="p-5 text-center">{lang === "en" ? "Status" : "Trạng thái"}</th>
                  <th className="p-5 text-right">{lang === "en" ? "Invoice" : "Hóa đơn"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {payments.map((p) => {
                  const isCompleted = p.status === "completed";
                  const isPending = p.status === "pending";
                  
                  return (
                    <tr key={p.id} className="hover:bg-white/[0.01] transition-all">
                      {/* Date */}
                      <td className="p-5 font-mono text-zinc-400">
                        {new Date(p.created_at).toLocaleDateString(lang === "en" ? "en-US" : "vi-VN", {
                          year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      
                      {/* Invoice Code */}
                      <td className="p-5">
                        <span className="font-extrabold text-white font-mono bg-zinc-950/40 px-2.5 py-1 rounded-lg border border-white/5">
                          {p.code}
                        </span>
                      </td>

                      {/* Plan / Package */}
                      <td className="p-5">
                        <span className="font-semibold text-zinc-200">
                          {getPlanTitle(p.plan_id, p.cycle)}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="p-5">
                        <span className="font-black text-[#6C63FF]">
                          {p.amount} VND
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isCompleted
                              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                              : isPending
                              ? "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400"
                              : "bg-red-500/10 border border-red-500/20 text-red-400"
                          }`}>
                            {isCompleted ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : isPending ? (
                              <Clock className="w-3 h-3" />
                            ) : (
                              <X className="w-3 h-3" />
                            )}
                            {p.status === "completed" ? (lang === "en" ? "Paid" : "Đã thanh toán") :
                             p.status === "pending" ? (lang === "en" ? "Pending" : "Chờ thanh toán") : (lang === "en" ? "Cancelled" : "Đã huỷ")}
                          </span>
                          {p.status === "failed" && (
                            <span className="text-[10px] text-zinc-500 font-medium">
                              {lang === "en" ? "Payment timeout" : "Quá thời gian chờ"}
                            </span>
                          )}
                          {p.status === "cancelled" && (
                            <span className="text-[10px] text-zinc-500 font-medium">
                              {lang === "en" ? "Cancelled by user" : "Người dùng huỷ"}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Invoice details button */}
                      <td className="p-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedPayment(p);
                              setShowInvoiceModal(true);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[10px] font-bold transition-all cursor-pointer border border-white/5 flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            <span>{lang === "en" ? "Details" : "Xem chi tiết"}</span>
                          </button>

                          <button
                            onClick={() => handleExportExcel(p)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            <span>{lang === "en" ? "Excel" : "Xuất Excel"}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      {showInvoiceModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn print:static print:bg-white print:p-0 print:backdrop-blur-none">
          <div className="glass-panel w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] print:max-h-full print:border-none print:shadow-none print:bg-white print:text-black">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-zinc-900/60 print:hidden">
              <span className="text-xs uppercase font-extrabold text-zinc-455 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-[#6C63FF]" />
                {lang === "en" ? "Official Invoice" : "Chi tiết hoá đơn điện tử"}
              </span>
              <button 
                onClick={() => setShowInvoiceModal(false)}
                className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Invoice Body */}
            <div className="p-8 flex-1 overflow-y-auto flex flex-col gap-8 bg-zinc-950 print:bg-white print:text-black print:overflow-visible">
              
              {/* Corporate Info Header */}
              <div className="flex justify-between items-start gap-4 border-b border-white/5 pb-6 print:border-zinc-200">
                <div className="flex flex-col gap-1">
                  <span className="text-xl font-black tracking-tight text-white print:text-black">
                    ZEFLYO<span className="text-[#6C63FF]">.COM</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider print:text-zinc-600">
                    CÔNG TY CỔ PHẦN ZEFLYO
                  </span>
                  <span className="text-[10px] text-zinc-400 leading-relaxed max-w-[280px] mt-1 print:text-zinc-700">
                    Địa chỉ: Tòa nhà Zeflyo Tower, Đường 26/02, Quận 1, Thành phố Hồ Chí Minh, Việt Nam
                  </span>
                  <span className="text-[10px] text-zinc-400 print:text-zinc-700">
                    Mã số thuế: 0317926888
                  </span>
                </div>

                <div className="text-right flex flex-col gap-1">
                  <span className="text-lg font-black text-white uppercase tracking-wider print:text-black">
                    INVOICE
                  </span>
                  <span className="text-xs text-[#6C63FF] font-mono font-bold tracking-wider">
                    #{selectedPayment.code}
                  </span>
                  <span className="text-[10px] text-zinc-500 print:text-zinc-600">
                    {lang === "en" ? "Date: " : "Ngày lập: "}
                    {new Date(selectedPayment.created_at).toLocaleDateString(lang === "en" ? "en-US" : "vi-VN", {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Billed To / Payment Method */}
              <div className="grid grid-cols-2 gap-6 bg-zinc-900/40 p-5 rounded-2xl border border-white/5 print:bg-zinc-50 print:border-zinc-200 print:text-black">
                <div className="flex flex-col">
                  <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider">
                    {lang === "en" ? "Billed To" : "Khách hàng"}
                  </span>
                  <span className="text-xs font-bold text-white mt-1 print:text-black">
                    {userProfile?.display_name || (lang === "en" ? "Zeflyo Customer" : "Khách hàng Zeflyo")}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono mt-0.5 print:text-zinc-700">
                    {userProfile?.email || "customer@zeflyo.com"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider">
                    {lang === "en" ? "Payment Info" : "Thông tin thanh toán"}
                  </span>
                  <span className="text-xs font-semibold text-white mt-1 print:text-black">
                    {lang === "en" ? "VietQR Bank Transfer" : "Chuyển khoản VietQR"}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono mt-0.5 print:text-zinc-700">
                    Status: <span className={
                      selectedPayment.status === "completed" 
                        ? "text-emerald-400 font-bold" 
                        : selectedPayment.status === "pending"
                        ? "text-yellow-400 font-bold"
                        : "text-red-400 font-bold"
                    }>
                      {selectedPayment.status === "completed" ? (lang === "en" ? "PAID" : "ĐÃ THANH TOÁN") : 
                       selectedPayment.status === "pending" ? (lang === "en" ? "PENDING" : "CHỜ THANH TOÁN") : 
                       selectedPayment.status === "cancelled" ? (lang === "en" ? "CANCELLED BY USER" : "NGƯỜI DÙNG HUỶ") :
                       (lang === "en" ? "EXPIRED" : "QUÁ HẠN")}
                    </span>
                  </span>
                </div>
              </div>

              {selectedPayment.status === "failed" && (
                <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-xs text-red-400 flex items-start gap-2.5 print:bg-red-50/10 print:border-red-200">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400 print:text-red-650" />
                  <div>
                    <span className="font-extrabold block">
                      {lang === "en" ? "Order Cancelled / Expired" : "Đơn hàng đã bị huỷ / quá hạn"}
                    </span>
                    <span className="text-[11px] text-zinc-450 mt-1 block leading-relaxed print:text-zinc-800">
                      {lang === "en"
                        ? "Reason: The 15-minute payment window has expired. If you already made a transfer, please contact Zeflyo support with your invoice code for manual verification."
                        : "Lý do: Quá giới hạn 15 phút chờ thanh toán. Nếu quý khách đã chuyển khoản sau thời gian này, vui lòng liên hệ bộ phận hỗ trợ của Zeflyo kèm mã đơn hàng để được xử lý thủ công."}
                    </span>
                  </div>
                </div>
              )}

              {selectedPayment.status === "cancelled" && (
                <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-xs text-red-400 flex items-start gap-2.5 print:bg-red-50/10 print:border-red-200">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400 print:text-red-650" />
                  <div>
                    <span className="font-extrabold block">
                      {lang === "en" ? "Order Cancelled" : "Đơn hàng đã huỷ"}
                    </span>
                    <span className="text-[11px] text-zinc-455 mt-1 block leading-relaxed print:text-zinc-800">
                      {lang === "en"
                        ? "Reason: Cancelled manually by the user."
                        : "Lý do: Người dùng chủ động từ chối thanh toán và huỷ đơn hàng."}
                    </span>
                  </div>
                </div>
              )}

              {/* Invoice Table */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">
                  {lang === "en" ? "Order Description" : "Chi tiết dịch vụ đăng ký"}
                </span>

                <div className="border border-white/5 rounded-2xl overflow-hidden print:border-zinc-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-zinc-900/60 text-zinc-400 font-bold print:border-zinc-200 print:bg-zinc-50 print:text-zinc-800">
                        <th className="p-4">{lang === "en" ? "Item Description" : "Tên dịch vụ/Sản phẩm"}</th>
                        <th className="p-4 text-center">{lang === "en" ? "Qty" : "SL"}</th>
                        <th className="p-4 text-right">{lang === "en" ? "Price" : "Đơn giá"}</th>
                        <th className="p-4 text-right">{lang === "en" ? "Total" : "Thành tiền"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-zinc-300 print:divide-zinc-200 print:text-black">
                      <tr>
                        <td className="p-4">
                          <span className="font-bold text-white print:text-black">
                            {getPlanTitle(selectedPayment.plan_id, selectedPayment.cycle)}
                          </span>
                          <span className="block text-[10px] text-zinc-500 mt-0.5 print:text-zinc-600">
                            {lang === "en" 
                              ? `Zeflyo premium activation code: ${selectedPayment.code}` 
                              : `Mã kích hoạt dịch vụ tự động Zeflyo: ${selectedPayment.code}`}
                          </span>
                        </td>
                        <td className="p-4 text-center font-semibold">1</td>
                        <td className="p-4 text-right font-mono">{selectedPayment.amount} VND</td>
                        <td className="p-4 text-right font-black font-mono text-[#6C63FF] print:text-black">
                          {selectedPayment.amount} VND
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Calculation Details */}
              <div className="flex flex-col items-end gap-2.5 mt-2 border-t border-white/5 pt-6 print:border-zinc-200">
                <div className="flex justify-between w-64 text-xs">
                  <span className="text-zinc-500">{lang === "en" ? "Subtotal:" : "Tạm tính:"}</span>
                  <span className="font-semibold text-zinc-300 print:text-black font-mono">{selectedPayment.amount} VND</span>
                </div>
                <div className="flex justify-between w-64 text-xs">
                  <span className="text-zinc-500">{lang === "en" ? "VAT (0%):" : "Thuế GTGT (0%):"}</span>
                  <span className="font-semibold text-zinc-300 print:text-black font-mono">0 VND</span>
                </div>
                <div className="flex justify-between w-64 pt-2.5 border-t border-white/5 w-64 print:border-zinc-200">
                  <span className="text-xs font-bold text-white print:text-black">{lang === "en" ? "Total Due:" : "Tổng thanh toán:"}</span>
                  <span className="text-base font-black text-[#6C63FF] print:text-black font-mono">
                    {selectedPayment.amount} VND
                  </span>
                </div>
              </div>

              {/* Corporate Stamp Placeholder & Notes */}
              <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/5 print:border-zinc-200">
                <div className="text-[10px] text-zinc-500 max-w-[320px] leading-relaxed print:text-zinc-650">
                  <p className="font-bold text-zinc-400 print:text-zinc-700">{lang === "en" ? "Thank you for your business!" : "Cảm ơn bạn đã lựa chọn Zeflyo!"}</p>
                  <p className="mt-1">
                    {lang === "en"
                      ? "This is a computer-generated invoice and requires no physical signature or stamp to be valid."
                      : "Hóa đơn điện tử được khởi tạo tự động từ hệ thống Zeflyo và có giá trị xác thực giao dịch chính thức."}
                  </p>
                </div>

                {selectedPayment.status === "completed" && (
                  <div className="w-24 h-24 border-2 border-emerald-500/20 rounded-full flex flex-col items-center justify-center text-center p-1 select-none transform rotate-12 bg-emerald-500/5 print:border-emerald-700 print:bg-transparent">
                    <span className="text-[8px] font-extrabold text-emerald-400 tracking-wider uppercase print:text-emerald-700">ZEFLYO CORP</span>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-0.5 print:text-emerald-700">PAID</span>
                    <span className="text-[7px] text-emerald-500/60 font-mono mt-0.5 print:text-emerald-700/80">
                      {new Date(selectedPayment.updated_at).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 border-t border-white/5 bg-zinc-900/60 flex justify-end gap-3 print:hidden">
              {selectedPayment.status === "pending" && (
                <button
                  onClick={() => handleCancelPendingPayment(selectedPayment.id)}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-red-500/15 active:scale-95 mr-auto"
                >
                  <X className="w-4 h-4" />
                  <span>{lang === "en" ? "Cancel Order" : "Huỷ đơn hàng"}</span>
                </button>
              )}

              <button
                onClick={() => setShowInvoiceModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-all cursor-pointer border border-white/5 active:scale-95"
              >
                {lang === "en" ? "Close" : "Đóng"}
              </button>

              <button
                onClick={() => handleExportExcel()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-500/15 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>{lang === "en" ? "Export Excel" : "Xuất Excel"}</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-[#6C63FF] hover:bg-[#584feb] text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-[#6C63FF]/15 active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>{lang === "en" ? "Print Invoice" : "In hoá đơn"}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
