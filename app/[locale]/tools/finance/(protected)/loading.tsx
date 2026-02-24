"use client";

export default function FinanceProtectedLoading() {
  return (
    <div className="max-w-4xl mx-auto px-6 pb-10 pt-6 animate-pulse">
      <div className="h-8 w-40 bg-gray-200 rounded-lg" />
      <div className="mt-4 h-24 bg-gray-200 rounded-2xl" />
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="h-20 bg-gray-200 rounded-2xl" />
        <div className="h-20 bg-gray-200 rounded-2xl" />
      </div>

      <div className="mt-6 flex justify-between items-center">
        <div className="h-8 w-24 bg-gray-200 rounded-lg" />
        <div className="h-8 w-40 bg-gray-200 rounded-xl" />
      </div>

      <div className="mt-4 space-y-3">
        <div className="h-16 bg-gray-200 rounded-xl" />
        <div className="h-16 bg-gray-200 rounded-xl" />
        <div className="h-16 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}

