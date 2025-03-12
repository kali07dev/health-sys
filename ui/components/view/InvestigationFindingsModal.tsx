'use client';
// components/Investigations/InvestigationFindingsModal.tsx

import { useState } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { InvestigationAPI } from '@/utils/investigationAPI';
// import type { Investigation } from '@/interfaces/incidents';

interface InvestigationFindingsModalProps {
  investigationId: string;
  onClose: () => void;
  onSubmit: () => void;
}

type FindingsFormData = {
  rootCause: string;
  contributingFactors: string[];
  findings: string;
  recommendations: string;
};

export const InvestigationFindingsModal = ({
  investigationId,
  onClose,
  onSubmit,
}: InvestigationFindingsModalProps) => {
  const [formData, setFormData] = useState<FindingsFormData>({
    rootCause: '',
    contributingFactors: [''],
    findings: '',
    recommendations: '',
  });
  const [loading, setLoading] = useState(false);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFactorChange = (index: number, value: string) => {
    const newFactors = [...formData.contributingFactors];
    newFactors[index] = value;
    setFormData(prev => ({ ...prev, contributingFactors: newFactors }));
  };
  
  const addFactor = () => {
    setFormData(prev => ({
      ...prev,
      contributingFactors: [...prev.contributingFactors, '']
    }));
  };
  
  const removeFactor = (index: number) => {
    if (formData.contributingFactors.length > 1) {
      const newFactors = [...formData.contributingFactors];
      newFactors.splice(index, 1);
      setFormData(prev => ({ ...prev, contributingFactors: newFactors }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const filteredFactors = formData.contributingFactors.filter(factor => factor.trim() !== '');
    
    try {
      await InvestigationAPI.addFindings(investigationId, {
        ...formData,
        contributingFactors: filteredFactors
      });
      onSubmit();
      onClose();
    } catch (error) {
      console.error('Error adding findings:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">Investigation Findings</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Root Cause</label>
            <textarea
              name="rootCause"
              value={formData.rootCause}
              onChange={handleInputChange}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              placeholder="Describe the root cause of the incident"
              required
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">Contributing Factors</label>
              <button
                type="button"
                onClick={addFactor}
                className="flex items-center text-sm text-red-500 hover:text-red-600"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Factor
              </button>
            </div>
            
            {formData.contributingFactors.map((factor, index) => (
              <div key={index} className="flex items-center mb-2 last:mb-0">
                <textarea
                  value={factor}
                  onChange={(e) => handleFactorChange(index, e.target.value)}
                  rows={2}
                  className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  placeholder={`Factor ${index + 1}`}
                />
                {formData.contributingFactors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFactor(index)}
                    className="ml-2 p-1 text-gray-400 hover:text-red-500"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                )}
                              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Findings</label>
            <textarea
              name="findings"
              value={formData.findings}
              onChange={handleInputChange}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              placeholder="Describe the findings of the investigation"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recommendations</label>
            <textarea
              name="recommendations"
              value={formData.recommendations}
              onChange={handleInputChange}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              placeholder="Provide recommendations to prevent future incidents"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 border border-transparent rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Findings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};