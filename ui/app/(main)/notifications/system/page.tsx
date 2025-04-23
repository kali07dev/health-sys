// app/notifications/system/page.tsx
import { Suspense } from 'react';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import NotificationsList from '@/components/notification/NotificationsList';
import NotificationFilter from '@/components/notification/NotificationFilter';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { authOptions } from "@/app/api/auth/auth-options";
// import { Toaster } from '@/components/ui/toaster';

interface Session {
    user: {
      id: string;
      email: string;
    };
    token: string;
    role: string;
}

export default async function SystemNotificationsPage() {
   const session = (await getServerSession(authOptions)) as Session | null;
  
  if (session?.role !== 'admin' && session?.role !== 'safety_officer' && session?.role !== 'manager') {
    redirect('/notifications');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">System Notifications</h1>
          <a
            href="/notifications"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to My Notifications
          </a>
        </div>

        <NotificationFilter />
        
        <Suspense fallback={<LoadingSpinner />}>
          <NotificationsList userId={session?.user?.id} isSystemView={true} />
        </Suspense>
      </div>
      {/* <Toaster /> */}
    </div>
  );
}