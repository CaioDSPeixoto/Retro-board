"use client";

import type { SubscriptionPlan } from "@/types/user";

type Props = {
  plan: SubscriptionPlan;
  className?: string;
};

const planStyles: Record<SubscriptionPlan, string> = {
  free: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  pro: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  team: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

const planLabels: Record<SubscriptionPlan, string> = {
  free: "Free",
  pro: "Pro",
  team: "Team",
};

export default function PlanBadge({ plan, className = "" }: Props) {
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${planStyles[plan]} ${className}`}>
      {planLabels[plan]}
    </span>
  );
}
