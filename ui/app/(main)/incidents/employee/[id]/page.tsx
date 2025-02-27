// app/incidents/employee/[id]/page.tsx
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { IncidentsTable } from "@/components/Incidents/landing";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { incidentAPI } from '@/utils/api';
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Import authOptions

interface PageProps {
  params: {
    id: string;
  };
}

const fetchEmployeeIncidents = async (employeeId: string) => {
  try {
    const response = await incidentAPI.getIncidentsByEmployee(employeeId);
    return response;
  } catch (error) {
    console.error("Failed to fetch employee incidents:", error);
    return [];
  }
};

export default async function EmployeeIncidentsPage({ params }: PageProps) {
  // Use the params.id value directly in a variable first
  const employeeId = params.id;
  
  // Pass authOptions to getServerSession to properly include custom fields
  const session = await getServerSession(authOptions);
  
  // Check if user has permission to view these incidents
  const canViewIncidents = 
    session?.role === "admin" || // Use session.user.role instead of session.role
    session?.role === "safety_officer" || 
    session?.user?.id === employeeId;
  
  if (!canViewIncidents) {
    notFound();
  }

  // Fetch the incidents after validating permissions
  const incidents = await fetchEmployeeIncidents(employeeId);
  

  return (
    <Suspense fallback={<TableSkeleton />}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">
              {session?.user?.id === params.id ? "My Incidents" : "Employee Incidents"}
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              View all incidents reported by this employee.
            </p>
          </div>
        </div>
        <IncidentsTable incidents={incidents} userRole={session?.role} />
      </div>
    </Suspense>
  );
}