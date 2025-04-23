// app/(main)/tasks/page.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/auth-options';
import EmployeeTasksDashboard from './EmployeeTasksDashboard';
import TasksSkeleton from './TasksSkeleton';
import { Suspense } from 'react';

export default async function TasksPage() {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session) {
    redirect('/login');
  }

  // Get user role and ID from session
  const userRole = session.role;
  const userId = session.user?.id;

  // If the user doesn't have a role or ID, redirect to unauthorized page
  if (!userRole || !userId) {
    redirect('/unauthorized');
  }

  // If user is admin or safety officer, redirect them to a different dashboard
  if (['admin', 'safety_officer', 'manager'].includes(userRole)) {
    // redirect('/incidents');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <Suspense fallback={<TasksSkeleton />}>
          <EmployeeTasksDashboard userRole={userRole} userId={userId} />
        </Suspense>
      </div>
    </div>
  );
}