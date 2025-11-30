export default function LoadingSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-3/4 mb-2 skeleton"></div>
      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-1/2 skeleton"></div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 animate-fade-in">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg w-1/2 skeleton"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded skeleton"></div>
          <div className="h-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded w-5/6 skeleton"></div>
          <div className="h-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded w-4/6 skeleton"></div>
        </div>
        <div className="pt-4 border-t border-gray-200">
          <div className="h-10 bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 rounded-lg w-32 skeleton"></div>
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
      <div className="animate-pulse">
        {/* Header */}
        <div className="flex p-4 border-b-2 border-gray-200 bg-gray-50 gap-4">
          <div className="h-5 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 rounded flex-1 skeleton"></div>
          <div className="h-5 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 rounded w-24 skeleton"></div>
          <div className="h-5 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 rounded w-24 skeleton"></div>
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex p-4 border-b border-gray-100 gap-4 hover:bg-gray-50 transition-colors">
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded flex-1 skeleton" style={{ animationDelay: `${i * 100}ms` }}></div>
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-20 skeleton" style={{ animationDelay: `${i * 100}ms` }}></div>
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-20 skeleton" style={{ animationDelay: `${i * 100}ms` }}></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white shadow-lg rounded-xl p-6 animate-fade-in-up">
      <div className="animate-pulse flex justify-between items-start">
        <div className="flex-1">
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-24 mb-3 skeleton"></div>
          <div className="h-10 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 rounded w-20 skeleton"></div>
        </div>
        <div className="w-12 h-12 bg-gradient-to-br from-blue-200 to-purple-200 rounded-lg skeleton"></div>
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 animate-fade-in">
      <div className="animate-pulse">
        <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg w-1/3 mb-6 skeleton"></div>
        <div className="h-64 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 rounded-xl skeleton"></div>
      </div>
    </div>
  );
}

