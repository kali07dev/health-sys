import type React from "react"
import { UserRoleManagement } from "@/components/UserRoleManagement"  

const UserRoleManagementPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">User Role Management</h1>
      <UserRoleManagement />
    </div>
  )
}

export default UserRoleManagementPage

