import { getMessages } from "next-intl/server";

type FunStat =
  | {
      icon: string;
      label: string;
      baseValue: number;
      baseDate: string;
      dailyIncrement: number;
      prefix?: string;
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
    if ("baseValue" in stat && "dailyIncrement" in stat && "baseDate" in stat) {
      const value = computeDailyValue(stat.baseValue, stat.baseDate, stat.dailyIncrement);
      const formatted = `${stat.prefix ?? ""}${formatNumberBR(value)}`;
      return { ...stat, value: formatted };
    }
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
      <section
        className="rounded-3xl border shadow-xl p-8 md:p-10 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <h1 className="text-4xl md:text-5xl font-extrabold mt-3 heading-gradient">
          {t.title}
        </h1>
        <p className="text-lg md:text-xl mt-3" style={{ color: "var(--color-text-secondary)" }}>
          {t.subtitle}
        </p>
      </section>

      {/* ABOUT + HIGHLIGHTS */}
      <section className="grid md:grid-cols-2 gap-6">
        <div
          className="rounded-2xl border shadow-sm p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{t.aboutTitle}</h2>
          <p className="mt-3" style={{ color: "var(--color-text-secondary)" }}>{t.aboutBody}</p>
        </div>

        <div
          className="rounded-2xl border shadow-sm p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{t.highlightsTitle}</h2>
          <div className="mt-3 grid gap-3">
            {t.highlights.map((item: any, i: number) => (
              <div
                key={i}
                className="rounded-xl border p-3 transition-all duration-300 hover:scale-[1.03] hover:shadow-md"
                style={{ background: "var(--color-accent-subtle)", borderColor: "var(--color-border)" }}
              >
                <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{item.title}</p>
                <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STACKS */}
      <section
        className="rounded-2xl border shadow-sm p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{t.stacksTitle}</h2>
        <div className="flex flex-wrap gap-2 mt-4">
          {t.stacks.map((stack: any, i: number) => (
            <span
              key={i}
              className="px-3 py-1 text-sm rounded-full border transition-all duration-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:scale-105 cursor-default"
              style={{
                background: "var(--color-surface-raised)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
            >
              {stack}
            </span>
          ))}
        </div>
      </section>

      {/* TIMELINE */}
      <section
        className="rounded-2xl border shadow-sm p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{t.historyTitle}</h2>
        <p className="mt-3 mb-6" style={{ color: "var(--color-text-secondary)" }}>{t.historyBody}</p>

        <div className="relative border-l-2 border-blue-400 ml-3 space-y-6">
          {t.timeline.map((event: any, i: number) => (
            <div key={i} className="relative pl-6 group">
              <span className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full bg-blue-500 border-2 border-white transition-all duration-300 group-hover:scale-125 group-hover:bg-blue-600" />
              <div
                className="rounded-xl border p-4 shadow-sm transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1"
                style={{ background: "var(--color-accent-subtle)", borderColor: "var(--color-border)" }}
              >
                <p className="text-sm font-bold" style={{ color: "var(--color-accent-text)" }}>{event.year}</p>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>{event.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FUN STATS */}
      <section
        className="rounded-2xl border shadow-sm p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{t.funStatsTitle}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {computedFunStats.map((stat: any, i: number) => (
            <div
              key={i}
              className="rounded-xl border p-4 text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1"
              style={{ background: "var(--color-accent-subtle)", borderColor: "var(--color-border)" }}
            >
              <div className="text-3xl mb-1">{stat.icon}</div>
              <p className="text-2xl font-extrabold" style={{ color: "var(--color-accent-text)" }}>{stat.value}</p>
              <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
