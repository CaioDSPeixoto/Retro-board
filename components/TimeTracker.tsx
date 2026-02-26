"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FiChevronDown, FiTrash2 } from "react-icons/fi";

type BankSign = "positive" | "negative";

export default function TimeTracker() {
  const t = useTranslations("TimeTracker");

  const [punches, setPunches] = useState<string[]>([]);
  const [workload, setWorkload] = useState("8h48");

  const [bankTime, setBankTime] = useState("00:00");
  const [bankSign, setBankSign] = useState<BankSign>("positive");
  const [bankError, setBankError] = useState<string | null>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const punchRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const stored = localStorage.getItem("timeTrackerPunches");
    if (stored) setPunches(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem("timeTrackerPunches", JSON.stringify(punches));
  }, [punches]);

  useEffect(() => {
    const storedSign = localStorage.getItem("timeTrackerBankSign");
    const storedTimeRaw = localStorage.getItem("timeTrackerBankTime");

    if (storedSign === "negative" || storedSign === "positive") {
      setBankSign(storedSign);
    }

    if (typeof storedTimeRaw !== "string") return;
    const raw = storedTimeRaw.trim();
    if (!raw) return;

    let nextSign: BankSign | null = null;
    let timePart = raw;

    if (timePart.startsWith("-")) {
      nextSign = "negative";
      timePart = timePart.slice(1).trim();
    } else if (timePart.startsWith("+")) {
      nextSign = "positive";
      timePart = timePart.slice(1).trim();
    }

    const m = timePart.match(/^(\d{1,2}):(\d{2})$/);
    if (m) {
      const hh = String(Number(m[1])).padStart(2, "0");
      const mm = m[2];
      setBankTime(`${hh}:${mm}`);
      if (nextSign) setBankSign(nextSign);
      return;
    }

    if (/^\d{2}:\d{2}$/.test(timePart)) {
      setBankTime(timePart);
      if (nextSign) setBankSign(nextSign);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("timeTrackerBankTime", bankTime);
  }, [bankTime]);

  useEffect(() => {
    localStorage.setItem("timeTrackerBankSign", bankSign);
  }, [bankSign]);

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

  const convertToMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const format = (m: number) =>
    `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;

  const formatSigned = (m: number) => {
    const sign = m < 0 ? "-" : "+";
    const abs = Math.abs(m);
    return `${sign}${Math.floor(abs / 60)}:${String(abs % 60).padStart(2, "0")}`;
  };

  const parseTimeMinutes = (raw: string) => {
    const s = (raw || "").trim();
    if (!s) return null;
    if (!/^\d{2}:\d{2}$/.test(s)) return null;
    const mins = convertToMinutes(s);
    if (!Number.isFinite(mins)) return null;
    return mins;
  };

  useEffect(() => {
    if (focusIndex == null) return;
    if (focusIndex < 0 || focusIndex >= punches.length) return;
    const el = punchRefs.current[focusIndex];
    if (!el) return;

    requestAnimationFrame(() => {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      el.focus();
    });

    setFocusIndex(null);
  }, [focusIndex, punches.length]);

  const calculate = () => {
    let workedMinutes = 0;
    let lunchMinutes = 0;

    for (let i = 0; i < punches.length - 1; i++) {
      const start = punches[i];
      const end = punches[i + 1];
      if (!start || !end) continue;

      const diff = convertToMinutes(end) - convertToMinutes(start);

      if (i % 2 === 0) workedMinutes += diff;
      else lunchMinutes += diff;
    }

    const daily = workload === "6h" ? 360 : workload === "8h" ? 480 : 528;

    const bankBaseMinutes = parseTimeMinutes(bankTime);
    const bankMinutesSigned =
      typeof bankBaseMinutes === "number"
        ? bankBaseMinutes * (bankSign === "negative" ? -1 : 1)
        : null;

    const effectiveDaily =
      typeof bankMinutesSigned === "number"
        ? Math.max(0, daily - bankMinutesSigned)
        : daily;

    const remaining = Math.max(0, effectiveDaily - workedMinutes);
    const extra = Math.max(0, workedMinutes - effectiveDaily);

    let suggestedExit = "";
    if (punches.length % 2 === 1 && remaining > 0) {
      const lastPunch = punches[punches.length - 1];
      if (lastPunch) {
        const total = convertToMinutes(lastPunch) + remaining;
        const h = Math.floor(total / 60) % 24;
        const m = total % 60;
        suggestedExit = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      }
    }

    return {
      worked: format(workedMinutes),
      lunch: format(lunchMinutes),
      remaining,
      extra: format(extra),
      suggestedExit,
      bankMinutes: bankMinutesSigned,
    };
  };

  const result = calculate();
  const bankMinutesValue =
    typeof result.bankMinutes === "number" ? result.bankMinutes : null;

  return (
    <div className="border border-blue-200 rounded-xl p-4 sm:p-6 bg-white shadow-lg">
      <div className="mb-8 border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden">

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
            className="flex-1 inline-flex justify-center items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition text-gray-800"
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
          className={`transition-all duration-300 ease-in-out overflow-hidden bg-gray-50 ${
            settingsOpen ? "max-h-[500px] opacity-100 border-t border-gray-200" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-4 pb-4 pt-3">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              <div className="lg:col-span-5">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {t("workloadLabel")}
                </label>
                <select
                  className="w-full h-10 px-3 border border-gray-300 rounded-xl shadow-sm text-gray-800 bg-white"
                  value={workload}
                  onChange={(e) => setWorkload(e.target.value)}
                >
                  <option value="6h">{t("workload6")}</option>
                  <option value="8h">{t("workload8")}</option>
                  <option value="8h48">{t("workload848")}</option>
                </select>
              </div>

              <div className="lg:col-span-7">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {t("bankLabel")}
                </label>

                <div className="grid grid-cols-3 gap-3">

                  <div className="flex h-10 rounded-xl border border-gray-300 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setBankSign("positive")}
                      className={`flex-1 text-sm font-bold ${
                        bankSign === "positive"
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700"
                      }`}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => setBankSign("negative")}
                      className={`flex-1 text-sm font-bold ${
                        bankSign === "negative"
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700"
                      }`}
                    >
                      -
                    </button>
                  </div>

                  <input
                    type="time"
                    value={bankTime}
                    onChange={(e) => {
                      const next = e.target.value;
                      setBankTime(next);
                      const parsed = parseTimeMinutes(next);
                      setBankError(next.trim() && parsed == null ? t("bankInvalid") : null);
                    }}
                    className="h-10 border border-gray-300 px-3 rounded-xl shadow-sm text-gray-800 w-full bg-white"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setBankTime("00:00");
                      setBankSign("positive");
                      setBankError(null);
                    }}
                    className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition font-semibold w-full"
                  >
                    {t("bankReset")}
                  </button>
                </div>

                <div className="mt-2 min-h-[14px]">
                  {bankError ? (
                    <p className="text-[11px] text-red-600">{bankError}</p>
                  ) : (
                    <p className="text-[11px] text-gray-500">{t("bankHint")}</p>
                  )}
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
            <input
              type="time"
              value={p}
              onChange={(e) => updatePunch(i, e.target.value)}
              ref={(el) => {
                punchRefs.current[i] = el;
              }}
              className="border border-gray-300 p-2 rounded-xl shadow-sm text-gray-800 w-full"
            />
            <button
              onClick={() => removePunch(i)}
              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition shadow-sm"
            >
              <FiTrash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* RESULTS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4">
        <Result label={t("worked")} value={result.worked} />
        <Result label={t("lunch")} value={result.lunch} />
        <Result label={t("remaining")} value={format(result.remaining)} />
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
    </div>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-blue-200 rounded-xl p-4 bg-blue-50 flex flex-col gap-1">
      <p className="text-gray-600 font-medium">{label}</p>
      <p className="text-xl font-semibold text-blue-700">{value}</p>
    </div>
  );
}