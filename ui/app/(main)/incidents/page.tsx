// app/incidents/page.tsx
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { IncidentsTable } from "@/components/Incidents/landing";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { incidentAPI } from '@/utils/api';
import { authOptions } from "@/app/api/auth/auth-options";

// Define types for better type safety
interface Session {
  user: {
    id: string;
    email: string;
  };
  token: string;
  role: string;
}

const fetchIncidents = async (page = 1, pageSize = 10) => {
  try {
    const response = await incidentAPI.getAllIncidentsFiltered({ page, pageSize });
    return response;
  } catch (error) {
    console.error("Failed to fetch incidents:", error);
    return null;
  }
};

export default async function IncidentsPage() {
  
  const session = (await getServerSession(authOptions)) as Session | null;
  
  // Handle no session case
  if (!session) {
    redirect('/auth/login');
  }

  // Handle role-based access
  if (session.role !== "admin" && session.role !== "safety_officer") {
    redirect(`/incidents/employee/${session.user.id}`);
  }

  const incidentsData = await fetchIncidents();

  return (
    <Suspense fallback={<TableSkeleton />}>
      <IncidentsTable 
        initialIncidents={incidentsData?.data || []} 
        userRole={session.role}
        totalIncidents={incidentsData?.total || 0}
        initialPage={incidentsData?.page || 1}
        totalPages={incidentsData?.totalPages || 1}
        pageSize={incidentsData?.pageSize || 10}
      />
    </Suspense>
  );
}