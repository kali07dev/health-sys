// app/components/LoadingSpinner.tsx
export default function LoadingSpinner() {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }
  

  
  // // app/components/PageHeader.tsx
  // interface PageHeaderProps {
  //   title: string;
  //   description?: string;
  // }
  
  // export default function PageHeader({ title, description }: PageHeaderProps) {
  //   return (
  //     <div className="mb-8">
  //       <h1 className="text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
  //       {description && (
  //         <p className="mt-2 text-sm text-gray-600">{description}</p>
  //       )}
  //     </div>
  //   );
  // }