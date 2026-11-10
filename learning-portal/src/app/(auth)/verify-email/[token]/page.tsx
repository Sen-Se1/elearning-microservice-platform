'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/shared/AuthProvider';
import { userPublicApi } from '@/lib/api';
import { BookOpen, CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  React.useEffect(() => {
    if (!loading && user) {
      router.push('/courses');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await userPublicApi.put(`/verify-email/${token}`);
        setStatus('success');
        toast.success(response.data.message || 'Email verified successfully!');
      } catch (error: any) {
        setStatus('error');
        setErrorMessage(error.response?.data?.message || 'Verification failed. The link may be invalid or expired.');
      }
    };
    if (token) verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
      {/* Premium Background Effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring', damping: 20 }}
        className="w-full max-w-md text-center"
      >
        <div className="flex justify-center mb-10">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40">
              <BookOpen className="text-white w-7 h-7" />
            </div>
            <span className="text-3xl font-bold font-outfit tracking-tight">AuraLearn</span>
          </motion.div>
        </div>

        <div className="glass rounded-[2rem] border border-white/10 p-12 backdrop-blur-2xl bg-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          {status === 'loading' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                <div className="absolute inset-4 rounded-full border-4 border-purple-500/10 border-b-purple-500 animate-spin-slow" />
                <BookOpen className="w-10 h-10 text-indigo-400 absolute inset-0 m-auto" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-outfit mb-3">Verifying your account</h1>
                <p className="text-muted-foreground leading-relaxed">
                  We're confirming your email address. This will only take a second.
                </p>
              </div>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-400/20 to-teal-400/20 flex items-center justify-center mx-auto shadow-[inset_0_0_20px_rgba(52,211,153,0.1)] border border-emerald-500/20">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold font-outfit mb-3 text-white">Email Verified!</h1>
                <p className="text-muted-foreground mb-10 leading-relaxed">
                  Welcome to the future of learning. Your account is now fully active and ready for exploration.
                </p>
                <Link 
                  href="/login" 
                  className={cn(
                    buttonVariants(), 
                    'bg-indigo-600 hover:bg-indigo-700 w-full h-14 rounded-2xl shadow-xl shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] font-semibold text-lg gap-2'
                  )}
                >
                  Get Started <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-red-400/20 to-rose-400/20 flex items-center justify-center mx-auto shadow-[inset_0_0_20px_rgba(244,63,94,0.1)] border border-red-500/20">
                <XCircle className="w-12 h-12 text-rose-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold font-outfit mb-3 text-white font-outfit">Link Expired</h1>
                <p className="text-muted-foreground mb-10 leading-relaxed text-sm">
                  {errorMessage}
                </p>
                
                <div className="flex flex-col gap-4">
                  <Link 
                    href="/resend-verification"
                    className={cn(
                      buttonVariants({ variant: 'outline' }), 
                      'border-white/10 w-full h-14 rounded-2xl hover:bg-white/5 transition-all font-medium text-lg'
                    )}
                  >
                    Resend Verification Link
                  </Link>
                  <Link 
                    href="/login" 
                    className={cn(
                      buttonVariants({ variant: 'ghost' }), 
                      'w-full h-12 text-muted-foreground hover:text-white transition-colors'
                    )}
                  >
                    Back to Sign In
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </div>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-sm text-muted-foreground/50"
        >
          &copy; 2026 AuraLearn. All rights reserved.
        </motion.p>
      </motion.div>
    </div>
  );
}
