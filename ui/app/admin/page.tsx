// app/admin/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  Users, 
  UserCog,
  Building2,
  Settings,
  ShieldCheck,
  UserPlus,
  Ban,
  History,
  HardDrive,
  Lock
} from 'lucide-react';

export default function AdminDashboard() {
  const { data: session } = useSession();

  const AdminAction = ({ 
    title, 
    description, 
    icon: Icon, 
    href, 
    color 
  }: {
    title: string;
    description: string;
    icon: any;
    href: string;
    color: string;
  }) => (
    <Link 
      href={href}
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

  return (
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
          title="Create New User"
          description="Add new users to the system"
          icon={UserPlus}
          href="/admin/users/create"
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
  );
}