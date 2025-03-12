// app/notifications/components/NotificationsSkeletonLoader.tsx
export default function NotificationsSkeletonLoader() {
    // Generate 5 skeleton items
    const skeletonItems = Array.from({ length: 5 }, (_, i) => (
      <div key={i} className="p-4 border-b border-gray-200 animate-pulse">
        <div className="flex items-start space-x-3">
          <div className="h-10 w-10 rounded-full bg-gray-200"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
            <div className="flex justify-between mt-2">
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      </div>
    ));
  
    return (
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/6"></div>
        </div>
        <div>{skeletonItems}</div>
      </div>
    );
  }