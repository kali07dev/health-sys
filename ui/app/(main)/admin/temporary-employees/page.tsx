'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  UserPlus, 
  Pencil, 
  UserX,
  UserCheck,
  Search,
  X,
//   Loader2,
//   AlertCircle
} from 'lucide-react'
import { 
  TemporaryEmployee,
  CreateTemporaryEmployeeRequest,
  UpdateTemporaryEmployeeRequest,
  SearchCriteria
} from '@/types/temporaryEmployee'
import { temporaryEmployeeService } from '@/utils/temporaryEmployeeAPI'
import { CreateTemporaryEmployeeModal } from '@/components/temporary-employees/CreateTemporaryEmployeeModal'
import { UpdateTemporaryEmployeeModal } from '@/components/temporary-employees/UpdateTemporaryEmployeeModal'
import { DeactivateTemporaryEmployeeModal } from '@/components/temporary-employees/DeactivateTemporaryEmployeeModal'
import { TemporaryEmployeesSkeleton } from '@/components/temporary-employees/TemporaryEmployeesSkeleton'
import { TemporaryEmployeesError } from '@/components/temporary-employees/TemporaryEmployeesError'

export default function TemporaryEmployeesPage() {
  const [employees, setEmployees] = useState<TemporaryEmployee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<TemporaryEmployee[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<TemporaryEmployee | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    const criteria: SearchCriteria = {
      FirstName: searchTerm,
      LastName: searchTerm,
      Department: searchTerm,
      Position: searchTerm
    }
    filterEmployees(criteria)
  }, [searchTerm, employees, filterEmployees])

  const fetchEmployees = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await temporaryEmployeeService.getEmployees()
      setEmployees(data)
      setFilteredEmployees(data)
      console.log("Temporary employees fetched successfully:", data)
    } catch (err) {
      setError('Failed to load temporary employees. Please try again.')
      console.error("Failed to fetch temporary employees:", err)
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  const filterEmployees = useCallback((criteria: SearchCriteria) => {
    // If no search term, show all employees
    if (!searchTerm.trim()) {
      setFilteredEmployees(employees)
      return
    }

    const filtered = employees.filter(emp => 
      (criteria.FirstName && emp.FirstName.toLowerCase().includes(criteria.FirstName.toLowerCase())) ||
      (criteria.LastName && emp.LastName.toLowerCase().includes(criteria.LastName.toLowerCase())) ||
      (criteria.Department && emp.Department.toLowerCase().includes(criteria.Department.toLowerCase())) ||
      (criteria.Position && emp.Position.toLowerCase().includes(criteria.Position.toLowerCase()))
    )
    setFilteredEmployees(filtered)
  }, [searchTerm, employees])

  const handleCreateEmployee = async (request: CreateTemporaryEmployeeRequest) => {
    try {
      await temporaryEmployeeService.createEmployee(request)
      await fetchEmployees()
      setIsCreateModalOpen(false)
    } catch (err) {
      console.error("Failed to create employee:", err)
      setError('Failed to create employee. Please try again.')
    }
  }

  const handleUpdateEmployee = async (request: UpdateTemporaryEmployeeRequest) => {
    if (!selectedEmployee) return
    
    try {
      await temporaryEmployeeService.updateEmployee({
        ...request,
        ID: selectedEmployee.ID
      })
      await fetchEmployees()
      setIsUpdateModalOpen(false)
    } catch (err) {
      console.error("Failed to update employee:", err)
      setError('Failed to update employee. Please try again.')
    }
  }

  const handleDeactivateEmployee = async () => {
    if (!selectedEmployee) return

    try {
      await temporaryEmployeeService.deactivateEmployee(selectedEmployee.ID)
      fetchEmployees()
      setIsDeactivateModalOpen(false)
    } catch (err) {
      console.error("Failed to deactivate employee:", err)
      setError('Failed to deactivate employee. Please try again.')
    }
  }

  const handleReactivateEmployee = async (id: number) => {
    try {
      await temporaryEmployeeService.reactivateEmployee(id)
      fetchEmployees()
    } catch (err) {
      console.error("Failed to reactivate employee:", err)
      setError('Failed to reactivate employee. Please try again.')
    }
  }

  return (
    <div className="p-6 bg-gray-50">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Temporary Employees</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage all temporary staff members and their details
          </p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-8 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchTerm && (
              <X 
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer"
                onClick={() => setSearchTerm('')}
              />
            )}
          </div>
          
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Add Employee
          </button>
        </div>
      </div>

      {error ? (
        <TemporaryEmployeesError 
          message={error} 
          onRetry={fetchEmployees} 
        />
      ) : loading ? (
        <TemporaryEmployeesSkeleton />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee.ID} className={employee.IsActive ? '' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-600">
                          {employee.FirstName.charAt(0)}{employee.LastName.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.FirstName} {employee.LastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {employee.OfficeLocation}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.Department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.Position}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.ContactNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      employee.IsActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.IsActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedEmployee(employee)
                          setIsUpdateModalOpen(true)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      
                      {employee.IsActive ? (
                        <button
                          onClick={() => {
                            setSelectedEmployee(employee)
                            setIsDeactivateModalOpen(true)
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Deactivate"
                        >
                          <UserX className="h-5 w-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivateEmployee(employee.ID)}
                          className="text-green-600 hover:text-green-900"
                          title="Reactivate"
                        >
                          <UserCheck className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    {searchTerm ? 'No matching employees found' : 'No temporary employees available'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <CreateTemporaryEmployeeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateEmployee}
      />
      
      {selectedEmployee && (
        <>
          <UpdateTemporaryEmployeeModal
            isOpen={isUpdateModalOpen}
            onClose={() => setIsUpdateModalOpen(false)}
            onUpdate={handleUpdateEmployee}
            employee={selectedEmployee}
          />
          
          <DeactivateTemporaryEmployeeModal
            isOpen={isDeactivateModalOpen}
            onClose={() => setIsDeactivateModalOpen(false)}
            onDeactivate={handleDeactivateEmployee}
            employee={selectedEmployee}
          />
        </>
      )}
    </div>
  )
}