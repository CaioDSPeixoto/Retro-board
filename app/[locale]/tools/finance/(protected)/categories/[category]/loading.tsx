"use client";

import SkeletonBlock from "@/components/ui/SkeletonBlock";

export default function FinanceCategoryDetailLoading() {
  return (
    <div className="max-w-2xl mx-auto px-6 pb-24 pt-8 animate-pulse">
      <div className="flex items-center gap-4">
        <SkeletonBlock className="h-10 w-10 rounded-full" />
        <div className="flex-1">
          <SkeletonBlock className="h-8 w-64" />
          <SkeletonBlock className="mt-2 h-4 w-56 rounded" />
        </div>
      </div>

      <div className="mt-8 finance-surface rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)]">
          <SkeletonBlock className="h-10 rounded-xl" />
        </div>
        <div className="divide-y divide-[var(--color-border-subtle)]">
          {[0, 1, 2].map((i) => (
            <SkeletonBlock key={i} className="h-14 rounded-none" />
          ))}
        </div>
      </div>
    </div>
  );
}
