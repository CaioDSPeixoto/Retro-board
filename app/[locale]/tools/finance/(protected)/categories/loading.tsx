"use client";

export default function FinanceCategoriesLoading() {
  return (
    <div className="max-w-2xl mx-auto px-6 pb-24 pt-8 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="h-8 w-56 bg-gray-200 rounded-lg" />
          <div className="mt-2 h-4 w-72 bg-gray-200 rounded" />
        </div>
      </div>

      <div className="mt-8 space-y-8">
        <div>
          <div className="flex justify-between items-center mb-3 px-1">
            <div className="h-4 w-40 bg-gray-200 rounded" />
            <div className="h-5 w-10 bg-gray-200 rounded-full" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-3 border-b border-gray-50 bg-gray-50/50">
              <div className="h-10 bg-gray-200 rounded-xl" />
            </div>
            <div className="divide-y divide-gray-100">
              <div className="h-12 bg-gray-200/60" />
              <div className="h-12 bg-gray-200/60" />
              <div className="h-12 bg-gray-200/60" />
            </div>
          </div>
        </div>

        <div>
          <div className="h-4 w-44 bg-gray-200 rounded mb-3 px-1" />
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              <div className="h-12 bg-gray-200/60" />
              <div className="h-12 bg-gray-200/60" />
              <div className="h-12 bg-gray-200/60" />
              <div className="h-12 bg-gray-200/60" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

