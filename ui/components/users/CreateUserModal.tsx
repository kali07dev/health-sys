// components/modals/CreateUserModal.tsx
import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Loader2, Plus, Trash2 } from 'lucide-react'; // Import icons
import { userService } from '@/utils/userAPI';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [isBulk, setIsBulk] = useState(false);
  const [userRows, setUserRows] = useState([{ email: '', firstName: '', lastName: '', department: '', position: '', contactNumber: '' }]);

  const addNewRow = () => {
    const lastRow = userRows[userRows.length - 1];
    if (Object.values(lastRow).some((value) => value.trim() === '')) {
      alert('Please fill out the current row before adding a new one.');
      return;
    }
    setUserRows([...userRows, { email: '', firstName: '', lastName: '', department: '', position: '', contactNumber: '' }]);
  };

  const deleteRow = (index: number) => {
    if (userRows.length === 1) {
      alert('At least one row must remain.');
      return;
    }
    const updatedRows = userRows.filter((_, i) => i !== index);
    setUserRows(updatedRows);
  };

  const handleInputChange = (index: number, field: string, value: string) => {
    const updatedRows = [...userRows];
    updatedRows[index][field as keyof typeof updatedRows[0]] = value;
    setUserRows(updatedRows);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRows.some((row) => Object.values(row).some((value) => value.trim() === ''))) {
      alert('Please ensure all rows are filled out before submitting.');
      return;
    }

    setLoading(true);

    try {
      if (isBulk) {
        await userService.bulkcreateUserWithEmployee(userRows);
      } else {
        await userService.createUserWithEmployee(userRows[0]);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to create users:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-4xl rounded-lg bg-white p-6 shadow-xl sm:p-8"> {/* Increased modal size */}
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
            {isBulk ? (
              <div className="space-y-4">
                {userRows.map((row, index) => (
                  <div key={index} className="grid grid-cols-1 gap-4 sm:grid-cols-8">
                    <input
                      type="email"
                      placeholder="Email"
                      value={row.email}
                      onChange={(e) => handleInputChange(index, 'email', e.target.value)}
                      className="col-span-1 sm:col-span-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                    <input
                      type="text"
                      placeholder="First Name"
                      value={row.firstName}
                      onChange={(e) => handleInputChange(index, 'firstName', e.target.value)}
                      className="col-span-1 sm:col-span-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={row.lastName}
                      onChange={(e) => handleInputChange(index, 'lastName', e.target.value)}
                      className="col-span-1 sm:col-span-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Department"
                      value={row.department}
                      onChange={(e) => handleInputChange(index, 'department', e.target.value)}
                      className="col-span-1 sm:col-span-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Position"
                      value={row.position}
                      onChange={(e) => handleInputChange(index, 'position', e.target.value)}
                      className="col-span-1 sm:col-span-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Contact Number"
                      value={row.contactNumber}
                      onChange={(e) => handleInputChange(index, 'contactNumber', e.target.value)}
                      className="col-span-1 sm:col-span-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                    <div className="col-span-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => deleteRow(index)}
                        className="inline-flex items-center justify-center rounded-md bg-red-600 p-2 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        disabled={userRows.length === 1}
                      >
                        <Trash2 className="h-4 w-4" /> {/* Icon for delete */}
                      </button>
                      <button
                        type="button"
                        onClick={addNewRow}
                        className="inline-flex items-center justify-center rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        <Plus className="h-4 w-4" /> {/* Icon for add */}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={userRows[0].email}
                  onChange={(e) => handleInputChange(0, 'email', e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  required
                />
                <input
                  type="text"
                  placeholder="First Name"
                  value={userRows[0].firstName}
                  onChange={(e) => handleInputChange(0, 'firstName', e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={userRows[0].lastName}
                  onChange={(e) => handleInputChange(0, 'lastName', e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  required
                />
                <input
                  type="text"
                  placeholder="Department"
                  value={userRows[0].department}
                  onChange={(e) => handleInputChange(0, 'department', e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  required
                />
                <input
                  type="text"
                  placeholder="Position"
                  value={userRows[0].position}
                  onChange={(e) => handleInputChange(0, 'position', e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  required
                />
                <input
                  type="tel"
                  placeholder="Contact Number"
                  value={userRows[0].contactNumber}
                  onChange={(e) => handleInputChange(0, 'contactNumber', e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>
            )}
            <div className="flex justify-end mt-6">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Users'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}