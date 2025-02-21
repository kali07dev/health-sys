// components/PageHeaderSkeleton.tsx
export default function PageHeaderSkeleton() {
    return (
      <div className="relative mb-8 overflow-hidden rounded-lg bg-gradient-to-r from-gray-900 to-gray-800 p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 rounded bg-gray-700"></div>
            <div className="h-4 w-20 rounded bg-gray-700"></div>
          </div>
          <div className="mt-2 h-8 w-48 rounded bg-gray-700"></div>
          <div className="mt-4 h-0.5 w-20 rounded bg-gray-700"></div>
        </div>
      </div>
    );
  }