  // app/components/ErrorMessage.tsx
  interface ErrorMessageProps {
    message: string;
    retry?: () => void;
  }
  
  export default function ErrorMessage({ message, retry }: ErrorMessageProps) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex flex-col items-center space-y-4 text-center">
          <p className="text-red-800">{message}</p>
          {retry && (
            <button
              onClick={retry}
              className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }