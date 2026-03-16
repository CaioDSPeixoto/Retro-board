"use client";

import SkeletonBlock from "@/components/ui/SkeletonBlock";

export default function FinanceProtectedLoading() {
  return (
    <div className="max-w-4xl mx-auto px-6 pb-10 pt-6 animate-pulse">
      <SkeletonBlock className="h-8 w-40" />
      <SkeletonBlock className="mt-4 h-24 rounded-2xl" />
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SkeletonBlock className="h-20 rounded-2xl" />
        <SkeletonBlock className="h-20 rounded-2xl" />
      </div>
      <div className="mt-6 flex justify-between items-center">
        <SkeletonBlock className="h-8 w-24" />
        <SkeletonBlock className="h-8 w-40 rounded-xl" />
      </div>
      <div className="mt-4 space-y-3">
        <SkeletonBlock className="h-16 rounded-xl" />
        <SkeletonBlock className="h-16 rounded-xl" />
        <SkeletonBlock className="h-16 rounded-xl" />
      </div>
    </div>
  );
}
