"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { FiTrash2 } from "react-icons/fi";

export default function TimeTracker() {
  const t = useTranslations("TimeTracker");

  const [punches, setPunches] = useState<string[]>([]);
  const [workload, setWorkload] = useState("8h48");

  // Load punches
  useEffect(() => {
    const stored = localStorage.getItem("timeTrackerPunches");
    if (stored) setPunches(JSON.parse(stored));
  }, []);

  // Save punches
  useEffect(() => {
    localStorage.setItem("timeTrackerPunches", JSON.stringify(punches));
  }, [punches]);

  const registerNow = () => {
    const now = new Date();
    const formatted = now.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setPunches([...punches, formatted]);
  };

  const addManual = () => setPunches([...punches, ""]);

  const updatePunch = (index: number, value: string) => {
    const updated = [...punches];
    updated[index] = value;
    setPunches(updated);
  };

  const removePunch = (index: number) => {
    setPunches(punches.filter((_, i) => i !== index));
  };

  const convert = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const format = (m: number) =>
    `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;

  const calculate = () => {
    let workedMinutes = 0;
    let lunchMinutes = 0;

    for (let i = 0; i < punches.length - 1; i++) {
      const start = punches[i];
      const end = punches[i + 1];
      if (!start || !end) continue;

      const diff = convert(end) - convert(start);

      // Índices pares = trabalho | ímpares = pausa
      if (i % 2 === 0) {
        workedMinutes += diff;
      } else {
        lunchMinutes += diff;
      }
    }

    const daily =
      workload === "6h" ? 360 : workload === "8h" ? 480 : 528;

    const remaining = Math.max(0, daily - workedMinutes);
    const extra = Math.max(0, workedMinutes - daily);

    let suggestedExit = "";
    if (punches.length % 2 === 1 && remaining > 0) {
      const lastPunch = punches[punches.length - 1];
      if (lastPunch) {
        const total = convert(lastPunch) + remaining;
        const h = Math.floor(total / 60) % 24;
        const m = total % 60;
        suggestedExit = `${String(h).padStart(2, "0")}:${String(m).padStart(
          2,
          "0"
        )}`;
      }
    }

    return {
      worked: format(workedMinutes),
      lunch: format(lunchMinutes),
      remaining,
      extra: format(extra),
      suggestedExit,
    };
  };

  const result = calculate();

  return (
    <div className="border border-blue-200 rounded-xl p-6 bg-white shadow-lg">
      {/* Buttons */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
        <button
          onClick={registerNow}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium shadow"
        >
          {t("registerNow")}
        </button>

        <button
          onClick={addManual}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition font-medium shadow-sm"
        >
          {t("addManual")}
        </button>

        <select
          className="px-3 py-2 border border-gray-300 rounded-xl shadow-sm text-gray-800"
          value={workload}
          onChange={(e) => setWorkload(e.target.value)}
        >
          <option value="6h">{t("workload6")}</option>
          <option value="8h">{t("workload8")}</option>
          <option value="8h48">{t("workload848")}</option>
        </select>
      </div>

      {/* Punch list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {punches.map((p, i) => (
          <div key={i} className="flex items-center gap-3">
            <input
              type="time"
              value={p}
              onChange={(e) => updatePunch(i, e.target.value)}
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

      {/* Results */}
      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <Result label={t("worked")} value={result.worked} />
        <Result label={t("lunch")} value={result.lunch} />
        <Result label={t("remaining")} value={format(result.remaining)} />
        <Result label={t("extra")} value={result.extra} />
      </div>

      {result.suggestedExit && (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Result label={t("suggestedExit")} value={result.suggestedExit} />
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
