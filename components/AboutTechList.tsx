"use client";

import { useState } from "react";
import { FiChevronRight } from "react-icons/fi";

type TechItem = {
  name: string;
  project: string;
};

type Props = {
  techs: TechItem[];
};

const TECH_ICONS: Record<string, string> = {
  "C# / .NET": "⚙️",
  "Python": "🐍",
  "React / Next.js": "⚛️",
  "Banco de Dados": "🗄️",
  "Databases": "🗄️",
  "Bases de Datos": "🗄️",
  "Tech Lead": "👥",
};

export default function AboutTechList({ techs }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {techs.map((tech, i) => {
        const isOpen = openIdx === i;
        const icon = TECH_ICONS[tech.name] ?? "💻";

        return (
          <div key={i}>
            <button
              type="button"
              onClick={() => setOpenIdx(isOpen ? null : i)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer group"
              style={{
                background: isOpen ? "var(--color-accent-subtle)" : "var(--color-surface-raised)",
                borderColor: isOpen ? "var(--color-accent-primary)" : "var(--color-border)",
              }}
            >
              <span className="text-lg shrink-0">{icon}</span>
              <span
                className="text-sm font-semibold flex-1"
                style={{ color: isOpen ? "var(--color-accent-text)" : "var(--color-text-primary)" }}
              >
                {tech.name}
              </span>
              <FiChevronRight
                className="shrink-0 transition-transform duration-200"
                style={{
                  color: "var(--color-text-muted)",
                  transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                }}
                size={16}
              />
            </button>

            <div
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{
                maxHeight: isOpen ? "200px" : "0px",
                opacity: isOpen ? 1 : 0,
              }}
            >
              <div
                className="mx-3 mt-1 mb-1 px-3 py-2.5 rounded-lg border-l-2 text-xs leading-relaxed"
                style={{
                  color: "var(--color-text-secondary)",
                  borderColor: "var(--color-accent-primary)",
                  background: "var(--color-accent-subtle)",
                }}
              >
                {tech.project}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
