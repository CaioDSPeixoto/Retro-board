"use client";

import { useState, useCallback } from "react";

type EasterEggType = "bug" | "coffee" | "warRoom" | "none";

type Props = {
  icon: string;
  value: string;
  label: string;
  delay: number;
  easterEgg: EasterEggType;
};

export default function FunStatCard({ icon, value, label, delay, easterEgg }: Props) {
  const [clicks, setClicks] = useState(0);
  const [triggered, setTriggered] = useState(false);
  const [wobble, setWobble] = useState(false);

  const threshold =
    easterEgg === "bug" ? 5 : easterEgg === "coffee" ? 7 : easterEgg === "warRoom" ? 6 : 999;

  const handleClick = useCallback(() => {
    if (triggered || easterEgg === "none") return;

    const next = clicks + 1;
    setClicks(next);

    setWobble(true);
    setTimeout(() => setWobble(false), 400);

    if (next >= threshold) {
      setTriggered(true);
    }
  }, [clicks, triggered, easterEgg, threshold]);

  // Determine display based on easter egg state
  let displayIcon = icon;
  let displayValue = value;
  let displayLabel = label;

  if (triggered) {
    if (easterEgg === "bug") {
      displayIcon = "🐞";
      displayValue = "???";
    } else if (easterEgg === "coffee") {
      displayIcon = "💧";
      displayValue = "∞";
      displayLabel = "Hidrate-se!";
    } else if (easterEgg === "warRoom") {
      displayIcon = "🚨";
      displayValue = "???";
      displayLabel = "Deu algum BO?";
    }
  }

  // Bug flies away
  const bugFlyStyle: React.CSSProperties =
    easterEgg === "bug" && triggered
      ? {
          transform: "translateY(-120px) rotate(720deg) scale(0)",
          opacity: 0,
          transition: "all 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55)",
        }
      : {};

  // Coffee shakes increasingly
  const coffeeShakeStyle: React.CSSProperties =
    easterEgg === "coffee" && !triggered && clicks > 0
      ? {
          transform: `rotate(${clicks % 2 === 0 ? clicks * 3 : -clicks * 3}deg) scale(${1 + clicks * 0.05})`,
          transition: "all 0.3s ease",
        }
      : {};

  // Coffee triggered — icon morphs
  const coffeeTriggeredStyle: React.CSSProperties =
    easterEgg === "coffee" && triggered
      ? {
          transform: "scale(1.4)",
          transition: "all 0.5s ease",
        }
      : {};

  // War room alarm effect
  const warRoomShakeStyle: React.CSSProperties =
    easterEgg === "warRoom" && !triggered && clicks > 0
      ? {
          transform: `rotate(${clicks % 2 === 0 ? 15 : -15}deg)`,
          transition: "all 0.2s ease",
        }
      : {};

  // War room triggered — flashing
  const warRoomTriggeredStyle: React.CSSProperties =
    easterEgg === "warRoom" && triggered
      ? {
          animation: "gentlePulse 0.5s ease infinite",
        }
      : {};

  // Wobble for all types
  const wobbleStyle: React.CSSProperties =
    wobble && !triggered
      ? {
          transform: `rotate(${clicks % 2 === 0 ? 20 : -20}deg) scale(1.3)`,
          transition: "all 0.3s ease",
        }
      : {};

  // Merge icon styles (wobble takes priority when active)
  const iconStyle: React.CSSProperties = {
    ...coffeeShakeStyle,
    ...coffeeTriggeredStyle,
    ...warRoomShakeStyle,
    ...warRoomTriggeredStyle,
    ...bugFlyStyle,
    ...(wobble && !triggered ? wobbleStyle : {}),
    ...(easterEgg === "bug" && !triggered && !wobble ? { transition: "all 0.3s ease" } : {}),
  };

  return (
    <div
      onClick={handleClick}
      className={`rounded-xl border p-4 text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1 animate-scaleIn group ${
        easterEgg !== "none" ? "cursor-pointer select-none" : ""
      }`}
      style={{
        background: triggered && easterEgg === "warRoom"
          ? "rgba(239, 68, 68, 0.1)"
          : triggered && easterEgg === "coffee"
            ? "rgba(59, 130, 246, 0.1)"
            : "var(--color-accent-subtle)",
        borderColor: triggered && easterEgg === "warRoom"
          ? "rgba(239, 68, 68, 0.3)"
          : "var(--color-border)",
        animationDelay: `${delay}ms`,
        transition: "all 0.5s ease",
      }}
    >
      <div
        className="text-3xl mb-1"
        style={iconStyle}
      >
        {displayIcon}
      </div>
      <p
        className="text-2xl font-extrabold transition-all duration-300"
        style={{
          color: triggered && easterEgg === "warRoom"
            ? "rgb(239, 68, 68)"
            : triggered && easterEgg === "coffee"
              ? "rgb(59, 130, 246)"
              : "var(--color-accent-text)",
        }}
      >
        {displayValue}
      </p>
      <p
        className="text-xs mt-1 transition-all duration-300"
        style={{
          color: triggered
            ? easterEgg === "warRoom"
              ? "rgb(239, 68, 68)"
              : easterEgg === "coffee"
                ? "rgb(59, 130, 246)"
                : "var(--color-text-secondary)"
            : "var(--color-text-secondary)",
        }}
      >
        {displayLabel}
      </p>
    </div>
  );
}
