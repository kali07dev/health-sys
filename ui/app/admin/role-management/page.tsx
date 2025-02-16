// app/admin/role-management/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { userService, User } from '@/utils/userAPI';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';

export default function RoleManagement() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Function to fetch users
  const loadUsers = async () => {
    try {
      const data = await userService.getAllUsers();
      setUsers(data); // Set fetched users
      setError(null); // Clear any previous error
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch records'); // Set error state
    } finally {
      setLoading(false); // Ensure loading state is cleared
    }
  };

  // Handle role change for a user
  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdating(userId); // Set updating state for the specific user
    try {
      await userService.updateUserRole(userId, newRole);
      toast.success('Role updated successfully');
      loadUsers(); // Reload users to reflect changes
    } catch (error) {
      toast.error('Failed to update role');
    } finally {
      setUpdating(null); // Clear updating state
    }
  };

  // Render based on loading, error, and users state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
        <>
        <h1 className="mb-8 text-3xl font-bold">User Role Management</h1>
        <div className="flex h-screen flex-col items-center justify-center space-y-4">
            <p className="text-lg font-semibold text-red-500">{error}</p>
            <button
                className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                onClick={loadUsers}
            >
                Retry
            </button>
        </div></>
    );
  }

  if (users.length === 0) {
    return (
        <>
        <h1 className="mb-8 text-3xl font-bold">User Role Management</h1>
        <div className="flex h-screen items-center justify-center">
            <p className="text-lg font-semibold text-gray-500">No Users found</p>
        </div>
        </>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">User Role Management</h1>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Current Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm text-gray-900">{user.email}</div>
                  <div className="text-sm text-gray-500">
                    {user.employee?.firstName} {user.employee?.lastName}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800">
                    {user.role}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <select
                    className="rounded border border-gray-300 px-3 py-1"
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={updating === user.id}
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="safety_officer">Safety Officer</option>
                    <option value="admin">Admin</option>
                  </select>
                  {updating === user.id && (
                    <Loader2 className="ml-2 inline h-4 w-4 animate-spin" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}