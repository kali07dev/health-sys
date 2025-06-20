import { AlertCircle } from 'lucide-react'

interface TemporaryEmployeesErrorProps {
  message?: string
  onRetry?: () => void
}

export function TemporaryEmployeesError({ 
  message = 'Failed to load temporary employees',
  onRetry 
}: TemporaryEmployeesErrorProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <AlertCircle className="h-6 w-6 text-red-600" />
      </div>
      <h3 className="mt-3 text-sm font-medium text-red-800">Error</h3>
      <p className="mt-1 text-sm text-red-700">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Try again
        </button>
      )}
    </div>
  )
}