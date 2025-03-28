// app/notifications/page.tsx
import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/auth-options';
import NotificationsContainer from '@/components/notifications/NotificationsContainer';
import NotificationsSkeletonLoader from '@/components/NotificationsSkeletonLoader';
import InfoPanel from "@/components/ui/InfoPanel";
import { Bell, Check } from "lucide-react";
import {Button} from '@/components/ui/button';

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session) {
    redirect('/auth/login');
  }

  // Get user role and ID from session
  const userRole = session.role;
  const userId = session.user?.id;

  return (
    <div className="flex flex-col w-full min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-6">Notifications</h1>
        <InfoPanel 
            title="System Alerts & Reminders"
            icon={<Bell className="h-5 w-5 text-red-600" />}
          >
            <p>
              Your notifications include: <strong>investigation reminders</strong>, 
              <strong> action deadlines</strong>, and <strong>system updates</strong>. 
              Critical alerts are marked with a red badge. Check regularly to stay compliant.
            </p>
            <div className="flex gap-4 mt-3">
              <Button 
                size="sm" 
                variant="outline" 
                className="bg-white text-red-700 border-red-200 hover:bg-red-50"
              >
                <Check className="h-4 w-4 mr-1" />
                Dismiss All
              </Button>
            </div>
        </InfoPanel>
        <Suspense fallback={<NotificationsSkeletonLoader />}>
          <NotificationsContainer userId={userId} userRole={userRole} />
        </Suspense>
      </div>
    </div>
  );
}