// components/ui/InfoPanel.tsx
import React from "react";
import { Info } from "lucide-react";

interface InfoPanelProps {
  children: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
  className?: string;
}

const InfoPanel = ({ 
  children, 
  title = "Information", 
  icon = <Info className="h-5 w-5 text-blue-600" />,
  className = "" 
}: InfoPanelProps) => {
  return (
    <div className={`rounded-xl bg-blue-50 border border-blue-100 p-4 mb-6 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0 rounded-full bg-blue-100 p-1.5">
          {icon}
        </div>
        <div className="flex-1">
          {title && (
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              {title}
            </h4>
          )}
          <div className="text-sm text-blue-700">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;