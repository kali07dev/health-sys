// app/admin/page.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { 
  UserCog,
  Building2,
  Settings,
  ShieldCheck,
  UserPlus,
  Ban,
  History,
  HardDrive,
  Lock,
  LucideIcon
} from 'lucide-react';
import { 
  AlertDialog, 
  AlertDialogAction, 
  // AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  // AlertDialogTrigger 
} from '@/components/ui/alert-dialog';

export default function AdminDashboard() {
  const [notImplementedRoute, setNotImplementedRoute] = useState<string | null>(null);

  const AdminAction = ({ 
    title, 
    description, 
    icon: Icon, 
    href, 
    color 
  }: {
    title: string;
    description: string;
    icon: LucideIcon;
    href: string;
    color: string;
  }) => {
    const handleClick = (e: React.MouseEvent) => {
      const notImplementedRoutes = [
        '/admin/backup',
        '/admin/accounts', 
        '/admin/logs', 
        '/admin/settings', 
        '/admin/security',
        '/admin/access-control'
      ];

      if (notImplementedRoutes.includes(href)) {
        e.preventDefault();
        setNotImplementedRoute(href);
      }
    };

    return (
      <Link 
        href={href}
        onClick={handleClick}
        className="flex transform items-center rounded-lg bg-white p-6 shadow-md transition-all hover:scale-105 hover:shadow-lg"
      >
        <div className={`mr-4 rounded-full p-3 ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </Link>
    );
  };

  const closeNotImplementedDialog = () => {
    setNotImplementedRoute(null);
  };
  return (
    <>
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Control Panel</h1>
        <p className="mt-2 text-gray-600">
          Select an administrative action to proceed
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* User Management Section */}
        <AdminAction
          title="Manage User Roles"
          description="Assign and modify user roles and permissions"
          icon={UserCog}
          href="/admin/user-management"
          color="bg-blue-600"
        />
        <AdminAction
          title="Manage Temporary Employees"
          description="Create, update, and manage temporary staff"
          icon={UserPlus}
          href="/admin/temporary-employees"
          color="bg-orange-600"
        />

        <AdminAction
          title="Create New User"
          description="Add new users to the system"
          icon={UserPlus}
          href="/admin/user-management"
          color="bg-green-600"
        />

        <AdminAction
          title="User Access Control"
          description="Manage user access and restrictions"
          icon={Lock}
          href="/admin/access-control"
          color="bg-purple-600"
        />

        {/* Department Management */}
        <AdminAction
          title="Department Management"
          description="Configure and manage department structure"
          icon={Building2}
          href="/admin/departments"
          color="bg-indigo-600"
        />

        {/* System Settings */}
        <AdminAction
          title="System Configuration"
          description="Manage system-wide settings and preferences"
          icon={Settings}
          href="/admin/settings"
          color="bg-gray-600"
        />

        {/* Security Settings */}
        <AdminAction
          title="Security Settings"
          description="Configure security policies and protocols"
          icon={ShieldCheck}
          href="/admin/security"
          color="bg-red-600"
        />

        {/* User Activity */}
        <AdminAction
          title="User Activity Logs"
          description="View and monitor user actions and system logs"
          icon={History}
          href="/admin/logs"
          color="bg-amber-600"
        />

        {/* Account Management */}
        <AdminAction
          title="Account Management"
          description="Manage account statuses and deactivations"
          icon={Ban}
          href="/admin/accounts"
          color="bg-rose-600"
        />

        {/* Backup Management */}
        <AdminAction
          title="Backup & Restore"
          description="Manage system backups and restoration"
          icon={HardDrive}
          href="/admin/backup"
          color="bg-teal-600"
        />
      </div>
    </div>
    {notImplementedRoute && (
      <AlertDialog open={!!notImplementedRoute} onOpenChange={closeNotImplementedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Not Implemented Yet</AlertDialogTitle>
            <AlertDialogDescription>
              The route {notImplementedRoute} is currently under development and not available.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={closeNotImplementedDialog}>
              Understood
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )}
    </>
  );
}