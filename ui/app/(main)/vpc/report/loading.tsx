// src/app/reports/vpc-preview/loading.tsx
export default function LoadingVPCReport() {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-xl text-gray-700 font-semibold">Loading VPC Report...</p>
        <p className="text-gray-500">Please wait while we fetch the details.</p>
      </div>
    );
  }