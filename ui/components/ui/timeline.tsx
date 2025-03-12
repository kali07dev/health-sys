import { ReactNode } from 'react';

interface TimelineItem {
  date: string;
  title: string;
  description: string;
  type: string;
}

interface TimelineProps {
  items: TimelineItem[];
}

export function Timeline({ items }: TimelineProps) {
  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {items.map((item, idx) => (
          <li key={idx}>
            <div className="relative pb-8">
              {idx !== items.length - 1 ? (
                <span
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                    <span className="h-2.5 w-2.5 rounded-full bg-white" />
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                    {item.date}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}