import { getMessages } from "next-intl/server";

type FunStat =
  | {
      icon: string;
      label: string;
      baseValue: number;
      baseDate: string; // YYYY-MM-DD
      dailyIncrement: number;
      prefix?: string; // ex: "+"
    }
  | {
      icon: string;
      label: string;
      type: "daysSinceProdBug" | "daysSinceWarRoom";
    };

function daysBetweenUTC(fromISO: string, to = new Date()) {
  const from = new Date(fromISO + "T00:00:00Z");
  const toUTC = new Date(
    Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate())
  );
  const diffMs = toUTC.getTime() - from.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function computeDailyValue(baseValue: number, baseDate: string, dailyIncrement: number) {
  const days = daysBetweenUTC(baseDate);
  return baseValue + days * dailyIncrement;
}

function formatNumberBR(n: number) {
  return new Intl.NumberFormat("pt-BR").format(n);
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  const messages = await getMessages();
  const t = messages.Home as any;

  const funStats = (t.funStats as FunStat[]) ?? [];
  const lastProdBugAt = (t.lastProdBugAt as string) || "";
  const lastWarRoomAt = (t.lastWarRoomAt as string) || "";

  const computedFunStats = funStats.map((stat) => {
    // 1) base + incremento diário
    if ("baseValue" in stat && "dailyIncrement" in stat && "baseDate" in stat) {
      const value = computeDailyValue(stat.baseValue, stat.baseDate, stat.dailyIncrement);
      const formatted = `${stat.prefix ?? ""}${formatNumberBR(value)}`;
      return { ...stat, value: formatted };
    }

    // 2) dias desde evento
    if ("type" in stat && stat.type === "daysSinceProdBug") {
      const value = lastProdBugAt ? String(daysBetweenUTC(lastProdBugAt)) : "—";
      return { ...stat, value };
    }

    if ("type" in stat && stat.type === "daysSinceWarRoom") {
      const value = lastWarRoomAt ? String(daysBetweenUTC(lastWarRoomAt)) : "—";
      return { ...stat, value };
    }

    return { ...stat, value: "—" };
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      {/* HERO */}
      <section className="rounded-3xl bg-white/90 border border-blue-100 shadow-xl p-8 md:p-10 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
        <h1 className="text-4xl md:text-5xl font-extrabold mt-3 bg-gradient-to-r from-blue-500 to-blue-800 bg-clip-text text-transparent">
          {t.title}
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mt-3">
          {t.subtitle}
        </p>
      </section>

      {/* ABOUT + HIGHLIGHTS */}
      <section className="grid md:grid-cols-2 gap-6">
        {/* ABOUT */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <h2 className="text-lg font-bold text-gray-900">{t.aboutTitle}</h2>
          <p className="text-gray-600 mt-3">{t.aboutBody}</p>
        </div>

        {/* HIGHLIGHTS */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <h2 className="text-lg font-bold text-gray-900">{t.highlightsTitle}</h2>

          <div className="mt-3 grid gap-3">
            {t.highlights.map((item: any, i: number) => (
              <div
                key={i}
                className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 transition-all duration-300 hover:scale-[1.03] hover:bg-blue-100/70 hover:shadow-md"
              >
                <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-600 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STACKS */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <h2 className="text-lg font-bold text-gray-900">{t.stacksTitle}</h2>

        <div className="flex flex-wrap gap-2 mt-4">
          {t.stacks.map((stack: any, i: number) => (
            <span
              key={i}
              className="px-3 py-1 text-sm rounded-full border border-gray-300 bg-gray-50 text-gray-700 transition-all duration-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:scale-105 cursor-default"
            >
              {stack}
            </span>
          ))}
        </div>
      </section>

      {/* TIMELINE */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <h2 className="text-lg font-bold text-gray-900">{t.historyTitle}</h2>
        <p className="text-gray-600 mt-3 mb-6">{t.historyBody}</p>

        <div className="relative border-l-2 border-blue-200 ml-3 space-y-6">
          {t.timeline.map((event: any, i: number) => (
            <div key={i} className="relative pl-6 group">
              <span className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full bg-blue-500 border-2 border-white transition-all duration-300 group-hover:scale-125 group-hover:bg-blue-600" />

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 shadow-sm transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1">
                <p className="text-sm font-bold text-blue-700">{event.year}</p>
                <p className="text-sm text-gray-700 mt-1">{event.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FUN STATS */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <h2 className="text-lg font-bold text-gray-900">{t.funStatsTitle}</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {computedFunStats.map((stat: any, i: number) => (
            <div
              key={i}
              className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-center transition-all duration-300 hover:bg-blue-100 hover:shadow-md hover:-translate-y-1"
            >
              <div className="text-3xl mb-1">{stat.icon}</div>
              <p className="text-2xl font-extrabold text-blue-700">{stat.value}</p>
              <p className="text-xs text-gray-600 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}