import SkeletonBlock from "@/components/ui/SkeletonBlock";

export default function FinanceBoardsLoading() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 animate-pulse">
      <div className="space-y-2">
        <SkeletonBlock className="h-7 w-48" />
        <SkeletonBlock className="h-4 w-64" />
      </div>

      <SkeletonBlock className="h-24 rounded-xl" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border border-gray-200 p-5 rounded-xl bg-white shadow-sm space-y-3">
            <SkeletonBlock className="h-4 w-40" />
            <SkeletonBlock className="h-3 w-24" />
            <div className="flex items-center justify-between mt-2">
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
