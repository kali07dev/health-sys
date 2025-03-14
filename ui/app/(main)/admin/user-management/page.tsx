// app/admin/user-management/page.tsx
'use client';

import { useState, useEffect } from 'react';
// import { useSession } from 'next-auth/react';
import { 
  // UserCog, 
  Loader2, 
  Edit2, 
  Shield, 
  Ban, 
  CheckCircle,
  Search,
  UserPlus,
  Filter
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { userService, User } from '@/utils/userAPI';
import { EditUserModal } from '@/components/users/EditUserModal';
import { CreateUserModal } from '@/components/users/CreateUserModal';
import { RoleModal } from '@/components/users/RoleModal';
import { StatusModal } from '@/components/users/StatusModal';

export default function UserManagement() {
  // const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) {
      toast.error('Failed to load users');
      toast.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.employee?.FirstName?.toLowerCase()?.includes(searchTerm.toLowerCase()) ?? false) || // Use nullish coalescing
    (user.employee?.LastName?.toLowerCase()?.includes(searchTerm.toLowerCase()) ?? false)
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      
      {/* Search and Filters Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <button className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </button>
        </div>
        <button
          onClick={() => {
            setSelectedUser(null);
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">User</th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Role</th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Department</th>
          <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 bg-white">
        {loading ? (
          <tr>
            <td colSpan={5} className="px-6 py-4 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
            </td>
          </tr>
        ) : filteredUsers.length === 0 ? (
          <tr>
            <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
              No users found
            </td>
          </tr>
        ) : (
          filteredUsers.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-600">
                      {/* Handle undefined employee */}
                      {(user.employee?.FirstName?.[0]?.toUpperCase() || user.email[0]?.toUpperCase()) || '-'}
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="font-medium text-gray-900">
                      {user.employee?.FirstName} {user.employee?.LastName || ''}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800">
                  {user.role || '-'} {/* Fallback for missing role */}
                </span>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    user.IsActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {user.IsActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {user.employee?.Department || '-'} 
                {/* Fallback for missing department */}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setIsEditModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                    title="Edit user details"
                  >
                    <Edit2 className="h-5 w-5" />
                    <span className="text-xs font-medium">Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setIsRoleModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                    title="Change user role"
                  >
                    <Shield className="h-5 w-5" />
                    <span className="text-xs font-medium">Role</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setIsStatusModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                    title={user.IsActive ? "Deactivate user" : "Activate user"}
                  >
                    {user.IsActive ? <Ban className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                    <span className="text-xs font-medium">{user.IsActive ? "Deactivate" : "Activate"}</span>
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
</div>;

      {/* Modals */}
      {selectedUser && (
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={selectedUser}
          onSuccess={() => {
            loadUsers();
            setIsEditModalOpen(false);
            toast.success('User updated successfully');
          }}
        />
      )}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          loadUsers();
          setIsCreateModalOpen(false);
          toast.success('User Created successfully');
        }}
      />

      <RoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        user={selectedUser}
        onSuccess={() => {
          loadUsers();
          setIsRoleModalOpen(false);
          toast.success('User role updated successfully');
        }}
      />

      <StatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        user={selectedUser}
        onSuccess={() => {
          loadUsers();
          setIsStatusModalOpen(false);
          toast.success('User status updated successfully');
        }}
      />
    </div>
  );
}