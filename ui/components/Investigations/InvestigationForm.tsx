// src/components/InvestigationForm.tsx
import React, { useState } from 'react';
import { Investigation } from '../../interfaces/investigation';

interface InvestigationFormProps {
  initialValues?: Partial<Investigation>;
  onSubmit: (values: Partial<Investigation>) => void;
}

const InvestigationForm: React.FC<InvestigationFormProps> = ({ initialValues, onSubmit }) => {
  const [values, setValues] = useState<Partial<Investigation>>(initialValues || {});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Incident ID</label>
        <input
          type="text"
          name="incident_id"
          value={values.incident_id || ''}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      {/* Add similar fields for other properties */}
      <button
        type="submit"
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Save
      </button>
    </form>
  );
};

export default InvestigationForm;