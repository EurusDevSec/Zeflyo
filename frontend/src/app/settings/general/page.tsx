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
  AlertCircle 
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

  const fileInputRef = useRef<HTMLInputElement>(null);

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

    window.addEventListener("zeflyo_lang_changed", handleLangChange);
    return () => {
      window.removeEventListener("zeflyo_lang_changed", handleLangChange);
    };
  }, []);

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

    </div>
  );
}
