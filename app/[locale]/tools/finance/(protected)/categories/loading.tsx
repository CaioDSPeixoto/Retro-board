"use client";

import SkeletonBlock from "@/components/ui/SkeletonBlock";

export default function FinanceCategoriesLoading() {
  return (
    <div className="max-w-2xl mx-auto px-6 pb-24 pt-8 animate-pulse">
      <div className="flex items-center gap-4">
        <SkeletonBlock className="h-10 w-10 rounded-full" />
        <div className="flex-1">
          <SkeletonBlock className="h-8 w-56" />
          <SkeletonBlock className="mt-2 h-4 w-72 rounded" />
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {[0, 1].map((i) => (
          <div key={i}>
            <div className="flex justify-between items-center mb-3 px-1">
              <SkeletonBlock className="h-4 w-40 rounded" />
              <SkeletonBlock className="h-5 w-10 rounded-full" />
            </div>
            <div className="finance-surface rounded-2xl border shadow-sm overflow-hidden">
              <div className="p-3 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
                <SkeletonBlock className="h-10 rounded-xl" />
              </div>
              <div className="divide-y divide-[var(--color-border-subtle)]">
                {[0, 1, 2].map((j) => (
                  <SkeletonBlock key={j} className="h-12 rounded-none" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
