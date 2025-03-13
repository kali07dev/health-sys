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
      <ErrorBoundary fallback={<div>Something went wrong. Please try again.</div>}>
        <Suspense fallback={<LoadingSpinner />}>
          <IncidentSummaryContent params={{ id }} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

// Separate component to handle data fetching
async function IncidentSummaryContent({ params }: { params: { id: string } }) {
  const summary = await getIncidentSummary(params.id);
  console.log(summary);
  return <IncidentSummaryView summary={summary} />;
}