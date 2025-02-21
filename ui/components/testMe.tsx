// app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  Users, 
  ShieldCheck, 
  Building2, 
  AlertTriangle,
  UserCog,
  ClipboardList,
  Settings,
  Activity
} from 'lucide-react';
import { userService } from '@/utils/userAPI';
import { adminService } from '@/utils/adminApi';
import { DashboardStats } from '@/interfaces/dashboard';

// interface DashboardStats {
//   totalUsers: number;
//   activeUsers: number;
//   totalDepartments: number;
//   pendingApprovals: number;
// }

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalDepartments: 0,
    pendingApprovals: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const data = await adminService.getAdminStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  // const fetchDashboardStats = async () => {
  //   try {
  //     // Replace with your actual API endpoint
  //     const data = await userService.getAdminStats();
  //     setStats(data);
  //   } catch (error) {
  //     console.error('Failed to fetch dashboard stats:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const StatCard = ({ title, value, icon: Icon, color }: {
    title: string;
    value: number;
    icon: any;
    color: string;
  }) => (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className={`rounded-full p-3 ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const QuickAction = ({ title, description, icon: Icon, href, color }: {
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6">
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back, {session?.user?.email}
        </p>
      </div>
      {/* Statistics Grid */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="bg-blue-600"
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          icon={Activity}
          color="bg-green-600"
        />
        <StatCard
          title="Departments"
          value={stats.totalDepartments}
          icon={Building2}
          color="bg-purple-600"
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          icon={AlertTriangle}
          color="bg-amber-600"
        />
      </div>

      {/* Quick Actions Grid */}
      <h2 className="mb-4 text-xl font-semibold text-gray-900">Quick Actions</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <QuickAction
          title="User Management"
          description="Manage user roles and permissions"
          icon={UserCog}
          href="/admin/role-management"
          color="bg-blue-600"
        />
        <QuickAction
          title="Department Settings"
          description="Configure department structures"
          icon={Building2}
          href="/admin/departments"
          color="bg-purple-600"
        />
        <QuickAction
          title="Security Settings"
          description="Configure security policies"
          icon={ShieldCheck}
          href="/admin/security"
          color="bg-red-600"
        />
        <QuickAction
          title="System Logs"
          description="View system activity logs"
          icon={ClipboardList}
          href="/admin/logs"
          color="bg-green-600"
        />
        <QuickAction
          title="General Settings"
          description="Configure system settings"
          icon={Settings}
          href="/admin/settings"
          color="bg-gray-600"
        />
      </div>
    </div>
  );
}