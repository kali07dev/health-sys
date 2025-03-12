import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  className?: string;
  size?: number;
}

export function LoadingSpinner({ className = "", size = 24 }: LoadingSpinnerProps) {
  return (
    <div className="flex justify-center items-center w-full h-full min-h-[100px]">
      <Loader2 
        className={`animate-spin text-gray-600 ${className}`} 
        size={size}
      />
    </div>
  );
}