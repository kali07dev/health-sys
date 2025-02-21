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
    console.error('Failed to fetch incident:', error);
    throw new Error('Failed to fetch incident');
  }
}

export default async function Page({ params }: PageProps) {
  // Ensure `params` is destructured and awaited properly
  const { id } = params;

  // Fetch session data
  const session = await getServerSession();

  // Redirect if not authenticated
  if (!session) {
    redirect('/auth/signin');
  }

  // Restrict access based on user role
  if (!['admin', 'safety_officer'].includes(session.role ?? '')) {
    console.log('Unauthorized access:', session.role);
    // redirect('/dashboard'); // Redirect to a suitable page
  }

  try {
    // Fetch incident data using the awaited `id`
    const incident = await getIncident(id);

    return (
      <>
        <Toaster position="top-right" />
        <IncidentReviewPage incident={incident} />
      </>
    );
  } catch (error) {
    console.error('Error fetching incident:', error);
    // redirect('/dashboard/incidents'); // Redirect to incidents list on failure
  }
}