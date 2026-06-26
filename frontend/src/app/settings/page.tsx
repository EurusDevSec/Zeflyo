"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Globe, MessageSquare, Home, Calendar, Sliders, LogOut, Sun, Moon, ArrowLeft } from "lucide-react";
import { Locale } from "@/lib/i18n";
import { useTranslate } from "@/lib/useTranslate";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
}

interface SettingTab {
  id: "language" | "feedback";
  label: string;
  description: string;
}

const languageOptions = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "English" },
];

function inputCls(theme: string) {
  return `w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${
    theme === "dark"
      ? "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
      : "bg-white border-gray-200 text-zinc-900 placeholder:text-zinc-500"
  }`;
}

function buttonCls(theme: string) {
  return `inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold uppercase tracking-[0.04em] transition-all ${
    theme === "dark"
      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
      : "bg-blue-600 text-white shadow-lg shadow-blue-500/15 hover:bg-blue-500"
  }`;
}

export default function SettingsPage() {
  const [currentTab, setCurrentTab] = useState<"language" | "feedback">("language");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [lang, setLang] = useState<Locale>("vi");
  const [token, setToken] = useState<string | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>("http://localhost");
  const [user, setUser] = useState<UserProfile | null>(null);

  const [languageValue, setLanguageValue] = useState<string>("vi");
  const [languageStatus, setLanguageStatus] = useState<string | null>(null);
  const [languageError, setLanguageError] = useState<string | null>(null);
  const [submittingLanguage, setSubmittingLanguage] = useState(false);

  const [feedbackType, setFeedbackType] = useState<"bug" | "suggestion" | "feature_request" | "other">("suggestion");
  const [feedbackTitle, setFeedbackTitle] = useState("");
  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackImages, setFeedbackImages] = useState<string[]>([]);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const t = useTranslate(lang);

  const tabs: SettingTab[] = [
    {
      id: "language",
      label: t("settings.tabs.language"),
      description: t("settings.tabs.languageDesc"),
    },
    {
      id: "feedback",
      label: t("settings.tabs.feedback"),
      description: t("settings.tabs.feedbackDesc"),
    },
  ];

  useEffect(() => {
    const savedTheme = localStorage.getItem("zeflyo_theme") as "dark" | "light" | null;
    const savedLang = localStorage.getItem("zeflyo_lang") as "vi" | "en" | null;
    const savedToken = localStorage.getItem("zeflyo_token");
    const savedUser = localStorage.getItem("zeflyo_user");
    const savedApi = localStorage.getItem("zeflyo_api_base");

    if (savedTheme) setTheme(savedTheme);
    if (savedLang) setLang(savedLang);
    if (savedToken) setToken(savedToken);
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
    }
    if (savedApi) setApiBaseUrl(savedApi);

    if (savedTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, []);

  useEffect(() => {
    const savedLang = localStorage.getItem("zeflyo_lang") as "vi" | "en" | null;
    if (savedLang) {
      setLanguageValue(savedLang);
    }
  }, []);

  const showNotification = (message: string, isError = false) => {
    if (isError) {
      setLanguageError(message);
      setFeedbackError(message);
    } else {
      setLanguageStatus(message);
      setFeedbackSuccess(message);
    }
    setTimeout(() => {
      setLanguageError(null);
      setFeedbackError(null);
      setLanguageStatus(null);
      setFeedbackSuccess(null);
    }, 4500);
  };

  const handleLanguageUpdate = async () => {
    if (!token) {
      showNotification(t("settings.language.loginRequired"), true);
      return;
    }
    setSubmittingLanguage(true);
    setLanguageError(null);
    setLanguageStatus(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/user/language`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ language: languageValue }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("zeflyo_lang", languageValue);
        showNotification(t("settings.language.updated"));
      } else {
        showNotification(data.message || t("settings.language.updateFailed"), true);
      }
    } catch (error) {
      showNotification(t("settings.errors.serverConnection"), true);
    } finally {
      setSubmittingLanguage(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!token) {
      showNotification(t("settings.feedback.loginRequired"), true);
      return;
    }

    if (!feedbackTitle.trim() || !feedbackContent.trim()) {
      showNotification(t("settings.feedback.required"), true);
      return;
    }

    setSubmittingFeedback(true);
    setFeedbackError(null);
    setFeedbackSuccess(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: feedbackType,
          title: feedbackTitle,
          content: feedbackContent,
          image_urls: feedbackImages.length ? feedbackImages : null,
          contact_email: feedbackEmail || null,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setFeedbackTitle("");
        setFeedbackContent("");
        setFeedbackEmail("");
        setFeedbackImages([]);
        showNotification("Cảm ơn bạn! Phản hồi đã được gửi.");
      } else {
        showNotification(data.message || t("settings.feedback.uploadFailed"), true);
      }
    } catch (error) {
        showNotification(t("settings.errors.serverConnection"), true);
      setSubmittingFeedback(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) {
      return;
    }

    const newUrls = [...feedbackImages];
    for (let i = 0; i < files.length && newUrls.length < 3; i += 1) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        showNotification(t("settings.feedback.imageTooLarge"), true);
        continue;
      }
      const formData = new FormData();
      formData.append("image", file);
      try {
        const response = await fetch(`${apiBaseUrl}/api/upload`, {
          method: "POST",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: formData,
        });
        const data = await response.json();
        if (response.ok && data.url) {
          newUrls.push(data.url);
        } else {
          showNotification(data.error || t("settings.feedback.uploadFailed"), true);
        }
      } catch {
        showNotification(t("settings.feedback.uploadError"), true);
      }
    }

    setFeedbackImages(newUrls.slice(0, 3));
  };

  return (
    <div className="min-h-screen bg-[#09090d] text-zinc-100 light:bg-white light:text-zinc-900">
      <div className="flex min-h-screen">
        <Sidebar
          currentPath="/settings"
          user={user}
          lang={lang}
          toggleLanguage={() => {
            const nextLang = lang === "vi" ? "en" : "vi";
            setLang(nextLang);
            localStorage.setItem("zeflyo_lang", nextLang);
          }}
          theme={theme}
          toggleTheme={() => {
            const nextTheme = theme === "dark" ? "light" : "dark";
            setTheme(nextTheme);
            localStorage.setItem("zeflyo_theme", nextTheme);
            if (nextTheme === "light") {
              document.documentElement.classList.add("light");
            } else {
              document.documentElement.classList.remove("light");
            }
          }}
          handleLogout={() => {
            localStorage.removeItem("zeflyo_token");
            localStorage.removeItem("zeflyo_user");
            window.location.href = "/";
          }}
        />

        <main className="flex-1 p-6 lg:px-10 lg:py-8">
          <div className="mb-8 flex flex-col gap-6">
            <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-6 shadow-2xl shadow-black/20 light:bg-white light:border-zinc-200">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-zinc-500 light:text-zinc-500">{t("settings.title")}</p>
                  <h1 className="mt-2 text-3xl font-bold text-white light:text-zinc-950">{t("settings.title")}</h1>
                  <p className="mt-2 max-w-2xl text-sm text-zinc-400 light:text-zinc-600">{t("settings.subtitle")}</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-3xl border border-zinc-800/80 bg-zinc-900/80 px-4 py-2 text-sm text-zinc-100 shadow-sm shadow-black/20 light:bg-zinc-100 light:text-zinc-900 light:border-zinc-200">
                  <Globe className="h-4.5 w-4.5 text-cyan-300" />
                  {user ? `${user.name} · ${user.email}` : t("settings.userNotLoggedIn")}
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
              <section className="rounded-3xl border border-zinc-800/70 bg-zinc-950/80 p-5 shadow-2xl shadow-black/20 light:bg-white light:border-zinc-200">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white light:text-zinc-950">{t("settings.menuTitle")}</h2>
                    <p className="text-sm text-zinc-400 light:text-zinc-600">{t("settings.menuDescription")}</p>
                  </div>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-cyan-500/20">
                    <Sliders className="h-4 w-4" />
                  </span>
                </div>

                <div className="space-y-3">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCurrentTab(tab.id)}
                      className={`w-full rounded-3xl border px-4 py-4 text-left transition-all ${
                        currentTab === tab.id
                          ? "border-blue-500 bg-blue-500/10 text-white shadow-lg shadow-blue-500/10"
                          : "border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900"
                      }`}
                    >
                      <span className="block text-sm font-semibold">{tab.label}</span>
                      <span className="mt-1 block text-xs text-zinc-500 light:text-zinc-500">{tab.description}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-zinc-800/70 bg-zinc-950/80 p-6 shadow-2xl shadow-black/20 light:bg-white light:border-zinc-200">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-zinc-400 light:text-zinc-500">{currentTab === "language" ? t("settings.tabs.language") : t("settings.tabs.feedback")}</p>
                    <h2 className="mt-2 text-2xl font-bold text-white light:text-zinc-950">{currentTab === "language" ? t("settings.language.title") : t("settings.feedback.title")}</h2>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800/70 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-200 light:bg-zinc-100 light:text-zinc-900">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    {t("settings.onlineSettings")}
                  </div>
                </div>

                {currentTab === "language" ? (
                  <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {languageOptions.map((option) => {
                        const active = languageValue === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setLanguageValue(option.value)}
                            className={`rounded-3xl border px-4 py-4 text-left transition-all ${
                              active
                                ? "border-blue-500 bg-blue-500/10 text-white shadow-lg shadow-blue-500/10"
                                : "border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900"
                            }`}
                          >
                            <span className="font-semibold">{option.label}</span>
                            <p className="mt-2 text-xs text-zinc-500 light:text-zinc-500">{active ? t("settings.language.current") : t("settings.language.selectLanguage")}</p>
                          </button>
                        );
                      })}
                    </div>

                    <div className="rounded-3xl border border-zinc-800/70 bg-zinc-950/80 p-5 light:bg-slate-50 light:border-zinc-200">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white light:text-zinc-950">{t("settings.language.title")}</h3>
                          <p className="text-sm text-zinc-400 light:text-zinc-600">{t("settings.language.saveDescription")}</p>
                        </div>
                        <button
                          type="button"
                          disabled={submittingLanguage}
                          onClick={handleLanguageUpdate}
                          className={`${buttonCls(theme)} ${submittingLanguage ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                          {submittingLanguage ? t("settings.language.saving") : t("settings.language.saveLabel")}
                        </button>
                      </div>
                      {languageStatus && <p className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{languageStatus}</p>}
                      {languageError && <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{languageError}</p>}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {[
                        { id: "bug", label: t("settings.feedback.type.bug") },
                        { id: "suggestion", label: t("settings.feedback.type.suggestion") },
                        { id: "feature_request", label: t("settings.feedback.type.feature_request") },
                        { id: "other", label: t("settings.feedback.type.other") },
                      ].map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setFeedbackType(option.id as any)}
                          className={`rounded-3xl border px-4 py-4 text-left transition-all ${
                            feedbackType === option.id
                              ? "border-blue-500 bg-blue-500/10 text-white shadow-lg shadow-blue-500/10"
                              : "border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900"
                          }`}
                        >
                          <span className="font-semibold">{option.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="grid gap-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-zinc-200 light:text-zinc-900">{t("settings.feedback.labelTitle")}</label>
                        <input
                          value={feedbackTitle}
                          onChange={(e) => setFeedbackTitle(e.target.value)}
                          className={inputCls(theme)}
                          placeholder={t("settings.feedback.placeholderTitle")}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-zinc-200 light:text-zinc-900">{t("settings.feedback.labelContent")}</label>
                        <textarea
                          value={feedbackContent}
                          onChange={(e) => setFeedbackContent(e.target.value)}
                          rows={5}
                          className={inputCls(theme)}
                          placeholder={t("settings.feedback.placeholderContent")}
                        />
                        <p className="mt-2 text-xs text-zinc-500 light:text-zinc-500">{feedbackContent.length}/1000 ký tự</p>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-zinc-200 light:text-zinc-900">{t("settings.feedback.labelEmail")}</label>
                        <input
                          type="email"
                          value={feedbackEmail}
                          onChange={(e) => setFeedbackEmail(e.target.value)}
                          className={inputCls(theme)}
                          placeholder={t("settings.feedback.placeholderEmail")}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-zinc-200 light:text-zinc-900">{t("settings.feedback.labelImages")}</label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:text-white file:font-semibold"
                        />
                        {feedbackImages.length > 0 && (
                          <div className="mt-3 grid gap-3 sm:grid-cols-3">
                            {feedbackImages.map((url) => (
                              <div key={url} className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/80">
                                <img src={url} alt="preview" className="h-24 w-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-zinc-800/70 bg-zinc-950/80 p-5 light:bg-slate-50 light:border-zinc-200">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white light:text-zinc-950">{t("settings.feedback.title")}</h3>
                          <p className="text-sm text-zinc-400 light:text-zinc-600">{t("settings.feedback.helperText")}</p>
                        </div>
                        <button
                          type="button"
                          disabled={submittingFeedback}
                          onClick={handleFeedbackSubmit}
                          className={`${buttonCls(theme)} ${submittingFeedback ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                          {submittingFeedback ? t("settings.feedback.sending") : t("settings.feedback.submit")}
                        </button>
                      </div>
                      {feedbackSuccess && <p className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{feedbackSuccess}</p>}
                      {feedbackError && <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{feedbackError}</p>}
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
