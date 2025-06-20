import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import { TemporaryEmployee } from '@/types/temporaryEmployee'

interface DeactivateTemporaryEmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  onDeactivate: () => void
  employee: TemporaryEmployee
}

export function DeactivateTemporaryEmployeeModal({ 
  isOpen, 
  onClose, 
  onDeactivate,
  employee 
}: DeactivateTemporaryEmployeeModalProps) {
  const [loading, setLoading] = useState(false)

  const handleDeactivate = async () => {
    setLoading(true)
    try {
      await onDeactivate()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg text-black font-medium flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Confirm Deactivation
            </Dialog.Title>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to deactivate {employee.FirstName} {employee.LastName}?
              This will prevent them from appearing in active employee lists.
            </p>
            
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={loading}
                className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Deactivate
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}