// app/notifications/system/page.tsx
import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import SystemNotificationsContainer from '@/components/notifications/SystemNotificationsContainer';
import NotificationsSkeletonLoader from '@/components/NotificationsSkeletonLoader';

export default async function SystemNotificationsPage() {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session) {
    redirect('/login');
  }

  // Check if user has admin or safety_officer role
  const userRole = session.role;
  if (userRole !== 'admin' && userRole !== 'safety_officer') {
    redirect('/notifications'); // Redirect to regular notifications if not authorized
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-6">System Notifications</h1>
        
        <Suspense fallback={<NotificationsSkeletonLoader />}>
          <SystemNotificationsContainer userRole={userRole} />
        </Suspense>
      </div>
    </div>
  );
}