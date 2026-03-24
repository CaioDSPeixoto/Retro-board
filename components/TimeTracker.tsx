"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiTrash2, FiCalendar } from "react-icons/fi";
import type { TimeTrackerData, BankSign } from "@/types/time-tracker";
import {
  saveTimeTrackerData,
  getTimeTrackerData,
  deleteTimeTrackerEntry,
} from "@/app/[locale]/tools/time-tracker/actions";

type Props = {
  initialData?: TimeTrackerData | null;
  initialDates?: string[];
  isLoggedIn?: boolean;
  locale?: string;
};

function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function formatDateLabel(dateStr: string, locale: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(
    locale === "pt" ? "pt-BR" : locale === "es" ? "es" : "en",
    { weekday: "short", day: "2-digit", month: "short" }
  );
}

export default function TimeTracker({ initialData, initialDates = [], isLoggedIn = false, locale = "pt" }: Props) {
  const t = useTranslations("TimeTracker");

  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [savedDates, setSavedDates] = useState<string[]>(initialDates);
  const [showCalendar, setShowCalendar] = useState(false);

  const [punches, setPunches] = useState<string[]>(initialData?.punches ?? []);
  const [workload, setWorkload] = useState(initialData?.workload ?? "8h48");
  const [bankTime, setBankTime] = useState(initialData?.bankTime ?? "00:00");
  const [bankSign, setBankSign] = useState<BankSign>(initialData?.bankSign ?? "positive");
  const [bankError, setBankError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const [isLoadingDay, setIsLoadingDay] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const punchRefs = useRef<Array<HTMLInputElement | null>>([]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from localStorage when not logged in
  useEffect(() => {
    if (isLoggedIn) return;
    const stored = localStorage.getItem("timeTrackerPunches");
    if (stored) setPunches(JSON.parse(stored));

    const storedSign = localStorage.getItem("timeTrackerBankSign");
    const storedTimeRaw = localStorage.getItem("timeTrackerBankTime");

    if (storedSign === "negative" || storedSign === "positive") setBankSign(storedSign);

    if (typeof storedTimeRaw === "string" && storedTimeRaw.trim()) {
      let nextSign: BankSign | null = null;
      let timePart = storedTimeRaw.trim();
      if (timePart.startsWith("-")) { nextSign = "negative"; timePart = timePart.slice(1).trim(); }
      else if (timePart.startsWith("+")) { nextSign = "positive"; timePart = timePart.slice(1).trim(); }
      const m = timePart.match(/^(\d{1,2}):(\d{2})$/);
      if (m) {
        setBankTime(`${String(Number(m[1])).padStart(2, "0")}:${m[2]}`);
        if (nextSign) setBankSign(nextSign);
      }
    }
  }, [isLoggedIn]);

  // Save to localStorage when not logged in
  useEffect(() => {
    if (isLoggedIn) return;
    localStorage.setItem("timeTrackerPunches", JSON.stringify(punches));
  }, [punches, isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) return;
    localStorage.setItem("timeTrackerBankTime", bankTime);
  }, [bankTime, isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) return;
    localStorage.setItem("timeTrackerBankSign", bankSign);
  }, [bankSign, isLoggedIn]);

  // Debounced cloud save
  const saveToCloud = useCallback(() => {
    if (!isLoggedIn) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimeTrackerData(punches, workload, bankTime, bankSign, locale, selectedDate).then((res) => {
        if (res && "success" in res) {
          setSavedDates((prev) => prev.includes(selectedDate) ? prev : [selectedDate, ...prev].sort((a, b) => b.localeCompare(a)));
        }
      }).catch(() => {});
    }, 1500);
  }, [isLoggedIn, punches, workload, bankTime, bankSign, locale, selectedDate]);

  useEffect(() => {
    saveToCloud();
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [saveToCloud]);

  // Load day data when switching dates (cloud only)
  const loadDay = useCallback(async (date: string) => {
    if (!isLoggedIn) return;
    setIsLoadingDay(true);
    try {
      const res = await getTimeTrackerData(locale, date);
      if ("data" in res && res.data) {
        setPunches(res.data.punches ?? []);
        setWorkload(res.data.workload ?? "8h48");
        setBankTime(res.data.bankTime ?? "00:00");
        setBankSign(res.data.bankSign ?? "positive");
      } else {
        setPunches([]);
        setWorkload("8h48");
        setBankTime("00:00");
        setBankSign("positive");
      }
    } catch {
      setPunches([]);
    } finally {
      setIsLoadingDay(false);
    }
  }, [isLoggedIn, locale]);

  const navigateDay = (offset: number) => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const date = new Date(y, m - 1, d + offset);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    setSelectedDate(key);
    loadDay(key);
  };

  const goToDate = (date: string) => {
    setSelectedDate(date);
    setShowCalendar(false);
    loadDay(date);
  };

  const handleDeleteDay = async () => {
    if (!isLoggedIn) return;
    setDeleteError(null);
    const res = await deleteTimeTrackerEntry(selectedDate, locale);
    if (res && "error" in res) { setDeleteError(res.error as string); return; }
    setSavedDates((prev) => prev.filter((d) => d !== selectedDate));
    setPunches([]);
    setWorkload("8h48");
    setBankTime("00:00");
    setBankSign("positive");
  };

  // Focus management
  useEffect(() => {
    if (focusIndex == null || focusIndex < 0 || focusIndex >= punches.length) return;
    const el = punchRefs.current[focusIndex];
    if (!el) return;
    requestAnimationFrame(() => { el.scrollIntoView({ block: "center", behavior: "smooth" }); el.focus(); });
    setFocusIndex(null);
  }, [focusIndex, punches.length]);

  const addManual = () => {
    const idx = punches.length;
    setPunches([...punches, ""]);
    setFocusIndex(idx);
  };

  const updatePunch = (index: number, value: string) => {
    const updated = [...punches];
    updated[index] = value;
    setPunches(updated);
  };

  const removePunch = (index: number) => {
    setPunches(punches.filter((_, i) => i !== index));
  };

  const parseTimeMinutes = (raw: string) => {
    const s = (raw || "").trim();
    if (!s || !/^\d{2}:\d{2}$/.test(s)) return null;
    const [h, m] = s.split(":").map(Number);
    const mins = h * 60 + m;
    return Number.isFinite(mins) ? mins : null;
  };

  const formatMins = (m: number) =>
    `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;

  const formatSigned = (m: number) => {
    const sign = m < 0 ? "-" : "+";
    const abs = Math.abs(m);
    return `${sign}${Math.floor(abs / 60)}:${String(abs % 60).padStart(2, "0")}`;
  };

  const calculate = () => {
    const valid = punches.map((p) => (p || "").trim()).filter(Boolean);
    const toMin = (time: string) => { const [h, m] = time.split(":").map(Number); return h * 60 + m; };

    let workedMinutes = 0;
    const breaks: number[] = [];

    for (let i = 0; i < valid.length - 1; i++) {
      const diff = toMin(valid[i + 1]) - toMin(valid[i]);
      if (!Number.isFinite(diff) || diff <= 0) continue;
      if (i % 2 === 0) workedMinutes += diff;
      else breaks.push(diff);
    }

    const rawLunch = breaks.length ? Math.max(...breaks) : 0;
    const lunchMinutes = rawLunch ? Math.min(120, Math.max(60, rawLunch)) : 0;
    const lunchDeficit = Math.max(0, lunchMinutes - rawLunch);
    const workedAdjusted = Math.max(0, workedMinutes - lunchDeficit);

    const daily = workload === "6h" ? 360 : workload === "8h" ? 480 : 528;

    const bankBaseMinutes = parseTimeMinutes(bankTime);
    const bankMinutesSigned =
      typeof bankBaseMinutes === "number" ? bankBaseMinutes * (bankSign === "negative" ? -1 : 1) : null;

    const effectiveDaily =
      typeof bankMinutesSigned === "number" ? Math.max(0, daily - bankMinutesSigned) : daily;

    const remaining = Math.max(0, effectiveDaily - workedAdjusted);
    const extra = Math.max(0, workedAdjusted - effectiveDaily);

    let suggestedExit = "";
    if (valid.length % 2 === 1 && remaining > 0) {
      const total = toMin(valid[valid.length - 1]) + remaining;
      const h = Math.floor(total / 60) % 24;
      const m = total % 60;
      suggestedExit = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }

    return { worked: formatMins(workedAdjusted), lunch: formatMins(lunchMinutes), remaining, extra: formatMins(extra), suggestedExit, bankMinutes: bankMinutesSigned };
  };

  const result = calculate();
  const bankMinutesValue = typeof result.bankMinutes === "number" ? result.bankMinutes : null;
  const isToday = selectedDate === todayKey();

  return (
    <div
      className="border rounded-xl p-4 sm:p-6 shadow-lg"
      style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      {/* Date navigation (cloud only) */}
      {isLoggedIn && (
        <div className="mb-6">
          <div className="flex items-center justify-between gap-2 mb-3">
            <button onClick={() => navigateDay(-1)} className="p-2 rounded-lg border hover:opacity-80 transition" style={{ borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}>
              <FiChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold text-sm transition hover:opacity-80"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-primary)", background: "var(--color-surface-raised)" }}
              >
                <FiCalendar size={16} />
                {isToday ? t("today") : formatDateLabel(selectedDate, locale)}
              </button>
              {!isToday && (
                <button
                  onClick={() => goToDate(todayKey())}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  {t("today")}
                </button>
              )}
            </div>
            <button onClick={() => navigateDay(1)} className="p-2 rounded-lg border hover:opacity-80 transition" style={{ borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}>
              <FiChevronRight size={18} />
            </button>
          </div>

          {/* Calendar dropdown */}
          {showCalendar && savedDates.length > 0 && (
            <div
              className="rounded-xl border p-3 mb-3 max-h-48 overflow-y-auto"
              style={{ background: "var(--color-surface-raised)", borderColor: "var(--color-border)" }}
            >
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-muted)" }}>
                {t("calendarTitle")} — {t("savedDays", { count: savedDates.length })}
              </p>
              <div className="flex flex-wrap gap-2">
                {savedDates.map((d) => (
                  <button
                    key={d}
                    onClick={() => goToDate(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${d === selectedDate ? "bg-blue-600 text-white" : "hover:opacity-80"}`}
                    style={d !== selectedDate ? { background: "var(--color-surface)", color: "var(--color-text-primary)", borderColor: "var(--color-border)" } : {}}
                  >
                    {formatDateLabel(d, locale)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoadingDay && (
            <div className="text-center py-2">
              <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>{t("noEntries")}</span>
            </div>
          )}
        </div>
      )}

      <div
        className="mb-8 border rounded-2xl shadow-sm overflow-hidden"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        {/* HEADER */}
        <div className="px-3 py-3 flex items-center gap-3">
          <button
            onClick={addManual}
            className="flex-[2] px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold shadow"
          >
            {t("addManual")}
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen((p) => !p)}
            className="flex-1 inline-flex justify-center items-center gap-2 px-3 py-2 rounded-xl border hover:opacity-80 transition"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
            aria-expanded={settingsOpen}
          >
            <span className="text-sm font-semibold">{t("settingsTitle")}</span>
            <span className={`transition-transform duration-300 ${settingsOpen ? "rotate-180" : ""}`}>
              <FiChevronDown size={16} />
            </span>
          </button>
        </div>

        {/* COLLAPSE */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${settingsOpen ? "max-h-[500px] opacity-100 border-t" : "max-h-0 opacity-0"}`}
          style={{ background: "var(--color-surface-raised)", borderColor: "var(--color-border)" }}
        >
          <div className="px-4 pb-4 pt-3">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5">
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>{t("workloadLabel")}</label>
                <select
                  className="w-full h-10 px-3 border rounded-xl shadow-sm"
                  style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
                  value={workload}
                  onChange={(e) => setWorkload(e.target.value)}
                >
                  <option value="6h">{t("workload6")}</option>
                  <option value="8h">{t("workload8")}</option>
                  <option value="8h48">{t("workload848")}</option>
                </select>
              </div>
              <div className="lg:col-span-7">
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>{t("bankLabel")}</label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex h-10 rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
                    <button type="button" onClick={() => setBankSign("positive")} className={`flex-1 text-sm font-bold transition-colors ${bankSign === "positive" ? "bg-blue-600 text-white" : ""}`} style={bankSign !== "positive" ? { background: "var(--color-surface)", color: "var(--color-text-secondary)" } : {}}>+</button>
                    <button type="button" onClick={() => setBankSign("negative")} className={`flex-1 text-sm font-bold transition-colors ${bankSign === "negative" ? "bg-blue-600 text-white" : ""}`} style={bankSign !== "negative" ? { background: "var(--color-surface)", color: "var(--color-text-secondary)" } : {}}>-</button>
                  </div>
                  <input type="time" value={bankTime} onChange={(e) => { setBankTime(e.target.value); setBankError(e.target.value.trim() && parseTimeMinutes(e.target.value) == null ? t("bankInvalid") : null); }} className="h-10 border px-3 rounded-xl shadow-sm w-full" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }} />
                  <button type="button" onClick={() => { setBankTime("00:00"); setBankSign("positive"); setBankError(null); }} className="h-10 px-3 rounded-xl border hover:opacity-80 transition font-semibold w-full" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>{t("bankReset")}</button>
                </div>
                <div className="mt-2 min-h-[14px]">
                  {bankError ? <p className="text-[11px] text-red-500">{bankError}</p> : <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{t("bankHint")}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PUNCHES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {punches.map((p, i) => (
          <div key={i} className="flex items-center gap-3">
            <input type="time" value={p} onChange={(e) => updatePunch(i, e.target.value)} ref={(el) => { punchRefs.current[i] = el; }} className="border p-2 rounded-xl shadow-sm w-full" style={{ background: "var(--color-surface-raised)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }} />
            <button onClick={() => removePunch(i)} className="p-2 rounded-lg hover:bg-red-50 transition" style={{ color: "var(--color-text-muted)" }} aria-label={t("deleteDay")}><FiTrash2 size={16} /></button>
          </div>
        ))}
      </div>

      {/* RESULTS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4">
        <Result label={t("worked")} value={result.worked} />
        <Result label={t("lunch")} value={result.lunch} />
        <Result label={t("remaining")} value={formatMins(result.remaining)} />
        <Result label={t("extra")} value={result.extra} />
      </div>

      {result.suggestedExit && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <Result label={t("suggestedExit")} value={result.suggestedExit} />
        </div>
      )}

      {bankMinutesValue !== null && bankMinutesValue !== 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-4">
          <Result label={t("bankLabel")} value={formatSigned(bankMinutesValue)} />
        </div>
      )}

      {/* Delete day button (cloud only) */}
      {isLoggedIn && savedDates.includes(selectedDate) && (
        <div className="mt-6 text-center">
          {deleteError && <p className="text-sm text-red-500 mb-2">{deleteError}</p>}
          <button
            onClick={handleDeleteDay}
            className="text-xs font-semibold transition hover:opacity-80"
            style={{ color: "var(--color-text-muted)" }}
          >
            {t("deleteDay")}
          </button>
        </div>
      )}
    </div>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4 flex flex-col gap-1" style={{ background: "var(--color-accent-subtle)", borderColor: "var(--color-border)" }}>
      <p className="font-medium" style={{ color: "var(--color-text-secondary)" }}>{label}</p>
      <p className="text-xl font-semibold" style={{ color: "var(--color-accent-text)" }}>{value}</p>
    </div>
  );
}
