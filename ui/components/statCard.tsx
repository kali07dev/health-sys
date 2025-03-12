// components/StatCard.tsx
import React from 'react';

interface StatCardProps {
  title: string;
  value: number | string | null | undefined;
  icon: React.ElementType;
  color: string;
}

const StatCard = ({ title, value, icon: Icon, color }: StatCardProps) => (
  <div className="rounded-lg bg-white p-6 shadow-md">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="mt-2 text-3xl font-semibold text-gray-900">
          {value ?? "N/A"} {/* Display "N/A" if value is null or undefined */}
        </p>
      </div>
      <div className={`rounded-full p-3 ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </div>
);

export default StatCard;