// components/modals/UpdateDepartmentModal.tsx
import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Loader2 } from 'lucide-react';
import { Department } from '@/utils/departmentAPI';

interface UpdateDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (department: Partial<Department>) => void;
  department: Department;
}

export function UpdateDepartmentModal({ isOpen, onClose, onUpdate, department }: UpdateDepartmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [Name, setName] = useState(department.Name);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onUpdate({ ID: department.ID, Name });
    } catch (error) {
      console.error('Failed to update department:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium">Update Department</Dialog.Title>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={Name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="mr-2 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Update'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}