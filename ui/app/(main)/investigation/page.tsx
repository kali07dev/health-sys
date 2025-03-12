// app/investigations/page.tsx
import { Suspense } from 'react';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import InvestigationsView from '@/components/view/InvestigationsView';
import { InvestigationsSkeleton } from '@/components/view/InvestigationsSkeleton';

import InfoPanel from "@/components/ui/InfoPanel";
import { ClipboardList, Play, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function InvestigationsPage() {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session) {
    redirect('/auth/login');
  }
  
  // Get user role and ID from session
  const userRole = session.role;
  const userId = session.user?.id;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Investigations</h1>
      <InfoPanel 
          title="Pending Investigations"
          icon={<ClipboardList className="h-5 w-5 text-blue-600" />}
        >
          <p>
            This section lists investigations requiring your attention. 
            Each investigation must be completed within 72 hours of assignment. 
            Use the action buttons to update progress or request support.
          </p>
          <div className="flex gap-4 mt-3">
            <Button 
              size="sm" 
              variant="outline" 
              className="bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
            >
              <Play className="h-4 w-4 mr-1" />
              Start Investigation
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
            >
              <AlertCircle className="h-4 w-4 mr-1" />
              Request Support
            </Button>
          </div>
        </InfoPanel>
      <Suspense fallback={<InvestigationsSkeleton />}>
        <InvestigationsView userId={userId} userRole={userRole} />
      </Suspense>
    </div>
  );
}