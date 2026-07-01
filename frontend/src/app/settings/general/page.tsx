"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Camera, 
  Mail, 
  Globe, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  RefreshCw, 
  Trash2, 
  Check, 
  AlertCircle,
  Sparkles,
  X,
  Clock,
  CreditCard,
  AlertTriangle,
  Copy,
  Info
} from "lucide-react";

interface Fanpage {
  id: number;
  user_id: string | number;
  fb_page_id: string;
  name: string;
  avatar_url: string | null;
  is_active: boolean;
}

export default function GeneralSettingsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>("http://localhost");
  const [lang, setLang] = useState<"en" | "vi">("vi");
  const [user, setUser] = useState<any>(null);

  // Form states
  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("Asia/Ho_Chi_Minh");
  const [phone, setPhone] = useState("");
  const [referralPhone, setReferralPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Password change states
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Facebook states
  const [fanpages, setFanpages] = useState<Fanpage[]>([]);
  const [fbStatus, setFbStatus] = useState<"connected" | "expired" | "disconnected">("connected");
  const [fbAccount, setFbAccount] = useState<any>({
    name: "Đức Tiến",
    email: "phoductienta260204@gmail.com",
    avatar: null,
    connectedAt: "2026-06-19 10:30"
  });

  // Action states
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [actionLoadingPage, setActionLoadingPage] = useState<number | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  
  // Notification states
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Cancellation States
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [cancelFeedback, setCancelFeedback] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upgrade & Checkout States
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState("");
  const [selectedUpgradeCycle, setSelectedUpgradeCycle] = useState<"monthly" | "3months" | "yearly">("monthly");
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutCode, setCheckoutCode] = useState("");
  const [checkoutAmount, setCheckoutAmount] = useState(0);
  const [checkoutPlanId, setCheckoutPlanId] = useState("");
  const [checkoutCycle, setCheckoutCycle] = useState<"monthly" | "3months" | "yearly" | null>(null);
  const [checkoutPlanName, setCheckoutPlanName] = useState("");
  const [copiedState, setCopiedState] = useState<"account" | "amount" | "code" | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentTimeLeft, setPaymentTimeLeft] = useState(900);

  const [checkoutBankName, setCheckoutBankName] = useState("Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)");
  const [checkoutBankCode, setCheckoutBankCode] = useState("VCB");
  const [checkoutAccountNumber, setCheckoutAccountNumber] = useState("1002202688888");
  const [checkoutAccountName, setCheckoutAccountName] = useState("CONG TY CO PHAN ZEFLYO");

  interface UpgradePlan {
    id: string;
    nameVi: string;
    nameEn: string;
    priceMonthly: number;
    price3Months: number;
    priceYearly: number;
    credits: number;
  }

  const upgradePlans: UpgradePlan[] = [
    {
      id: "pro",
      nameVi: "Chuyên nghiệp",
      nameEn: "Professional",
      priceMonthly: 179000,
      price3Months: 489000,
      priceYearly: 1610000,
      credits: 2900
    },
    {
      id: "premium",
      nameVi: "Cao cấp",
      nameEn: "Premium",
      priceMonthly: 249000,
      price3Months: 679000,
      priceYearly: 2240000,
      credits: 4300
    }
  ];

  // Format payment countdown time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getUpgradePrice = () => {
    if (!selectedUpgradePlan) return 0;
    const plan = upgradePlans.find(p => p.id === selectedUpgradePlan);
    if (!plan) return 0;
    if (selectedUpgradeCycle === "monthly") return plan.priceMonthly;
    if (selectedUpgradeCycle === "3months") return plan.price3Months;
    return plan.priceYearly;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString("vi-VN");
  };

  // Reset payment timer on modal open
  useEffect(() => {
    if (showCheckoutModal) {
      setPaymentTimeLeft(900);
    }
  }, [showCheckoutModal]);

  // Payment countdown timer
  useEffect(() => {
    let timerId: any;
    if (showCheckoutModal && !paymentSuccess && paymentTimeLeft > 0) {
      timerId = setInterval(() => {
        setPaymentTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [showCheckoutModal, paymentSuccess, paymentTimeLeft]);

  // Polling loop for active payment verification inside general settings
  useEffect(() => {
    let intervalId: any;

    if (showCheckoutModal && !paymentSuccess && paymentTimeLeft > 0) {
      const savedToken = localStorage.getItem("zeflyo_token");
      const savedApiBase = localStorage.getItem("zeflyo_api_base") || "http://localhost";

      if (savedToken && !savedToken.startsWith("mock_")) {
        intervalId = setInterval(async () => {
          try {
            const res = await fetch(`${savedApiBase}/api/user/profile`, {
              headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${savedToken}`
              }
            });
            if (res.ok) {
              const u = await res.json();
              const cachedUserStr = localStorage.getItem("zeflyo_user");

              if (cachedUserStr) {
                const cachedUser = JSON.parse(cachedUserStr);

                if (checkoutPlanId.startsWith("credit_")) {
                  if (u.credits > (cachedUser.credits || 0)) {
                    localStorage.setItem("zeflyo_user", JSON.stringify(u));
                    window.dispatchEvent(new Event("zeflyo_profile_updated"));
                    setUser(u);
                    setPaymentSuccess(true);
                  }
                } else {
                  if (u.subscription_plan === checkoutPlanId) {
                    localStorage.setItem("zeflyo_user", JSON.stringify(u));
                    window.dispatchEvent(new Event("zeflyo_profile_updated"));
                    setUser(u);
                    setPaymentSuccess(true);
                  }
                }
              } else {
                if (checkoutPlanId.startsWith("credit_") && u.credits > 0) {
                  localStorage.setItem("zeflyo_user", JSON.stringify(u));
                  window.dispatchEvent(new Event("zeflyo_profile_updated"));
                  setUser(u);
                  setPaymentSuccess(true);
                } else if (u.subscription_plan === checkoutPlanId) {
                  localStorage.setItem("zeflyo_user", JSON.stringify(u));
                  window.dispatchEvent(new Event("zeflyo_profile_updated"));
                  setUser(u);
                  setPaymentSuccess(true);
                }
              }
            }
          } catch (e) {
            console.error("Polling error:", e);
          }
        }, 2500);
      }
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [showCheckoutModal, paymentSuccess, checkoutPlanId, checkoutCode, paymentTimeLeft]);

  // Handle success overlay timeout redirections
  useEffect(() => {
    if (paymentSuccess) {
      const timer = setTimeout(() => {
        setShowCheckoutModal(false);
        setPaymentSuccess(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [paymentSuccess]);

  const handleCopyText = (text: string, type: "account" | "amount" | "code") => {
    navigator.clipboard.writeText(text);
    setCopiedState(type);
    setTimeout(() => setCopiedState(null), 2000);
  };

  const handleSimulateWebhook = async () => {
    setSimulating(true);

    const savedToken = localStorage.getItem("zeflyo_token");
    const savedApiBase = localStorage.getItem("zeflyo_api_base") || "http://localhost";

    if (!savedToken || savedToken.startsWith("mock_")) {
      setTimeout(() => {
        const savedUser = localStorage.getItem("zeflyo_user");
        if (savedUser) {
          try {
            const u = JSON.parse(savedUser);
            u.subscription_plan = checkoutPlanId;
            let months = 1;
            if (checkoutCycle === "3months") months = 3;
            else if (checkoutCycle === "yearly") months = 12;

            const expDate = new Date();
            expDate.setMonth(expDate.getMonth() + months);
            u.subscription_expires_at = expDate.toISOString();

            let creditsToAdd = 0;
            if (checkoutPlanId === "basic") creditsToAdd = 1000;
            else if (checkoutPlanId === "pro") creditsToAdd = 2900;
            else if (checkoutPlanId === "premium") creditsToAdd = 4300;
            u.credits = (u.credits || 0) + creditsToAdd;

            localStorage.setItem("zeflyo_user", JSON.stringify(u));
            window.dispatchEvent(new Event("zeflyo_profile_updated"));
            setUser(u);
            setPaymentSuccess(true);
          } catch (e) {
            console.error(e);
          }
        }
        setSimulating(false);
      }, 1500);
      return;
    }

    try {
      const res = await fetch(`${savedApiBase}/api/webhook/sepay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          code: checkoutCode,
          amount: checkoutAmount,
          gateway: "KienLongBank",
          transferType: "in",
          transferAmount: checkoutAmount
        })
      });

      if (res.ok) {
        // Immediately fetch updated profile
        const profileRes = await fetch(`${savedApiBase}/api/user/profile`, {
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${savedToken}`
          }
        });
        if (profileRes.ok) {
          const updatedUser = await profileRes.json();
          localStorage.setItem("zeflyo_user", JSON.stringify(updatedUser));
          window.dispatchEvent(new Event("zeflyo_profile_updated"));
          setUser(updatedUser);
          setPaymentSuccess(true);
        }
      } else {
        console.error("Webhook simulation failed");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  const handleUpgradeSubmit = async () => {
    if (!selectedUpgradePlan) return;
    setUpgradeLoading(true);

    const savedToken = localStorage.getItem("zeflyo_token");
    const savedApiBase = localStorage.getItem("zeflyo_api_base") || "http://localhost";
    const amount = getUpgradePrice();

    if (!savedToken || savedToken.startsWith("mock_")) {
      setTimeout(() => {
        // Generate random mock payment code
        const code = "ZF" + Math.random().toString(36).substring(2, 10).toUpperCase();
        setCheckoutCode(code);
        setCheckoutAmount(amount);
        setCheckoutPlanId(selectedUpgradePlan);
        setCheckoutCycle(selectedUpgradeCycle);
        setCheckoutPlanName(
          selectedUpgradePlan === "pro" 
            ? (lang === "en" ? "Professional Plan" : "Gói Chuyên Nghiệp")
            : (lang === "en" ? "Premium Plan" : "Gói Cao Cấp")
        );
        setShowUpgradeModal(false);
        setShowCheckoutModal(true);
        setUpgradeLoading(false);
      }, 800);
      return;
    }

    try {
      const response = await fetch(`${savedApiBase}/api/payments/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${savedToken}`
        },
        body: JSON.stringify({
          plan_id: selectedUpgradePlan,
          cycle: selectedUpgradeCycle,
          amount: amount
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setCheckoutCode(data.payment.code);
        setCheckoutAmount(data.payment.amount);
        setCheckoutPlanId(selectedUpgradePlan);
        setCheckoutCycle(selectedUpgradeCycle);
        setCheckoutPlanName(
          selectedUpgradePlan === "pro" 
            ? (lang === "en" ? "Professional Plan" : "Gói Chuyên Nghiệp")
            : (lang === "en" ? "Premium Plan" : "Gói Cao Cấp")
        );
        if (data.bank) {
          setCheckoutBankName(data.bank.name || checkoutBankName);
          setCheckoutBankCode(data.bank.code || checkoutBankCode);
          setCheckoutAccountNumber(data.bank.account_number || checkoutAccountNumber);
          setCheckoutAccountName(data.bank.account_name || checkoutAccountName);
        }
        setShowUpgradeModal(false);
        setShowCheckoutModal(true);
      } else {
        showToast("error", data.message || "Failed to initiate payment");
      }
    } catch (err) {
      console.error(err);
      showToast("error", lang === "en" ? "Connection error" : "Lỗi kết nối");
    } finally {
      setUpgradeLoading(false);
    }
  };

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("zeflyo_token");
    const savedApiBase = localStorage.getItem("zeflyo_api_base") || "http://localhost";
    const savedLang = localStorage.getItem("zeflyo_lang") || "vi";

    if (savedToken) setToken(savedToken);
    if (savedApiBase) setApiBaseUrl(savedApiBase);
    setLang(savedLang as "en" | "vi");

    const handleLangChange = () => {
      const updatedLang = localStorage.getItem("zeflyo_lang") || "vi";
      setLang(updatedLang as "en" | "vi");
    };

    const handleProfileUpdate = () => {
      const savedUser = localStorage.getItem("zeflyo_user");
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error(e);
        }
      }
    };

    window.addEventListener("zeflyo_lang_changed", handleLangChange);
    window.addEventListener("zeflyo_profile_updated", handleProfileUpdate);
    return () => {
      window.removeEventListener("zeflyo_lang_changed", handleLangChange);
      window.removeEventListener("zeflyo_profile_updated", handleProfileUpdate);
    };
  }, []);

  const handleCancelSubscription = async (reasons: string[], feedback: string) => {
    setCancelling(true);

    if (!token || token.startsWith("mock_")) {
      // Mock cancel
      setTimeout(() => {
        const savedUser = localStorage.getItem("zeflyo_user");
        if (savedUser) {
          try {
            const u = JSON.parse(savedUser);
            u.subscription_plan = "free";
            u.subscription_expires_at = null;
            u.credits = 100;
            u.last_free_credits_at = new Date().toISOString().split('T')[0];
            localStorage.setItem("zeflyo_user", JSON.stringify(u));
            window.dispatchEvent(new Event("zeflyo_profile_updated"));
            setUser(u);
          } catch (e) {
            console.error(e);
          }
        }
        setCancelling(false);
        setShowCancelModal(false);
      }, 1000);
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/user/subscription/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          reasons: reasons,
          feedback: feedback
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Fetch updated profile
          const profileRes = await fetch(`${apiBaseUrl}/api/user/profile`, {
            headers: {
              "Accept": "application/json",
              "Authorization": `Bearer ${token}`
            }
          });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            localStorage.setItem("zeflyo_user", JSON.stringify(profileData));
            window.dispatchEvent(new Event("zeflyo_profile_updated"));
            setUser(profileData);
          }
          setShowCancelModal(false);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
      fetchFanpages();
    }
  }, [token, apiBaseUrl]);

  const fetchProfile = async () => {
    if (!token) return;
    setLoadingProfile(true);

    if (token.startsWith("mock_")) {
      const savedUser = localStorage.getItem("zeflyo_user");
      if (savedUser) {
        const u = JSON.parse(savedUser);
        setUser(u);
        setDisplayName(u.display_name || u.name || "");
        setTimezone(u.timezone || "Asia/Ho_Chi_Minh");
        setPhone(u.phone || "");
        setReferralPhone(u.referral_phone || "");
        setAvatarUrl(u.avatar_url || u.avatar || null);
        setAvatarPreview(u.avatar_url || u.avatar || null);
      }
      setLoadingProfile(false);
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/user/profile`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setDisplayName(data.display_name || data.name || "");
        setTimezone(data.timezone || "Asia/Ho_Chi_Minh");
        setPhone(data.phone || "");
        setReferralPhone(data.referral_phone || "");
        setAvatarUrl(data.avatar_url || null);
        setAvatarPreview(data.avatar_url || null);
        localStorage.setItem("zeflyo_user", JSON.stringify(data));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchFanpages = async () => {
    if (!token) return;

    if (token.startsWith("mock_")) {
      const savedPages = localStorage.getItem("zeflyo_mock_pages");
      if (savedPages) {
        setFanpages(JSON.parse(savedPages));
      }
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/fanpages`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setFanpages(data.fanpages || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || savingProfile) return;
    setSavingProfile(true);

    let finalAvatarUrl = avatarUrl;

    // 1. Upload file if selected
    if (avatarFile) {
      if (token.startsWith("mock_")) {
        // Just mock it
        finalAvatarUrl = avatarPreview;
      } else {
        try {
          const formData = new FormData();
          formData.append("file", avatarFile);

          const uploadRes = await fetch(`${apiBaseUrl}/api/upload`, {
            method: "POST",
            headers: {
              "Accept": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: formData
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            finalAvatarUrl = uploadData.url;
            setAvatarUrl(finalAvatarUrl);
          } else {
            showToast("error", lang === "en" ? "Failed to upload avatar" : "Không thể tải lên ảnh đại diện");
            setSavingProfile(false);
            return;
          }
        } catch (err) {
          console.error(err);
          showToast("error", lang === "en" ? "Network error uploading avatar" : "Lỗi mạng khi tải lên ảnh đại diện");
          setSavingProfile(false);
          return;
        }
      }
    }

    // 2. Update profile details
    if (token.startsWith("mock_")) {
      setTimeout(() => {
        const updatedUser = {
          ...user,
          display_name: displayName,
          timezone: timezone,
          phone: phone,
          referral_phone: referralPhone,
          avatar_url: finalAvatarUrl,
          avatar: finalAvatarUrl // fallback
        };
        setUser(updatedUser);
        localStorage.setItem("zeflyo_user", JSON.stringify(updatedUser));
        window.dispatchEvent(new Event("zeflyo_profile_updated"));
        showToast("success", lang === "en" ? "Profile updated successfully" : "Cập nhật hồ sơ thành công");
        setSavingProfile(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          display_name: user?.display_name || user?.name || displayName,
          timezone: user?.timezone || timezone,
          phone: phone,
          referral_phone: referralPhone,
          avatar_url: finalAvatarUrl
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem("zeflyo_user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("zeflyo_profile_updated"));
        showToast("success", lang === "en" ? "Profile updated successfully" : "Cập nhật hồ sơ thành công");
      } else {
        showToast("error", lang === "en" ? "Failed to save profile changes" : "Lưu thay đổi hồ sơ thất bại");
      }
    } catch (err) {
      console.error(err);
      showToast("error", lang === "en" ? "Network error saving profile" : "Lỗi kết nối khi lưu thay đổi");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || savingPassword) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("error", lang === "en" ? "Please fill in all fields" : "Vui lòng nhập đầy đủ các trường");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("error", lang === "en" ? "Passwords do not match" : "Mật khẩu xác nhận không khớp");
      return;
    }

    setSavingPassword(true);

    if (token.startsWith("mock_")) {
      setTimeout(() => {
        showToast("success", lang === "en" ? "Password changed successfully (Mock)" : "Đổi mật khẩu thành công (Giả lập)");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordSection(false);
        setSavingPassword(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/user/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: confirmPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        showToast("success", lang === "en" ? "Password changed successfully" : "Đổi mật khẩu thành công");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordSection(false);
      } else {
        const errorMsg = data.errors?.current_password?.[0] || data.message || "Failed to update password";
        showToast("error", errorMsg);
      }
    } catch (err) {
      console.error(err);
      showToast("error", lang === "en" ? "Network error updating password" : "Lỗi kết nối khi đổi mật khẩu");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleTogglePage = async (pageId: number) => {
    setActionLoadingPage(pageId);

    if (token && token.startsWith("mock_")) {
      setTimeout(() => {
        const updated = fanpages.map(p => p.id === pageId ? { ...p, is_active: !p.is_active } : p);
        setFanpages(updated);
        localStorage.setItem("zeflyo_mock_pages", JSON.stringify(updated));
        showToast("success", lang === "en" ? "Page status updated" : "Cập nhật Fanpage thành công");
        setActionLoadingPage(null);
      }, 300);
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/fanpages/${pageId}/toggle`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setFanpages(fanpages.map(p => p.id === pageId ? { ...p, is_active: data.fanpage.is_active } : p));
        showToast("success", lang === "en" ? "Page status updated" : "Cập nhật Fanpage thành công");
      }
    } catch (e) {
      console.error(e);
      showToast("error", lang === "en" ? "Failed to toggle page" : "Lỗi kết nối khi bật/tắt Fanpage");
    } finally {
      setActionLoadingPage(null);
    }
  };

  const handleDisconnectFb = () => {
    setIsDisconnecting(true);
  };

  const confirmDisconnectFb = () => {
    setFbStatus("disconnected");
    setIsDisconnecting(false);
    showToast("success", lang === "en" ? "Facebook disconnected" : "Đã ngắt kết nối Facebook");
  };

  const reconnectFb = () => {
    setFbStatus("connected");
    showToast("success", lang === "en" ? "Facebook reconnected" : "Đã kết nối lại Facebook");
  };

  const timezones = [
    { value: "Asia/Ho_Chi_Minh", label: "(GMT+7) Asia/Ho_Chi_Minh" },
    { value: "Asia/Bangkok", label: "(GMT+7) Asia/Bangkok" },
    { value: "Asia/Singapore", label: "(GMT+8) Asia/Singapore" },
    { value: "Asia/Tokyo", label: "(GMT+9) Asia/Tokyo" },
    { value: "America/New_York", label: "(GMT-5) America/New_York" },
    { value: "Europe/London", label: "(GMT+0) Europe/London" }
  ];

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md transition-all shadow-lg animate-float ${
          toast.type === "success" 
            ? "border-green-500/20 bg-green-500/10 text-green-200" 
            : "border-red-500/20 bg-red-500/10 text-red-200"
        }`}>
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
          {lang === "en" ? "General & Facebook" : "Thiết lập thông tin"}
        </h2>
        <p className="text-xs text-zinc-450 mt-1">
          {lang === "en" ? "Manage user profile details, credentials and Facebook integration." : "Quản lý thông tin cá nhân, bảo mật tài khoản và liên kết trang Facebook của bạn."}
        </p>
      </div>

      {/* Active Subscription Banner */}
      {!loadingProfile && user && (
        <div className="glass-panel p-5 rounded-3xl border border-white/5 bg-zinc-900/40 flex flex-col sm:flex-row justify-between items-center gap-4 w-full">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#6C63FF]/15 border border-[#6C63FF]/30 flex items-center justify-center text-[#6C63FF]">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                {lang === "en" ? "Your Current Plan" : "Gói dịch vụ hiện tại"}
              </span>
              <span className="text-sm font-black text-white flex items-center gap-2 mt-0.5">
                {(!user?.subscription_plan || user?.subscription_plan === "free") ? (lang === "en" ? "Free Plan" : "Gói Miễn Phí") :
                  user.subscription_plan === "basic" ? (lang === "en" ? "Basic Plan" : "Gói Cơ Bản") :
                    user.subscription_plan === "pro" ? (lang === "en" ? "Professional Plan" : "Gói Chuyên Nghiệp") :
                      user.subscription_plan === "premium" ? (lang === "en" ? "Premium Plan" : "Gói Cao Cấp") : String(user.subscription_plan).toUpperCase()}

                {user?.subscription_plan && user.subscription_plan !== "free" && (
                  <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                    {lang === "en" ? "Active" : "Đang hoạt động"}
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col sm:text-right">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                {lang === "en" ? "Total Points" : "Tổng điểm"}
              </span>
              <span className="text-base font-extrabold text-emerald-400 mt-0.5">
                {user?.credits !== undefined ? user.credits : 0} pts
              </span>
            </div>

            {user?.subscription_expires_at && (
              <div className="flex flex-col sm:text-right border-l border-white/5 pl-6">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  {lang === "en" ? "Expiration Date" : "Ngày hết hạn"}
                </span>
                <span className="text-xs text-zinc-300 font-mono mt-0.5">
                  {new Date(user.subscription_expires_at).toLocaleDateString(lang === "en" ? "en-US" : "vi-VN", {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </span>
              </div>
            )}

            {user?.subscription_plan && user.subscription_plan !== "free" && (
              <div className="border-l border-white/5 pl-6 flex items-center gap-3">
                {user.subscription_plan !== "premium" && user.subscription_plan !== "vip" && (
                  <button
                    type="button"
                    onClick={() => {
                      // Pre-select the next package
                      if (user.subscription_plan === "basic") {
                        setSelectedUpgradePlan("pro");
                      } else if (user.subscription_plan === "pro") {
                        setSelectedUpgradePlan("premium");
                      }
                      setShowUpgradeModal(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer whitespace-nowrap shadow-md shadow-blue-500/10"
                  >
                    {lang === "en" ? "Upgrade" : "Nâng cấp"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReasons([]);
                    setCancelFeedback("");
                    setShowCancelModal(true);
                  }}
                  disabled={cancelling}
                  className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  {cancelling ? (lang === "en" ? "Processing..." : "Đang huỷ...") : (lang === "en" ? "Cancel Plan" : "Huỷ gói")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {loadingProfile ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-xs">{lang === "en" ? "Loading profile settings..." : "Đang tải cấu hình..."}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left Side: General Profile Form */}
          <div className="md:col-span-7 flex flex-col gap-6">
            <form onSubmit={handleSaveProfile} className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col gap-6">
              <h3 className="text-sm font-bold uppercase text-zinc-450 tracking-wider pb-2 border-b border-white/5 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                {lang === "en" ? "Account Profile" : "Hồ sơ cá nhân"}
              </h3>

              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-3 py-4">
                <div 
                  onClick={handleAvatarClick}
                  className="w-24 h-24 rounded-full border-2 border-white/10 hover:border-[#6C63FF]/50 bg-zinc-900/60 relative cursor-pointer group overflow-hidden transition-all shadow-inner flex items-center justify-center"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profile avatar" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-3xl font-extrabold text-zinc-500 uppercase">
                      {displayName ? displayName.charAt(0) : "U"}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <span className="text-[10px] text-zinc-500">
                  {lang === "en" ? "Click to change avatar image (Max 5MB)" : "Bấm vào ảnh để tải lên avatar mới (Tối đa 5MB)"}
                </span>
              </div>

              {/* Inputs */}
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 tracking-wider">
                    {lang === "en" ? "User ID" : "ID người dùng"}
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={user?.id || ""}
                      readOnly
                      className="w-full bg-zinc-900/40 border border-white/5 text-zinc-400 rounded-xl pl-4 pr-24 py-2.5 text-sm outline-none cursor-default select-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(user?.id || "");
                        showToast("success", lang === "en" ? "Copied User ID" : "Đã sao chép ID người dùng");
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer active:scale-95"
                    >
                      {lang === "en" ? "Copy" : "Sao chép"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 tracking-wider">
                    Email
                  </label>
                  <div className="relative">
                    <input 
                      type="email" 
                      value={user?.email || ""}
                      readOnly
                      className="w-full bg-zinc-900/40 border border-white/5 text-zinc-500 rounded-xl pl-4 pr-24 py-2.5 text-sm outline-none cursor-not-allowed select-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-[9px] uppercase px-2 py-0.5 rounded">
                      {lang === "en" ? "From Facebook" : "Từ Facebook"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 tracking-wider">
                    {lang === "en" ? "Phone Number" : "Số điện thoại"}
                  </label>
                  <input 
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 focus:border-[#6C63FF]/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors text-zinc-200"
                    placeholder={lang === "en" ? "Enter phone number" : "Nhập số điện thoại"}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 tracking-wider">
                    {lang === "en" ? "Referral Phone Number" : "Số điện thoại giới thiệu (nếu có)"}
                  </label>
                  <input 
                    type="text" 
                    value={referralPhone}
                    onChange={(e) => setReferralPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 focus:border-[#6C63FF]/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors text-zinc-200"
                    placeholder={lang === "en" ? "Enter referral phone number" : "Nhập số điện thoại người giới thiệu"}
                  />
                </div>
              </div>

              {/* Submit Profile */}
              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-500/10 active:scale-95 disabled:opacity-50"
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {lang === "en" ? "Saving..." : "Đang lưu thay đổi..."}
                  </>
                ) : (
                  <span>{lang === "en" ? "Save Profile Info" : "Lưu thông tin"}</span>
                )}
              </button>
            </form>

            {/* Accordion Đổi Mật Khẩu */}
            <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col gap-4">
              <button
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="w-full text-left flex justify-between items-center outline-none select-none"
              >
                <h3 className="text-sm font-bold uppercase text-zinc-450 tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#6C63FF]" />
                  {lang === "en" ? "Change Password" : "Bảo mật tài khoản / Mật khẩu"}
                </h3>
                <span className="text-xs text-zinc-500 font-semibold hover:text-zinc-300">
                  {showPasswordSection ? (lang === "en" ? "Collapse" : "Thu gọn") : (lang === "en" ? "Expand" : "Mở rộng")}
                </span>
              </button>

              {showPasswordSection && (
                <form onSubmit={handleSavePassword} className="flex flex-col gap-4 mt-2 animate-fadeIn">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 tracking-wider">
                      {lang === "en" ? "Current Password" : "Mật khẩu hiện tại"}
                    </label>
                    <div className="relative">
                      <input 
                        type={showCurrentPassword ? "text" : "password"} 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="w-full bg-white/5 border border-white/5 focus:border-[#6C63FF]/50 rounded-xl pl-4 pr-10 py-2.5 text-sm outline-none transition-colors text-zinc-200"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 outline-none"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 tracking-wider">
                      {lang === "en" ? "New Password" : "Mật khẩu mới"}
                    </label>
                    <div className="relative">
                      <input 
                        type={showNewPassword ? "text" : "password"} 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="w-full bg-white/5 border border-white/5 focus:border-[#6C63FF]/50 rounded-xl pl-4 pr-10 py-2.5 text-sm outline-none transition-colors text-zinc-200"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 outline-none"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 tracking-wider">
                      {lang === "en" ? "Confirm New Password" : "Xác nhận mật khẩu mới"}
                    </label>
                    <div className="relative">
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full bg-white/5 border border-white/5 focus:border-[#6C63FF]/50 rounded-xl pl-4 pr-10 py-2.5 text-sm outline-none transition-colors text-zinc-200"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 outline-none"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="w-full py-2.5 mt-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-white font-semibold text-xs flex items-center justify-center gap-2 border border-white/5 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {savingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {lang === "en" ? "Changing..." : "Đang cập nhật..."}
                      </>
                    ) : (
                      <span>{lang === "en" ? "Change Password" : "Thiết lập mật khẩu đăng nhập"}</span>
                    )}
                  </button>
                </form>
              )}
            </div>

          </div>

          {/* Right Side: Facebook Connection and Fanpages list */}
          <div className="md:col-span-5 flex flex-col gap-6">
            
            {/* FB Connection Status */}
            <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="text-xs uppercase font-extrabold text-zinc-500 tracking-wider">
                  {lang === "en" ? "Facebook Integration" : "Quản lý Fanpage Facebook"}
                </h3>
                
                {fbStatus === "connected" ? (
                  <span className="flex items-center gap-1 text-[10px] bg-green-500/10 border border-green-500/20 text-green-400 font-bold px-2 py-0.5 rounded-md shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    {lang === "en" ? "Connected" : "Đã kết nối"}
                  </span>
                ) : fbStatus === "expired" ? (
                  <span className="flex items-center gap-1 text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded-md shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    {lang === "en" ? "Expired Token" : "Token hết hạn"}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-400 font-bold px-2 py-0.5 rounded-md shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                    {lang === "en" ? "Disconnected" : "Chưa kết nối"}
                  </span>
                )}
              </div>

              {fbStatus !== "disconnected" ? (
                <div className="flex flex-col gap-4">
                  {/* FB User Profile Card */}
                  <div className="flex items-center gap-3 p-3 bg-zinc-950/40 border border-white/5 rounded-2xl shadow-inner">
                    <div className="w-10 h-10 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-450 font-bold flex-shrink-0 text-sm">
                      {fbAccount.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-zinc-200 font-bold truncate block">{fbAccount.name}</span>
                      <span className="text-[10px] text-zinc-500 truncate block">{fbAccount.email}</span>
                      <span className="text-[9px] text-zinc-650 block mt-0.5">
                        {lang === "en" ? `Connected: ${fbAccount.connectedAt}` : `Thời gian kết nối: ${fbAccount.connectedAt}`}
                      </span>
                    </div>
                  </div>

                  {/* Fanpages list */}
                  <div className="flex flex-col gap-2.5">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                      {lang === "en" ? "Active Channels" : "Danh sách Fanpage"}
                    </span>

                    {fanpages.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-4 bg-zinc-950/20 border border-dashed border-zinc-850 rounded-xl">
                        {lang === "en" ? "No connected fanpages found" : "Không có Fanpage nào được liên kết"}
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                        {fanpages.map((page) => (
                          <div 
                            key={page.id} 
                            className="p-3 bg-zinc-950/20 border border-white/5 rounded-xl hover:bg-zinc-950/40 transition-colors flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-[#6C63FF]/10 border border-[#6C63FF]/20 flex items-center justify-center text-xs font-bold text-[#6C63FF] shrink-0">
                                {page.avatar_url ? (
                                  <img src={page.avatar_url} alt={page.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  page.name.charAt(0)
                                )}
                              </div>
                              <span className="text-xs text-zinc-200 font-bold truncate block" title={page.name}>
                                {page.name}
                              </span>
                            </div>

                            {/* Active switch */}
                            <button
                              onClick={() => handleTogglePage(page.id)}
                              disabled={actionLoadingPage === page.id}
                              className={`w-10 h-5.5 rounded-full relative transition-all duration-300 outline-none cursor-pointer flex items-center shrink-0 ${
                                page.is_active 
                                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-sm" 
                                  : "bg-zinc-800 border border-zinc-700"
                              }`}
                            >
                              {actionLoadingPage === page.id ? (
                                <Loader2 className={`w-3 h-3 animate-spin text-white absolute ${
                                  page.is_active ? "right-1" : "left-1"
                                }`} />
                              ) : (
                                <span className={`bg-white w-3.5 h-3.5 rounded-full shadow transition-all duration-300 absolute ${
                                  page.is_active ? "left-5.5" : "left-1"
                                }`} />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div className="flex flex-col gap-2 mt-2">
                    <button
                      onClick={reconnectFb}
                      className="w-full py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/20 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      {lang === "en" ? "Reconnect Facebook" : "Kết nối lại Facebook"}
                    </button>

                    <button
                      onClick={handleDisconnectFb}
                      className="w-full py-2 rounded-xl border border-red-500/20 hover:border-red-500/40 text-red-400 hover:bg-red-500/5 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {lang === "en" ? "Disconnect Facebook" : "Ngắt kết nối tài khoản"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center gap-4">
                  <div className="p-4 bg-zinc-900 border border-white/5 rounded-full text-zinc-600">
                    <Globe className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-300">{lang === "en" ? "Connect Facebook Account" : "Chưa kết nối Facebook"}</h4>
                    <p className="text-[10px] text-zinc-550 max-w-xs leading-relaxed mt-1">
                      {lang === "en" 
                        ? "Connect your Facebook account to synchronize Fanpages, messages and configure smart Gemini AI responders."
                        : "Kết nối tài khoản Facebook để đồng bộ hóa danh sách Fanpage quản lý, nhận diện bình luận/tin nhắn và cấu hình tự động phản hồi AI."}
                    </p>
                  </div>
                  <button
                    onClick={reconnectFb}
                    className="w-full py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#5C53EF] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-[#6C63FF]/10 active:scale-95"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-pulse" />
                    {lang === "en" ? "Connect Facebook Account" : "Kết nối facebook"}
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* Disconnect Confirmation Dialog */}
      {isDisconnecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel p-6 rounded-3xl border border-white/5 w-full max-w-md shadow-2xl flex flex-col gap-4">
            <h4 className="text-sm font-bold uppercase text-red-400 tracking-wider">
              {lang === "en" ? "Disconnect Facebook" : "Xác nhận ngắt kết nối"}
            </h4>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {lang === "en" 
                ? "Are you sure you want to disconnect Facebook? This will remove all connected Fanpages, stop active AI automations, and delete session keys."
                : "Bạn có chắc chắn muốn ngắt kết nối tài khoản Facebook này không? Thao tác này sẽ xóa tất cả Fanpage đang đồng bộ, tắt hoàn toàn tự động hóa AI và hủy khóa truy cập."}
            </p>
            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={() => setIsDisconnecting(false)}
                className="py-2 px-4 rounded-xl bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-xs font-semibold text-zinc-400 cursor-pointer"
              >
                {lang === "en" ? "Cancel" : "Hủy"}
              </button>
              <button
                onClick={confirmDisconnectFb}
                className="py-2 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white cursor-pointer shadow-lg shadow-red-600/10"
              >
                {lang === "en" ? "Confirm Disconnect" : "Ngắt kết nối"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Reason Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 w-full max-w-md shadow-2xl flex flex-col gap-6 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                {lang === "en" ? "Cancel Subscription" : "Huỷ gói dịch vụ"}
              </h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                {lang === "en" ? "Close" : "Đóng"}
              </button>
            </div>

            <div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {lang === "en"
                  ? "We are very sorry to see you go. Please let us know the reasons you are canceling so we can improve Zeflyo:"
                  : "Chúng tôi rất tiếc khi bạn quyết định dừng sử dụng gói dịch vụ. Vui lòng chọn lý do huỷ để giúp Zeflyo cải thiện tốt hơn:"}
              </p>
            </div>

            {/* Reasons List */}
            <div className="flex flex-col gap-3">
              {[
                { id: "expensive", labelVi: "Giá gói dịch vụ quá cao", labelEn: "Price is too high" },
                { id: "missing_features", labelVi: "Thiếu tính năng tôi cần", labelEn: "Missing features I need" },
                { id: "hard_to_use", labelVi: "Khó sử dụng / Giao diện phức tạp", labelEn: "Hard to use / Complex interface" },
                { id: "bugs", labelVi: "Gặp nhiều lỗi trong quá trình sử dụng", labelEn: "Encountered too many bugs" },
                { id: "no_longer_needed", labelVi: "Không còn nhu cầu sử dụng", labelEn: "No longer needed" },
                { id: "other", labelVi: "Lý do khác...", labelEn: "Other reasons..." }
              ].map((reason) => {
                const label = lang === "en" ? reason.labelEn : reason.labelVi;
                const isSelected = selectedReasons.includes(label);

                return (
                  <label
                    key={reason.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${isSelected
                        ? "bg-red-500/10 border-red-500/30 text-white"
                        : "bg-zinc-950/20 border-white/5 text-zinc-400 hover:border-white/10 hover:text-zinc-200"
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        if (isSelected) {
                          setSelectedReasons(selectedReasons.filter(r => r !== label));
                        } else {
                          setSelectedReasons([...selectedReasons, label]);
                        }
                      }}
                      className="mt-0.5 rounded border-white/10 bg-zinc-900 text-red-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-xs font-semibold leading-tight">{label}</span>
                  </label>
                );
              })}
            </div>

            {/* Other reason input textarea */}
            {(selectedReasons.includes("Lý do khác...") || selectedReasons.includes("Other reasons...")) && (
              <div className="flex flex-col gap-2 animate-fadeIn">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  {lang === "en" ? "Please specify your reason" : "Chi tiết lý do khác"}
                </span>
                <textarea
                  value={cancelFeedback}
                  onChange={(e) => setCancelFeedback(e.target.value)}
                  placeholder={lang === "en" ? "Please tell us more..." : "Vui lòng chia sẻ thêm ý kiến của bạn..."}
                  className="w-full min-h-[80px] p-3 rounded-xl bg-zinc-950/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 resize-none font-sans"
                />
              </div>
            )}

            {/* Warning Message */}
            <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
              <p className="text-[10px] text-red-400 leading-relaxed font-semibold">
                ⚠️ {lang === "en"
                  ? "Warning: Your subscription will be cancelled and reverted to Free tier immediately. You will lose access to premium features."
                  : "Cảnh báo: Gói dịch vụ hiện tại sẽ bị huỷ và hạ cấp về gói Miễn Phí ngay lập tức. Bạn sẽ mất quyền truy cập các tính năng Premium."}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-white/5 text-zinc-300 font-bold text-xs transition-all active:scale-95 cursor-pointer text-center"
              >
                {lang === "en" ? "Keep My Plan" : "Giữ lại gói"}
              </button>

              <button
                type="button"
                onClick={() => handleCancelSubscription(selectedReasons, cancelFeedback)}
                disabled={cancelling || selectedReasons.length === 0}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:hover:bg-red-600 text-white font-extrabold text-xs transition-all active:scale-95 cursor-pointer text-center flex items-center justify-center gap-1 shadow-lg shadow-red-900/15"
              >
                {cancelling ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  lang === "en" ? "Confirm Cancel" : "Xác nhận huỷ"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Subscription Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 w-full max-w-lg shadow-2xl flex flex-col gap-6 text-left max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#6C63FF] animate-pulse" />
                {lang === "en" ? "Upgrade Subscription Plan" : "Nâng cấp gói dịch vụ"}
              </h3>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                {lang === "en" ? "Close" : "Đóng"}
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-zinc-300 leading-relaxed">
              {lang === "en"
                ? "Choose a higher tier subscription plan to increase your usage limit, add premium automation features, and prioritize support."
                : "Chọn một gói dịch vụ cao cấp hơn để tăng giới hạn tài khoản, mở khóa các tính năng tự động hóa nâng cao và ưu tiên hỗ trợ."}
            </p>

            {/* Package Selector */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                {lang === "en" ? "Select Plan" : "Chọn gói dịch vụ"}
              </span>
              
              <div className="flex flex-col gap-3">
                {upgradePlans
                  .filter(plan => {
                    // Only show plans higher than current plan
                    if (user?.subscription_plan === "basic") {
                      return plan.id === "pro" || plan.id === "premium";
                    }
                    if (user?.subscription_plan === "pro") {
                      return plan.id === "premium";
                    }
                    return false;
                  })
                  .map((plan) => {
                    const isSelected = selectedUpgradePlan === plan.id;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedUpgradePlan(plan.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                          isSelected
                            ? "bg-[#6C63FF]/10 border-[#6C63FF] text-white animate-pulse"
                            : "bg-zinc-950/20 border-white/5 text-zinc-400 hover:border-white/10 hover:text-zinc-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? "border-[#6C63FF]" : "border-zinc-600"
                          }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-[#6C63FF]" />}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white">
                              {lang === "en" ? plan.nameEn : plan.nameVi}
                            </span>
                            <span className="text-[10px] text-zinc-500 mt-0.5">
                              {lang === "en" ? `+ ${plan.credits} credits/month` : `+ ${plan.credits} điểm/tháng`}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-extrabold text-white">
                            {lang === "en" 
                              ? `From ${formatNumber(plan.priceMonthly)} VND/mo` 
                              : `Từ ${formatNumber(plan.priceMonthly)}đ/tháng`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Cycle Selector */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                {lang === "en" ? "Billing Cycle" : "Chu kỳ thanh toán"}
              </span>

              <div className="grid grid-cols-3 gap-2 bg-zinc-950/40 p-1 rounded-2xl border border-white/5">
                {[
                  { id: "monthly", labelVi: "Theo tháng", labelEn: "Monthly", discount: "" },
                  { id: "3months", labelVi: "3 tháng", labelEn: "3 Months", discount: "Giảm 10%" },
                  { id: "yearly", labelVi: "Theo năm", labelEn: "Yearly", discount: "Giảm 25%" }
                ].map((c) => {
                  const isActive = selectedUpgradeCycle === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedUpgradeCycle(c.id as any)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center relative ${
                        isActive
                          ? "bg-[#6C63FF] text-white shadow-md shadow-[#6C63FF]/15"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {lang === "en" ? c.labelEn : c.labelVi}
                      {c.discount && (
                        <span className="absolute -top-2 right-1/2 translate-x-1/2 bg-emerald-500 text-[6px] text-white font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                          {c.discount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pricing breakdown Details */}
            {selectedUpgradePlan && (
              <div className="p-4 bg-zinc-950/30 rounded-2xl border border-white/5 flex flex-col gap-2.5">
                {/* Original price calculation */}
                {selectedUpgradeCycle !== "monthly" && (
                  <div className="flex justify-between items-center text-[10px] text-zinc-500">
                    <span>{lang === "en" ? "Original Price:" : "Giá gốc:"}</span>
                    <span className="line-through">
                      {selectedUpgradeCycle === "3months" 
                        ? `${formatNumber((upgradePlans.find(p => p.id === selectedUpgradePlan)?.priceMonthly || 0) * 3)}đ`
                        : `${formatNumber((upgradePlans.find(p => p.id === selectedUpgradePlan)?.priceMonthly || 0) * 12)}đ`}
                    </span>
                  </div>
                )}

                {/* Savings / Discount */}
                {selectedUpgradeCycle !== "monthly" && (
                  <div className="flex justify-between items-center text-[10px] text-emerald-400 font-medium">
                    <span>{lang === "en" ? "Savings:" : "Tiết kiệm:"}</span>
                    <span>
                      {selectedUpgradeCycle === "3months"
                        ? `-${formatNumber(((upgradePlans.find(p => p.id === selectedUpgradePlan)?.priceMonthly || 0) * 3) - getUpgradePrice())}đ`
                        : `-${formatNumber(((upgradePlans.find(p => p.id === selectedUpgradePlan)?.priceMonthly || 0) * 12) - getUpgradePrice())}đ`}
                    </span>
                  </div>
                )}

                {/* Total Payment */}
                <div className="flex justify-between items-center border-t border-white/5 pt-2.5">
                  <span className="text-xs font-bold text-zinc-300">
                    {lang === "en" ? "Total Payment:" : "Tổng thanh toán:"}
                  </span>
                  <span className="text-base font-black text-[#6C63FF]">
                    {formatNumber(getUpgradePrice())}đ
                  </span>
                </div>
              </div>
            )}

            {/* Warning / Notes */}
            <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                {lang === "en"
                  ? "Upon successful payment, your tier upgrades immediately and extra credits will be added to your account without needing page reloads."
                  : "Sau khi thanh toán thành công, tài khoản của bạn sẽ lập tức nâng cấp và cộng điểm mà không cần tải lại trang."}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-white/5 text-zinc-300 font-bold text-xs transition-all active:scale-95 cursor-pointer text-center"
              >
                {lang === "en" ? "Cancel" : "Hủy bỏ"}
              </button>

              <button
                type="button"
                onClick={handleUpgradeSubmit}
                disabled={upgradeLoading || !selectedUpgradePlan}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white font-extrabold text-xs transition-all active:scale-95 cursor-pointer text-center flex items-center justify-center gap-1 shadow-lg shadow-indigo-900/15"
              >
                {upgradeLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  lang === "en" ? "Proceed to Payment" : "Tiến hành thanh toán"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SePay Checkout QR Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel rounded-3xl border border-white/10 w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col gap-0 max-h-[90vh]">

            {/* Success screen overlay */}
            {paymentSuccess ? (
              <div className="p-12 flex flex-col items-center justify-center text-center gap-6 animate-scaleUp my-auto min-h-[400px]">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Check className="w-10 h-10 stroke-[3] animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">
                    {lang === "en" ? "Subscription Successful!" : "Đăng ký gói thành công!"}
                  </h3>
                  <p className="text-sm text-zinc-400 mt-2 max-w-md mx-auto">
                    {lang === "en"
                      ? `You have successfully subscribed to the package and your account has been upgraded to ${checkoutPlanName}!`
                      : `Bạn đã đăng ký gói dịch vụ thành công và tài khoản đã được cập nhật lên ${checkoutPlanName}!`}
                  </p>
                </div>
                <div className="text-xs text-zinc-500 animate-pulse">
                  {lang === "en" ? "Redirecting in a moment..." : "Hệ thống sẽ tự động chuyển hướng..."}
                </div>
              </div>
            ) : (
              <>
                {/* Header/Order Summary Panel */}
                <div className="p-6 bg-[#09090b]/80 border-b border-white/5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                      {lang === "en" ? "Order details" : "Chi tiết đơn hàng"}
                    </h3>
                    <div className="flex items-center gap-4">
                      {paymentTimeLeft > 0 && (
                        <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${
                          paymentTimeLeft < 60
                            ? "text-red-500 bg-red-500/10 border-red-500/20 animate-pulse"
                            : "text-amber-500 bg-amber-500/10 border-amber-500/20"
                        }`}>
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatTime(paymentTimeLeft)}</span>
                        </div>
                      )}
                      <button
                        onClick={() => setShowCheckoutModal(false)}
                        className="text-xs font-semibold text-zinc-450 hover:text-white transition-colors cursor-pointer"
                      >
                        {lang === "en" ? "Hide" : "Ẩn"}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="text-base font-extrabold text-white">
                        {checkoutPlanName}
                      </h4>
                      <p className="text-xs text-zinc-500 mt-1">x 1</p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-extrabold text-white">
                        {formatNumber(checkoutAmount)} VND
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-white/5">
                    <span className="text-xs font-semibold text-zinc-400">
                      {lang === "en" ? "Total amount:" : "Tổng cộng:"}
                    </span>
                    <span className="text-lg font-black text-[#6C63FF]">
                      {formatNumber(checkoutAmount)} VND
                    </span>
                  </div>
                </div>

                {paymentTimeLeft === 0 ? (
                  <div className="p-12 flex flex-col items-center justify-center text-center gap-6 animate-scaleUp my-auto min-h-[400px]">
                    <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                      <AlertTriangle className="w-10 h-10 stroke-[2] animate-bounce" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white">
                        {lang === "en" ? "Transaction Expired" : "Giao dịch đã hết hạn"}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
                        {lang === "en"
                          ? "The payment time window has closed. Any transfers sent after this period will not be credited automatically. Please initiate a new transaction."
                          : "Đã quá thời gian quy định để thực hiện thanh toán. Mọi giao dịch chuyển khoản sau thời gian này sẽ không được xử lý tự động. Vui lòng tạo đơn hàng mới."}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowCheckoutModal(false)}
                      className="px-6 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-white/5 text-zinc-300 font-bold text-xs transition-all active:scale-95 cursor-pointer mt-2"
                    >
                      {lang === "en" ? "Close" : "Đóng"}
                    </button>
                  </div>
                ) : (
                  <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch overflow-y-auto">

                  {/* Left Side: QR Panel */}
                  <div className="flex flex-col items-center justify-between bg-zinc-950/40 border border-white/5 rounded-2xl p-6 text-center gap-4">
                    <span className="text-xs text-zinc-400 leading-relaxed max-w-[280px]">
                      {lang === "en"
                        ? "Open any Bank App to scan VietQR or transfer with exact details below"
                        : "Mở App Ngân hàng bất kỳ để quét mã VietQR hoặc chuyển khoản chính xác số tiền, nội dung bên dưới"}
                    </span>

                    {/* QR Code Frame */}
                    <div className="bg-white p-3 rounded-2xl relative shadow-xl shadow-black/40 flex flex-col items-center gap-1.5 w-[200px] h-[200px] justify-center">
                      <img
                        src={`https://img.vietqr.io/image/${checkoutBankCode}-${checkoutAccountNumber}-compact2.png?amount=${checkoutAmount}&addInfo=${checkoutCode}&accountName=${encodeURIComponent(checkoutAccountName)}`}
                        alt="VietQR Payment Code"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="flex items-center justify-center gap-3">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#6C63FF] bg-[#6C63FF]/10 px-2.5 py-1 rounded-full">
                        napas 247
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 bg-zinc-800/40 px-2.5 py-1 rounded-full">
                        {checkoutBankCode}
                      </span>
                    </div>

                    <button
                      onClick={() => setShowCheckoutModal(false)}
                      className="px-6 py-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-white/5 text-zinc-300 font-bold text-xs transition-all active:scale-95 cursor-pointer mt-2"
                    >
                      {lang === "en" ? "Cancel Order" : "Huỷ"}
                    </button>
                  </div>

                  {/* Right Side: Account and Details Card */}
                  <div className="flex flex-col justify-between gap-6">

                    {/* Bank Info */}
                    <div className="flex items-center gap-3.5 bg-zinc-950/20 p-4 rounded-2xl border border-white/5">
                      <div className="w-10 h-10 rounded-xl bg-[#6C63FF]/15 border border-[#6C63FF]/30 flex items-center justify-center text-[#6C63FF]">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                          {lang === "en" ? "Bank Partner" : "Ngân hàng"}
                        </span>
                        <span className="text-xs text-zinc-200 font-bold truncate">
                          {checkoutBankName}
                        </span>
                      </div>
                    </div>

                    {/* Copyable Details List */}
                    <div className="flex flex-col gap-4">
                      {/* Account Owner */}
                      <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                            {lang === "en" ? "Account Owner" : "Chủ tài khoản"}
                          </span>
                          <span className="text-xs text-white font-extrabold mt-0.5">{checkoutAccountName}</span>
                        </div>
                      </div>

                      {/* Account Number */}
                      <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                            {lang === "en" ? "Account Number" : "Số tài khoản"}
                          </span>
                          <span className="text-xs text-white font-mono font-extrabold mt-0.5 tracking-wider">
                            {checkoutAccountNumber}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopyText(checkoutAccountNumber, "account")}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-[10px] transition-all cursor-pointer select-none active:scale-95 flex items-center gap-1 border border-white/5"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedState === "account" ? (lang === "en" ? "Copied" : "Đã sao chép") : (lang === "en" ? "Copy" : "Sao chép")}
                        </button>
                      </div>

                      {/* Amount */}
                      <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                            {lang === "en" ? "Amount" : "Số tiền"}
                          </span>
                          <span className="text-xs text-[#6C63FF] font-extrabold mt-0.5">
                            {formatNumber(checkoutAmount)} VND
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopyText(checkoutAmount.toString(), "amount")}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-[10px] transition-all cursor-pointer select-none active:scale-95 flex items-center gap-1 border border-white/5"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedState === "amount" ? (lang === "en" ? "Copied" : "Đã sao chép") : (lang === "en" ? "Copy" : "Sao chép")}
                        </button>
                      </div>

                      {/* Code Description */}
                      <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                            {lang === "en" ? "Message Content" : "Nội dung"}
                          </span>
                          <span className="text-xs text-emerald-400 font-mono font-extrabold mt-0.5 tracking-wider">
                            {checkoutCode}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopyText(checkoutCode, "code")}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-[10px] transition-all cursor-pointer select-none active:scale-95 flex items-center gap-1 border border-white/5"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedState === "code" ? (lang === "en" ? "Copied" : "Đã sao chép") : (lang === "en" ? "Copy" : "Sao chép")}
                        </button>
                      </div>
                    </div>

                    {/* Note and SePay simulation trigger */}
                    <div className="flex flex-col gap-4 mt-auto">
                      <p className="text-[10px] text-zinc-400 leading-relaxed bg-yellow-500/5 border border-yellow-500/10 p-3 rounded-xl flex items-start gap-2">
                        <span className="font-extrabold text-yellow-500 shrink-0">!</span>
                        <span>
                          {lang === "en"
                            ? `Note: Please input the exact amount of ${formatNumber(checkoutAmount)} and reference code ${checkoutCode} in your transfer description.`
                            : `Lưu ý : Nhập chính xác số tiền ${formatNumber(checkoutAmount)}, nội dung ${checkoutCode} khi chuyển khoản`}
                        </span>
                      </p>

                      <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                        <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider text-center">
                          {lang === "en" ? "Developer Sandbox Testing" : "Chế độ kiểm thử dành cho lập trình viên"}
                        </span>

                        <button
                          onClick={handleSimulateWebhook}
                          disabled={simulating || paymentSuccess}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-extrabold text-xs transition-all active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
                        >
                          {simulating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>{lang === "en" ? "Processing Webhook Simulation..." : "Đang xử lý giả lập SePay..."}</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              <span>{lang === "en" ? "Simulate Payment (Test SePay)" : "Giả lập thanh toán"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
                )}
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
