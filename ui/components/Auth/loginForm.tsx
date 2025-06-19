'use client';
import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Input from '../Input';
import Button from '../Button';
import { toast } from 'react-hot-toast';
import Tabs from '../Tabs';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const router = useRouter();
  const t = useTranslations('auth');
  const toastT = useTranslations('toast');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        [loginMethod === 'email' ? 'email' : 'phone']: loginMethod === 'email' ? email : phone,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Handle specific error cases
        if (result.error.includes('Account not verified')) {
          toast.error(toastT('accountNotVerified'));
        } else if (result.error.includes('set up your password')) {
          toast.error(toastT('setupPassword'));
        } else {
          toast.error(result.error || toastT('invalidCredentials'));
        }
        return;
      }

      toast.success(t('signInSuccess'));
      router.push('/');
      router.refresh();
    } catch {
      toast.error(toastT('signInError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs
        tabs={[
          { id: 'email', label: t('email') },
          { id: 'phone', label: t('phone') },
        ]}
        activeTab={loginMethod}
        onTabChange={(tab) => {
          setLoginMethod(tab as 'email' | 'phone');
          setEmail('');
          setPhone('');
        }}
      />
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {loginMethod === 'email' ? (
          <Input
            label={t('email')}
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        ) : (
          <Input
            label={t('phoneNumber')}
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            autoComplete="tel"
            placeholder="+1234567890"
          />
        )}
        
        <Input
          label={t('password')}
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
            {t('forgotPassword')}
          </Link>
        </div>
        
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t('signingIn') : t('signIn')}
        </Button>
      </form>
    </div>
  );
};

export default LoginForm;