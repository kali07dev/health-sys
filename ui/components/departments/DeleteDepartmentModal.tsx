// components/modals/DeleteDepartmentModal.tsx
import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Loader2 } from 'lucide-react';
import { Department } from '@/utils/departmentAPI';

interface DeleteDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  department: Department;
}

export function DeleteDepartmentModal({ isOpen, onClose, onDelete, department }: DeleteDepartmentModalProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);

    try {
      await onDelete();
    } catch (error) {
      console.error('Failed to delete department:', error);
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
            <Dialog.Title className="text-lg font-medium">Delete Department</Dialog.Title>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-gray-700">
            Are you sure you want to delete the department <strong>{department.Name}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={onClose}
              className="mr-2 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Delete'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}