"use client"

import { useState, useEffect } from "react"
// import { useSession } from 'next-auth/react';
import { Loader2, Edit2, Shield, Ban, CheckCircle, Search, UserPlus, Filter, X } from "lucide-react"
import { toast } from "react-hot-toast"
import { userService, type User } from "@/utils/userAPI"
import { EditUserModal } from "@/components/users/EditUserModal"
import { CreateUserModal } from "@/components/users/CreateUserModal"
import { RoleModal } from "@/components/users/RoleModal"
import { StatusModal } from "@/components/users/StatusModal"

export default function UserManagement() {
  // const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await userService.getAllUsers()
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error loading users:", error)
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.employee?.FirstName?.toLowerCase()?.includes(searchTerm.toLowerCase()) ?? false) ||
      (user.employee?.LastName?.toLowerCase()?.includes(searchTerm.toLowerCase()) ?? false),
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      {/* Search and Filters Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex w-full sm:w-auto flex-1 items-center space-x-3">
          <div className="relative flex-1 w-full sm:max-w-md">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 pl-10 pr-4 py-3 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            />
            <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <button className="inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </button>
        </div>
        <button
          onClick={() => {
            setSelectedUser(null)
            setIsCreateModalOpen(true)
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 shadow-sm"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </button>
      </div>

      {/* Loading and Empty States */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">No users found</p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                <div className="p-4">
                  <div className="flex items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-medium text-lg">
                      {user.employee?.FirstName?.[0]?.toUpperCase() || user.email[0]?.toUpperCase() || "-"}
                    </div>
                    <div className="ml-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {user.employee?.FirstName} {user.employee?.LastName || ""}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</p>
                      <span className="mt-1 inline-flex rounded-full bg-blue-100 dark:bg-blue-900 px-3 py-1 text-xs font-semibold leading-5 text-blue-800 dark:text-blue-300">
                        {user.role || "-"}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</p>
                      <span
                        className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold leading-5 ${
                          user.IsActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        }`}
                      >
                        {user.IsActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Department</p>
                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                        {user.employee?.Department || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-800">
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => {
                        setSelectedUser(user)
                        setIsEditModalOpen(true)
                      }}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
                      title="Edit user details"
                    >
                      <Edit2 className="h-4 w-4" />
                      <span className="text-xs font-medium">Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUser(user)
                        setIsRoleModalOpen(true)
                      }}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
                      title="Change user role"
                    >
                      <Shield className="h-4 w-4" />
                      <span className="text-xs font-medium">Role</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUser(user)
                        setIsStatusModalOpen(true)
                      }}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
                      title={user.IsActive ? "Deactivate user" : "Activate user"}
                    >
                      {user.IsActive ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      <span className="text-xs font-medium">{user.IsActive ? "Deactivate" : "Activate"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Department
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-medium">
                              {user.employee?.FirstName?.[0]?.toUpperCase() || user.email[0]?.toUpperCase() || "-"}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {user.employee?.FirstName} {user.employee?.LastName || ""}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-blue-100 dark:bg-blue-900 px-3 py-1 text-xs font-semibold leading-5 text-blue-800 dark:text-blue-300">
                          {user.role || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold leading-5 ${
                            user.IsActive
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                          }`}
                        >
                          {user.IsActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {user.employee?.Department || "-"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setIsEditModalOpen(true)
                            }}
                            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
                            title="Edit user details"
                          >
                            <Edit2 className="h-4 w-4" />
                            <span className="text-xs font-medium">Edit</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setIsRoleModalOpen(true)
                            }}
                            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
                            title="Change user role"
                          >
                            <Shield className="h-4 w-4" />
                            <span className="text-xs font-medium">Role</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setIsStatusModalOpen(true)
                            }}
                            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
                            title={user.IsActive ? "Deactivate user" : "Activate user"}
                          >
                            {user.IsActive ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                            <span className="text-xs font-medium">{user.IsActive ? "Deactivate" : "Activate"}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      {selectedUser && (
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={selectedUser}
          onSuccess={() => {
            loadUsers()
            setIsEditModalOpen(false)
            toast.success("User updated successfully")
          }}
        />
      )}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          loadUsers()
          setIsCreateModalOpen(false)
          toast.success("User created successfully")
        }}
      />

      <RoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        user={selectedUser}
        onSuccess={() => {
          loadUsers()
          setIsRoleModalOpen(false)
          toast.success("User role updated successfully")
        }}
      />

      <StatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        user={selectedUser}
        onSuccess={() => {
          loadUsers()
          setIsStatusModalOpen(false)
          toast.success("User status updated successfully")
        }}
      />
    </div>
  )
}

