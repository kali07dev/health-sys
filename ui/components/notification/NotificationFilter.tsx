// app/notifications/components/NotificationFilter.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function NotificationFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [type, setType] = useState(searchParams.get('type') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'CreatedAt');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');

  const handleFilterChange = () => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 bg-gray-50 p-4 rounded-lg">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          <option value="alert">Alert</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
        </select>
      </div>

      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700">Sort By</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="CreatedAt">Date</option>
          <option value="Type">Type</option>
          <option value="Title">Title</option>
        </select>
      </div>

      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700">Sort Order</label>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>

      <div className="flex items-end">
        <button
          onClick={handleFilterChange}
          className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}