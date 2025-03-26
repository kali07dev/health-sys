// components/Auth/LoginForm.tsx
'use client';
import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Input from '../Input';
import Button from '../Button';
import { toast } from 'react-hot-toast';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Handle specific error cases
        if (result.error.includes('Account not verified')) {
          toast.error('Please check your email for verification instructions');
        } else if (result.error.includes('set up your password')) {
          toast.error('Please check your email to set up your password');
        } else {
          toast.error(result.error || 'Invalid email or password');
        }
        return;
      }

      toast.success('Signed in successfully');
      router.push('/');
      router.refresh();
    } catch {
      toast.error('An error occurred during sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email"
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          label="Password"
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        <div className="flex items-center justify-between">
          <Link
            href="/auth/reset-password"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Forgot your password?
          </Link>
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </div>
  );
};

export default LoginForm;