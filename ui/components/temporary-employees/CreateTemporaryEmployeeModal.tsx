import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { X, Loader2 } from 'lucide-react'
import { CreateTemporaryEmployeeRequest } from '@/types/temporaryEmployee'
import LocationDropdown from "@/components/locationDropDown";
import DepartmentDropdown from "@/components/DepartmentDropdown";

interface CreateTemporaryEmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (employee: CreateTemporaryEmployeeRequest) => void
}

export function CreateTemporaryEmployeeModal({ 
  isOpen, 
  onClose, 
  onCreate 
}: CreateTemporaryEmployeeModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreateTemporaryEmployeeRequest>({
    FirstName: '',
    LastName: '',
    Department: '',
    Position: '',
    ContactNumber: '',
    OfficeLocation: '',
    IsActive: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onCreate(formData)
      setFormData({
        FirstName: '',
        LastName: '',
        Department: '',
        Position: '',
        ContactNumber: '',
        OfficeLocation: '',
        IsActive: true
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleDepartmentChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      Department: value
    }))
  }

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      OfficeLocation: e.target.value
    }))
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-xl rounded-lg bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg text-black font-medium">Add Temporary Employee</Dialog.Title>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black">First Name*</label>
                <input
                  type="text"
                  name="FirstName"
                  value={formData.FirstName}
                  onChange={handleChange}
                  className="mt-1 text-black text-black block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black">Last Name*</label>
                <input
                  type="text"
                  name="LastName"
                  value={formData.LastName}
                  onChange={handleChange}
                  className="mt-1 text-black block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black">Department</label>
                <DepartmentDropdown
                  value={formData.Department ?? ''}
                  onChange={handleDepartmentChange}
                  placeholder="Select Department"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black">Position</label>
                <input
                  type="text"
                  name="Position"
                  value={formData.Position}
                  onChange={handleChange}
                  className="mt-1 text-black block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black">Contact Number</label>
                <input
                  type="text"
                  name="ContactNumber"
                  value={formData.ContactNumber}
                  onChange={handleChange}
                  className="mt-1 text-black block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black">Office Location</label>
                <LocationDropdown
                  id="OfficeLocation"
                  name="OfficeLocation"
                  value={formData.OfficeLocation ?? ""}
                  onChange={handleLocationChange}
                  required
                />
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="IsActive"
                checked={formData.IsActive || false}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="ml-2 block text-sm text-black">Active</label>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-black hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create Employee
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}