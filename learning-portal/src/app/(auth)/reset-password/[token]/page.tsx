'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { userPublicApi } from '@/lib/api';
import { useAuth } from '@/components/shared/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { BookOpen, Loader2, KeyRound, CheckCircle2, ShieldCheck, Lock, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const resetSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  passwordConfirm: z.string().min(8, 'Please confirm your password'),
}).refine(data => data.password === data.passwordConfirm, {
  message: "Passwords don't match",
  path: ['passwordConfirm'],
});
type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const { token } = useParams();
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  React.useEffect(() => {
    if (!loading && user) {
      router.push('/courses');
    }
  }, [user, loading, router]);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetForm) => {
    setIsLoading(true);
    try {
      const response = await userPublicApi.put(`/resetPassword/${token}`, data);
      const { token: jwt, data: userData } = response.data;
      
      setDone(true);
      toast.success('Password reset successfully!');
      
      // Auto-login and redirect to dashboard after a short delay
      setTimeout(() => {
        login(jwt, userData, { 
          message: 'Welcome back! You are now logged in.', 
          redirect: '/courses' 
        });
      }, 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Reset link may be invalid or expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
      {/* Premium Background Effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-10 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40">
              <BookOpen className="text-white w-8 h-8" />
            </div>
            <span className="text-3xl font-bold font-outfit tracking-tight">AuraLearn</span>
          </div>
        </div>

        <Card className="glass rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden">
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="success-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="pt-10 pb-12 px-8 text-center"
              >
                <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-6 shadow-[inset_0_0_20px_rgba(52,211,153,0.1)] border border-emerald-500/20">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <CardTitle className="text-3xl font-bold font-outfit text-white mb-3">Password Reset!</CardTitle>
                <CardDescription className="text-base mb-8">
                  Your new password has been secured. Redirecting you to your dashboard...
                </CardDescription>
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
              </motion.div>
            ) : (
              <motion.div
                key="form-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <CardHeader className="space-y-2 text-center pt-10">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30 mb-4 mx-auto">
                    <ShieldCheck className="w-6 h-6 text-indigo-400" />
                  </div>
                  <CardTitle className="text-2xl font-bold font-outfit">Set New Password</CardTitle>
                  <CardDescription>
                    Please create a strong new password to protect your account.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium ml-1">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          {...register('password')}
                          type="password"
                          placeholder="••••••••"
                          className="pl-10 bg-white/5 border-white/10 focus:border-indigo-500/50 transition-all h-12 rounded-xl"
                        />
                      </div>
                      {errors.password && <p className="text-xs text-destructive ml-1">{errors.password.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium ml-1">Confirm New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          {...register('passwordConfirm')}
                          type="password"
                          placeholder="••••••••"
                          className="pl-10 bg-white/5 border-white/10 focus:border-indigo-500/50 transition-all h-12 rounded-xl"
                        />
                      </div>
                      {errors.passwordConfirm && <p className="text-xs text-destructive ml-1">{errors.passwordConfirm.message}</p>}
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/25 font-bold rounded-xl group transition-all"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Securing...</>
                      ) : (
                        <span className="flex items-center gap-2">
                          Update & Login <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
}
