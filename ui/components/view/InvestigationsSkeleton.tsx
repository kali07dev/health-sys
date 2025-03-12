// components/Investigations/InvestigationsSkeleton.tsx
export const InvestigationsSkeleton = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="flex justify-between items-start mb-3">
              <div className="h-4 w-20 bg-gray-200 rounded-full"></div>
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
            </div>
            <div className="h-6 w-3/4 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-2 mb-6">
              <div className="h-4 w-full bg-gray-200 rounded"></div>
              <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
              <div className="h-4 w-4/6 bg-gray-200 rounded"></div>
            </div>
            <div className="flex items-center">
              <div className="h-4 w-16 bg-gray-200 rounded mr-2"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
            <div className="h-2 bg-red-300 w-full mt-6"></div>
          </div>
        ))}
      </div>
    );
  };
  