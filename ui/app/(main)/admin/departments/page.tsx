"use client"

import { useState, useEffect } from "react"
import { departmentService, type Department } from "@/utils/departmentAPI"
import { CreateDepartmentModal } from "@/components/departments/CreateDepartmentModal"
import { UpdateDepartmentModal } from "@/components/departments/UpdateDepartmentModal"
import { DeleteDepartmentModal } from "@/components/departments/DeleteDepartmentModal"

type DepartmentsPageProps = object

export default function DepartmentsPage({}: DepartmentsPageProps) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    try {
      const data = await departmentService.getDepartments()
      setDepartments(data)
    } catch (error) {
      console.error("Failed to fetch departments:", error)
    }
  }

  const handleCreateDepartment = async (department: Partial<Department>) => {
    try {
      await departmentService.createDepartment(department)
      fetchDepartments()
      setIsCreateModalOpen(false)
    } catch (error) {
      console.error("Failed to create department:", error)
    }
  }

  const handleUpdateDepartment = async (department: Partial<Department>) => {
    try {
      await departmentService.updateDepartment(department)
      fetchDepartments()
      setIsUpdateModalOpen(false)
    } catch (error) {
      console.error("Failed to update department:", error)
    }
  }

  const handleDeleteDepartment = async () => {
    if (!selectedDepartment) return

    try {
      // Assuming the API supports deletion by ID
      await departmentService.deleteDepartment(selectedDepartment.ID)
      fetchDepartments()
      setIsDeleteModalOpen(false)
    } catch (error) {
      console.error("Failed to delete department:", error)
    }
  }

  return (
    <div className="p-6 bg-red-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-medium text-red-900">Departments</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
        >
          Create Department
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-red-100 shadow-md">
        <table className="min-w-full divide-y divide-red-200 bg-white">
          <thead className="bg-red-50">
            <tr>
              <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-red-900 sm:pl-6">ID</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-red-900">Name</th>
              <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-red-100">
            {departments.map((department) => (
              <tr key={department.ID} className="hover:bg-red-50/50">
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                  {department.ID}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700">{department.Name}</td>
                <td className="relative flex justify-end gap-2 py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <button
                    onClick={() => {
                      setSelectedDepartment(department)
                      setIsUpdateModalOpen(true)
                    }}
                    className="rounded-md bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDepartment(department)
                      setIsDeleteModalOpen(true)
                    }}
                    className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-sm text-gray-500">
                  No departments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <CreateDepartmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateDepartment}
      />
      {selectedDepartment && (
        <UpdateDepartmentModal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          onUpdate={handleUpdateDepartment}
          department={selectedDepartment}
        />
      )}
      {selectedDepartment && (
        <DeleteDepartmentModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onDelete={handleDeleteDepartment}
          department={selectedDepartment}
        />
      )}
    </div>
  )
}

