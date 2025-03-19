// app/incidents/[id]/summary/page.tsx
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { IncidentSummaryView } from '@/components/Incidents/IncidentSummaryView';
import { getIncidentSummary } from '@/api/incident_summary';
import { ErrorBoundary } from '@/components/ui/error-boundary';

// Define the PageProps interface to match Next.js expectations
interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = 'force-dynamic'; // Ensures fresh data on each request
export const revalidate = 0; // Disable caching for this page

// Define the main page component
export default async function IncidentSummaryPage({ params }: PageProps) {
  // Await the params object
  const { id } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <ErrorBoundary fallback={
        <div className="p-8 bg-red-50 rounded-lg shadow-lg text-center">
          <h2 className="text-red-600 text-xl font-bold mb-4">Something went wrong</h2>
          <p className="text-gray-700">We&apos;re having trouble displaying this incident.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      }>
        <Suspense fallback={
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner className="text-red-600 h-12 w-12" />
            <span className="ml-3 text-gray-700 font-medium">Loading incident details...</span>
          </div>
        }>
          <IncidentSummaryContent id= {id}/>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

// Separate component to handle data fetching
async function IncidentSummaryContent({ id }: { id: string }) {
  try {
    const summary = await getIncidentSummary(id);
    return <IncidentSummaryView summary={summary} />;
  } catch (error) {
    console.error('Error fetching incident summary:', error);
    return (
      <div className="p-8 bg-red-50 rounded-lg shadow-lg text-center">
        <h2 className="text-red-600 text-xl font-bold mb-4">Data Loading Error</h2>
        <p className="text-gray-700">We couldn&apos;t load the incident data. Please try again later.</p>
      </div>
    );
  }
}