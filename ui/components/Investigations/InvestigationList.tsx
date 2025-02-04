// src/components/InvestigationList.tsx
import React from 'react';
import { Investigation } from '../../interfaces/investigation';


interface InvestigationListProps {
  investigations: Investigation[];
  onDelete: (id: string) => void;
}

const InvestigationList: React.FC<InvestigationListProps> = ({ investigations, onDelete }) => {
  return (
    <div className="space-y-4">
      {investigations.map((inv) => (
        <div key={inv.id} className="p-4 bg-white shadow rounded-lg">
          <h3 className="text-lg font-medium">{inv.status}</h3>
          <p>{inv.findings}</p>
          <button
            onClick={() => onDelete(inv.id)}
            className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};

export default InvestigationList;