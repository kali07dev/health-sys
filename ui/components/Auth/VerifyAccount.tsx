// components/Auth/VerifyAccount.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export const VerifyAccount = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      toast.error('Invalid verification link');
      router.push('/login');
      return;
    }

    const verifyAccount = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error);
        }

        toast.success('Account verified successfully');
        router.push('/login');
      } catch (error: any) {
        toast.error(error.message || 'Failed to verify account');
        router.push('/login');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyAccount();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {isVerifying && (
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Verifying your account...</h2>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      )}
    </div>
  );
};

