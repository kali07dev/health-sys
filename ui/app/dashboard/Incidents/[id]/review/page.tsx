// app/incidents/[id]/review/page.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { Toaster } from 'react-hot-toast';

import IncidentReviewPage from '@/components/Incidents/IncidentReview';
import { incidentAPI } from '@/utils/api';
import type { Incident } from '@/interfaces/incidents';

interface PageProps {
  params: {
    id: string;
  };
}

async function getIncident(id: string): Promise<Incident> {
  try {
    const response = await incidentAPI.getIncident(id);
    return response;
  } catch (error) {
    throw new Error('Failed to fetch incident');
  }
}

export default async function Page({ params }: PageProps) {
  const session = await getServerSession();
  
  // Redirect if not authenticated
  if (!session) {
    redirect('/auth/signin');
  }

  // Only allow admin and safety officer to access review page
  if (!['employee', 'safety_officer'].includes(session.role ?? '')) {
    // redirect('/incidents');
    console.log("UnAuthenticated")
  }

  try {
    const incident = await getIncident(params.id);

    return (
      <>
        <Toaster position="top-right" />
        <IncidentReviewPage incident={incident} />
      </>
    );
  } catch (error) {
    // redirect('/incidents');
    console.log(error)

  }
}

