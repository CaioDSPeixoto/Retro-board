import { getMessages } from "next-intl/server";
import StackPill from "@/components/StackPill";
import FunStatCard from "@/components/FunStatCard";
import AboutTechList from "@/components/AboutTechList";

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
      {/* HERO — entrada com scale + fade */}
      <section
        className="rounded-3xl border shadow-xl p-8 md:p-10 relative overflow-hidden animate-scaleIn"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        {/* Decorative floating shapes */}
        <div className="absolute top-4 right-6 w-16 h-16 rounded-full bg-blue-500/10 animate-float pointer-events-none" />
        <div className="absolute bottom-6 right-20 w-10 h-10 rounded-full bg-blue-400/10 animate-float anim-delay-300 pointer-events-none" />
        <div className="absolute top-12 right-40 w-6 h-6 rounded-full bg-blue-300/10 animate-float anim-delay-600 pointer-events-none" />

        <h1 className="text-4xl md:text-5xl font-extrabold mt-3 heading-gradient animate-fadeInUp">
          {t.title}
        </h1>
        <p
          className="text-lg md:text-xl mt-3 animate-fadeInUp anim-delay-200"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {t.subtitle}
        </p>
      </section>

      {/* ABOUT + HIGHLIGHTS — staggered left/right */}
      <section className="grid md:grid-cols-2 gap-6">
        <div
          className="rounded-2xl border shadow-sm p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-fadeInLeft anim-delay-100"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{t.aboutTitle}</h2>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {t.aboutExperience} {t.aboutExperienceSuffix}
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            {t.aboutBio}
          </p>
          <p className="mt-3 text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
            {t.aboutTechsTitle}
          </p>
          <div className="mt-2">
            <AboutTechList techs={t.aboutTechs as { name: string; project: string }[]} />
          </div>
        </div>

        <div
          className="rounded-2xl border shadow-sm p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-fadeInRight anim-delay-200"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{t.highlightsTitle}</h2>
          <div className="mt-3 grid gap-3">
            {t.highlights.map((item: any, i: number) => (
              <div
                key={i}
                className="rounded-xl border p-3 transition-all duration-300 hover:scale-[1.03] hover:shadow-md animate-fadeInUp"
                style={{
                  background: "var(--color-accent-subtle)",
                  borderColor: "var(--color-border)",
                  animationDelay: `${300 + i * 100}ms`,
                }}
              >
                <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{item.title}</p>
                <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STACKS — fade in com pills animadas */}
      <section
        className="rounded-2xl border shadow-sm p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-fadeInUp anim-delay-300"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{t.stacksTitle}</h2>
        <div className="flex flex-wrap gap-2 mt-4">
          {t.stacks.map((stack: any, i: number) => (
            <StackPill key={i} label={stack} delay={400 + i * 50} />
          ))}
        </div>
      </section>

      {/* TIMELINE — staggered entries */}
      <section
        className="rounded-2xl border shadow-sm p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-fadeInUp anim-delay-400"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{t.historyTitle}</h2>
        <p className="mt-3 mb-6" style={{ color: "var(--color-text-secondary)" }}>{t.historyBody}</p>

        <div className="relative border-l-2 border-blue-400 ml-3 space-y-6">
          {t.timeline.map((event: any, i: number) => (
            <div key={i} className="relative pl-6 group animate-fadeInLeft" style={{ animationDelay: `${500 + i * 120}ms` }}>
              <span className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full bg-blue-500 border-2 border-[var(--color-surface)] transition-all duration-300 group-hover:scale-125 group-hover:bg-blue-600 group-hover:shadow-lg group-hover:shadow-blue-500/30" />
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

      {/* FUN STATS — staggered scale in */}
      <section
        className="rounded-2xl border shadow-sm p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-fadeInUp anim-delay-500"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{t.funStatsTitle}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {computedFunStats.map((stat: any, i: number) => {
            const easterEgg =
              stat.icon === "🐞" ? "bug" as const
              : stat.icon === "☕" ? "coffee" as const
              : stat.icon === "🚨" ? "warRoom" as const
              : "none" as const;

            return (
              <FunStatCard
                key={i}
                icon={stat.icon}
                value={stat.value}
                label={stat.label}
                delay={600 + i * 100}
                easterEgg={easterEgg}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
