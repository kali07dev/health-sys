import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { Toaster } from 'react-hot-toast';
import IncidentReviewPage from '@/components/Invest/IncidentReviewPage';


interface PageProps {
  params: Promise<{
    id: string;
  }>;
}


export default async function Page({ params }: PageProps) {
  // Await the params object
  const { id } = await params;

  // Fetch session data
  const session = await getServerSession();

  // Redirect if not authenticated
  if (!session) {
    redirect('/auth/login');
  }

  // Restrict access based on user role
  if (!['admin', 'safety_officer', 'manager'].includes(session?.role ?? '')) {
    console.log('Unauthorized access:', session);
    // redirect('/dashboard'); // Uncomment to enable redirect
  }

  try {
    return (
      <>
        <Toaster position="top-right" />
        <IncidentReviewPage incidentId={id} />
      </>
    );
  } catch (error) {
    console.error('Error fetching incident:', error);
  }
}