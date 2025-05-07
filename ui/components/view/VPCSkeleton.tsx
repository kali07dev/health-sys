export const VPCSkeleton = () => {
    return (
      <div className="mt-6">
        <div className="mb-6 flex justify-between items-center">
          <div className="w-64 h-10 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="w-20 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="w-32 h-5 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="w-3/4 h-7 bg-gray-200 rounded mb-2 animate-pulse"></div>
                <div className="w-full h-16 bg-gray-200 rounded mb-4 animate-pulse"></div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-1">
                      <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-2 w-full bg-gray-200 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  