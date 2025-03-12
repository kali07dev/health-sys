import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';
import { userService } from '@/utils/userAPI';

// Define the updated UserRow interface to match backend requirements
export interface UserRow {
  email: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  contactNumber: string;
  password: string;
  confirmPassword: string;
  employeeNumber: string;
  role: 'admin' | 'safety_officer' | 'manager' | 'employee';
  startDate: string; // Using string format for date inputs
  officeLocation: string;
  reportingManagerId?: string;
  endDate?: string; // Using string format for date inputs
  isSafetyOfficer?: boolean;
  emergencyContact?: string;
}

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [isBulk, setIsBulk] = useState(false);
  const [userRows, setUserRows] = useState<UserRow[]>([{
    email: '',
    firstName: '',
    lastName: '',
    department: '',
    position: '',
    contactNumber: '',
    password: '',
    confirmPassword: '',
    employeeNumber: '',
    role: 'employee',
    startDate: new Date().toISOString().split('T')[0], // Current date as default
    officeLocation: '',
    isSafetyOfficer: false,
    emergencyContact: ''
  }]);

  const addNewRow = () => {
    const lastRow = userRows[userRows.length - 1];
    const requiredFields = ['email', 'firstName', 'lastName', 'department', 'position', 
      'contactNumber', 'password', 'confirmPassword', 'employeeNumber', 'role', 'startDate', 'officeLocation'];
    
    if (requiredFields.some((field) => !lastRow[field as keyof UserRow])) {
      alert('Please fill out all required fields in the current row before adding a new one.');
      return;
    }
    
    setUserRows([...userRows, {
      email: '',
      firstName: '',
      lastName: '',
      department: '',
      position: '',
      contactNumber: '',
      password: '',
      confirmPassword: '',
      employeeNumber: '',
      role: 'employee',
      startDate: new Date().toISOString().split('T')[0],
      officeLocation: '',
      isSafetyOfficer: false,
      emergencyContact: ''
    }]);
  };

  const deleteRow = (index: number) => {
    if (userRows.length === 1) {
      alert('At least one row must remain.');
      return;
    }
    const updatedRows = userRows.filter((_, i) => i !== index);
    setUserRows(updatedRows);
  };

  const handleInputChange = (index: number, field: keyof UserRow, value: string | boolean | undefined) => {
    const updatedRows = [...userRows];
    updatedRows[index][field] = value as never;
    setUserRows(updatedRows);
  };

  const formatUserForBackend = (user: UserRow) => {
    return {
      email: user.email,
      password: user.password,
      confirmpassword: user.confirmPassword,
      firstname: user.firstName,
      lastname: user.lastName,
      department: user.department,
      position: user.position,
      contactnumber: user.contactNumber,
      employee_number: user.employeeNumber,
      role: user.role,
      start_date: new Date(user.startDate).toISOString(),
      officelocation: user.officeLocation,
      reporting_manager_id: user.reportingManagerId || null,
      end_date: user.endDate ? new Date(user.endDate).toISOString() : null,
      is_safety_officer: user.isSafetyOfficer || false,
      emergency_contact: user.emergencyContact || ''
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = ['email', 'firstName', 'lastName', 'department', 'position', 
      'contactNumber', 'password', 'confirmPassword', 'employeeNumber', 'role', 'startDate', 'officeLocation'];
    
    for (const row of userRows) {
      for (const field of requiredFields) {
        if (!row[field as keyof UserRow]) {
          alert(`Please ensure all required fields are filled out. Missing: ${field}`);
          return;
        }
      }
      
      // Validate password matching
      if (row.password !== row.confirmPassword) {
        alert('Password and Confirm Password must match.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isBulk) {
        const formattedData = userRows.map(formatUserForBackend);
        await userService.bulkcreateUserWithEmployee(formattedData);
      } else {
        const formattedData = formatUserForBackend(userRows[0]);
        await userService.createUserWithEmployee(formattedData);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to create users:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderUserForm = (row: UserRow, index: number) => (
    <div key={index} className="space-y-4 p-4 border border-gray-200 rounded-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
          <input
            type="email"
            value={row.email}
            onChange={(e) => handleInputChange(index, 'email', e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Employee Number*</label>
          <input
            type="text"
            value={row.employeeNumber}
            onChange={(e) => handleInputChange(index, 'employeeNumber', e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password*</label>
          <input
            type="password"
            value={row.password}
            onChange={(e) => handleInputChange(index, 'password', e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password*</label>
          <input
            type="password"
            value={row.confirmPassword}
            onChange={(e) => handleInputChange(index, 'confirmPassword', e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name*</label>
          <input
            type="text"
            value={row.firstName}
            onChange={(e) => handleInputChange(index, 'firstName', e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name*</label>
          <input
            type="text"
            value={row.lastName}
            onChange={(e) => handleInputChange(index, 'lastName', e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number*</label>
          <input
            type="tel"
            value={row.contactNumber}
            onChange={(e) => handleInputChange(index, 'contactNumber', e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Department*</label>
          <input
            type="text"
            value={row.department}
            onChange={(e) => handleInputChange(index, 'department', e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Position*</label>
          <input
            type="text"
            value={row.position}
            onChange={(e) => handleInputChange(index, 'position', e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Office Location*</label>
          <input
            type="text"
            value={row.officeLocation}
            onChange={(e) => handleInputChange(index, 'officeLocation', e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role*</label>
          <select
            value={row.role}
            onChange={(e) => handleInputChange(index, 'role', e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            required
          >
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="safety_officer">Safety Officer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date*</label>
          <input
            type="date"
            value={row.startDate}
            onChange={(e) => handleInputChange(index, 'startDate', e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={row.endDate || ''}
            onChange={(e) => handleInputChange(index, 'endDate', e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
          <input
            type="text"
            value={row.emergencyContact || ''}
            onChange={(e) => handleInputChange(index, 'emergencyContact', e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Manager ID</label>
          <input
            type="text"
            value={row.reportingManagerId || ''}
            onChange={(e) => handleInputChange(index, 'reportingManagerId', e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="flex items-center mt-2">
        <input
          type="checkbox"
          checked={row.isSafetyOfficer || false}
          onChange={(e) => handleInputChange(index, 'isSafetyOfficer', e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label className="ml-2 block text-sm text-gray-700">Is Safety Officer</label>
      </div>
      
      {isBulk && (
        <div className="flex justify-end mt-4 space-x-2">
          <button
            type="button"
            onClick={() => deleteRow(index)}
            className="inline-flex items-center justify-center rounded-md bg-red-600 p-2 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            disabled={userRows.length === 1}
          >
            <Trash2 className="h-4 w-4" />
          </button>
          {index === userRows.length - 1 && (
            <button
              type="button"
              onClick={addNewRow}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-4xl rounded-lg bg-white p-6 shadow-xl sm:p-8 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-medium">{isBulk ? 'Bulk Create Users' : 'Create User'}</Dialog.Title>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">Bulk Creation</label>
              <input
                type="checkbox"
                checked={isBulk}
                onChange={() => setIsBulk(!isBulk)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            
            <div className="space-y-6">
              {userRows.map((row, index) => renderUserForm(row, index))}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                {isBulk ? 'Create Users' : 'Create User'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}