import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/auth-options';
import CorrectiveActionsContent from '@/components/CorrectiveActions/EmployeeView/CorrectiveActionsContent';
import CorrectiveActionsSkeleton from '@/components/NotificationsSkeletonLoader';
import InfoPanel from "@/components/ui/InfoPanel";
import { ShieldAlert, CheckCircle, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function CorrectiveActionsPage() {
  // Authentication check
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session) {
    redirect('/auth/login');
  }
  
  // Get user role and ID from session
  const userRole = session.role;
  const userId = session.user?.id;

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">My Corrective Actions</h1>
      <InfoPanel 
        title="Open Corrective Actions"
        icon={<ShieldAlert className="h-5 w-5 text-blue-600" />}
        >
          <p>
            These are safety improvements assigned to you. Each action has a priority level and deadline. 
            <strong> High-priority items</strong> must be addressed within 24 hours.
          </p>
          <div className="flex gap-4 mt-3">
            <Button 
              size="sm" 
              variant="outline" 
              className="bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Mark Complete
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
            >
              <CalendarPlus className="h-4 w-4 mr-1" />
              Request Extension
            </Button>
          </div>
      </InfoPanel>
      <Suspense fallback={<CorrectiveActionsSkeleton />}>
        <CorrectiveActionsContent userId={userId} userRole={userRole} />
      </Suspense>
    </div>
  );
}