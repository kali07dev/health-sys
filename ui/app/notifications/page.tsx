// app/notifications/page.tsx
import { Suspense } from 'react';
import { getServerSession } from 'next-auth/next';
import NotificationsList from '@/components/notification/NotificationsList';
import NotificationFilter from '@/components/notification/NotificationFilter';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
// import { Toaster } from '@/components/ui/toaster';

// types for better type safety
interface Session {
    user: {
      id: string;
      email: string;
    };
    token: string;
    role: string;
  }

export default async function NotificationsPage() {
  const session = (await getServerSession(authOptions)) as Session | null;
  const isAdminOrSafety = session?.role === 'admin' || session?.role === 'safety_officer';
  

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {isAdminOrSafety && (
            <a
              href="/notifications/system"
              className="mt-4 md:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View System Notifications
            </a>
          )}
        </div>
        
        <NotificationFilter />
        
        <Suspense fallback={<LoadingSpinner />}>
          {session?.user?.id ? (
            <NotificationsList userId={session.user.id} />
          ) : (
            <div>Please sign in to view notifications</div>
          )}
        </Suspense>
      </div>
      {/* <Toaster /> */}
    </div>
  );
}