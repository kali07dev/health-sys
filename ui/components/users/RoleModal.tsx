// components/modals/RoleModal.tsx
import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Loader2 } from 'lucide-react';
import { User, userService } from '@/utils/userAPI';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess: () => void;
}

export function RoleModal({ isOpen, onClose, user, onSuccess }: RoleModalProps) {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(user?.role || '');

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await userService.updateUserRole(user.id, role);
      onSuccess();
    } catch (error) {
      console.error('Failed to update role:', error);
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
            <Dialog.Title className="text-lg font-medium">Update Role</Dialog.Title>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Select Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="safety_officer">Safety Officer</option>
              <option value="admin">Admin</option>
            </select>
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
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}