export default function FinanceBoardsLoading() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-48 bg-gray-200 rounded-lg" />
        <div className="h-4 w-64 bg-gray-200 rounded-lg" />
      </div>

      <div className="h-24 bg-gray-100 rounded-xl" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="border border-gray-200 p-5 rounded-xl bg-white shadow-sm space-y-3"
          >
            <div className="h-4 w-40 bg-gray-200 rounded-lg" />
            <div className="h-3 w-24 bg-gray-100 rounded-lg" />
            <div className="flex items-center justify-between mt-2">
              <div className="h-3 w-20 bg-gray-100 rounded-lg" />
              <div className="h-3 w-16 bg-gray-100 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
