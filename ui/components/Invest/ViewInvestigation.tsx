import { incidentAPI } from "@/utils/api";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

// components/Investigation/ViewInvestigation.tsx
export const ViewInvestigation: React.FC<{ incidentId: string }> = ({ incidentId }) => {
    const [investigation, setInvestigation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      fetchInvestigation();
    }, [incidentId]);
  
    const fetchInvestigation = async () => {
      try {
        const response = await incidentAPI.getInvestigation(incidentId);
        setInvestigation(response);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
  
    if (loading) {
      return (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      );
    }
  
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Investigation Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Root Cause</h3>
              <p className="mt-1 text-gray-600">{investigation.rootCause}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Contributing Factors</h3>
              <p className="mt-1 text-gray-600">{investigation.contributingFactors}</p>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900">Findings</h3>
              <p className="mt-1 text-gray-600">{investigation.findings}</p>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900">Recommendations</h3>
              <p className="mt-1 text-gray-600">{investigation.recommendations}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };