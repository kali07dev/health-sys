import React from 'react';

export default function TasksSkeleton() {
  return (
    <div>
      <div className="h-8 w-64 bg-gray-200 rounded-md mb-6 animate-pulse"></div>
      
      {/* Dashboard Summary Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-100 p-4 rounded-lg shadow animate-pulse">
            <div className="h-6 w-32 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 w-16 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
      
      {/* Legend Skeleton */}
      <div className="bg-gray-50 p-4 rounded-md mb-6">
        <div className="h-5 w-20 bg-gray-200 rounded mb-2"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="h-4 w-16 bg-gray-200 rounded mb-2"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-gray-200"></span>
                  <span className="h-3 w-24 bg-gray-200 rounded"></span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="h-4 w-16 bg-gray-200 rounded mb-2"></div>
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <span className="inline-block w-3 h-3 bg-gray-200"></span>
                  <span className="h-3 w-24 bg-gray-200 rounded"></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Actions List Skeleton */}
      <div className="grid grid-cols-1 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-md space-y-4 border-l-4 border-gray-300 animate-pulse">
            <div className="flex justify-between items-start">
              <div className="w-full">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="h-6 w-20 bg-gray-200 rounded-full"></span>
                  <span className="h-4 w-32 bg-gray-200 rounded"></span>
                </div>
                <div className="h-6 w-3/4 bg-gray-200 rounded mb-2"></div>
                <div className="mt-2 flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
            
            <div className="pt-2 border-t border-gray-100">
              <div className="flex space-x-4">
                <div className="h-8 w-28 bg-gray-200 rounded"></div>
                <div className="h-8 w-36 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}