// src/pages/investigations/index.tsx
import React, { useEffect, useState } from 'react';
import { fetchAllInvestigations, deleteInvestigation } from '../../../api/investigation';
import { Investigation } from '../../../interfaces/investigation';
import InvestigationList from '../../../components/Investigations/investigations-table';

const InvestigationsPage = () => {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchAllInvestigations();
      setInvestigations(data);
    };
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    await deleteInvestigation(id);
    setInvestigations((prev) => prev.filter((inv) => inv.id !== id));
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Investigations</h1>
      <InvestigationList investigations={investigations} onDelete={handleDelete} />
    </div>
  );
};

export default InvestigationsPage;