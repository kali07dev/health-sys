import { Suspense } from 'react';
import { VerifyAccount } from '@/components/Auth/VerifyAccount';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function VerifyPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <VerifyAccount />
    </Suspense>
  );
}