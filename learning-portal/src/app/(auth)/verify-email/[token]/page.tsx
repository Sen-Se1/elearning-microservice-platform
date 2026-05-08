'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { userApi } from '@/lib/api';
import { BookOpen, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const verify = async () => {
      try {
        await userApi.put(`/verify-email/${token}`);
        setStatus('success');
      } catch {
        setStatus('error');
      }
    };
    if (token) verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] -z-10" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md text-center"
      >
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <BookOpen className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold font-outfit">AuraLearn</span>
          </div>
        </div>

        <div className="glass rounded-3xl border border-white/10 p-12">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-indigo-400 animate-spin mx-auto mb-6" />
              <h1 className="text-2xl font-bold font-outfit mb-2">Verifying your email...</h1>
              <p className="text-muted-foreground">Please wait a moment.</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold font-outfit mb-2">Email Verified!</h1>
              <p className="text-muted-foreground mb-8">Your account is now active. You can log in and start learning.</p>
              <Link href="/login" className={cn(buttonVariants(), 'bg-indigo-600 hover:bg-indigo-700 w-full h-11')}>
                Sign In Now
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold font-outfit mb-2">Verification Failed</h1>
              <p className="text-muted-foreground mb-8">This link may be invalid or expired. Please request a new verification email.</p>
              <Link href="/login" className={cn(buttonVariants({ variant: 'outline' }), 'border-white/10 w-full h-11')}>
                Back to Login
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
