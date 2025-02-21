// components/Auth/ResetPassword.tsx
'use client';
import React, { useState } from 'react';
import Input from '../Input';
import Button from '../Button';
import { toast } from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';

export const RequestPasswordReset = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/reset-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast.success('Password reset instructions sent to your email');
      setEmail('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to request password reset');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Email"
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Reset Password'}
      </Button>
    </form>
  );
};

export const CompletePasswordReset = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const token = searchParams.get('token');
    if (!token) {
      toast.error('Invalid reset link');
      router.push('/login');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/reset-password/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast.success('Password reset successfully');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="New Password"
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Input
        label="Confirm Password"
        id="confirmPassword"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Resetting...' : 'Set New Password'}
      </Button>
    </form>
  );
};