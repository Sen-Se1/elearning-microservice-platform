'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/shared/AuthProvider';
import { userPublicApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Loader2, ArrowLeft, Mail, CheckCircle2, ChevronRight, Lock } from 'lucide-react';
import { toast } from 'sonner';

const forgotSchema = z.object({
  email: z.string().email('Invalid email address'),
});
type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  React.useEffect(() => {
    if (!loading && user) {
      router.push('/courses');
    }
  }, [user, loading, router]);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    setIsLoading(true);
    try {
      await userPublicApi.post('/forgotPassword', data);
      setSent(true);
      toast.success('Reset link sent! Check your inbox.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong. Please try again.');
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

      <Link href="/login" className="absolute top-8 left-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Login
      </Link>

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
            {sent ? (
              <motion.div
                key="sent-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="pt-10 pb-8 px-8"
              >
                <CardHeader className="text-center pb-6">
                  <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-6 shadow-[inset_0_0_20px_rgba(52,211,153,0.1)] border border-emerald-500/20">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>
                  <CardTitle className="text-2xl font-bold font-outfit text-white">Check Your Email</CardTitle>
                  <CardDescription className="text-base">
                    We've sent a recovery link to your inbox. It might take a moment to appear.
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex flex-col gap-4 p-0">
                  <Button
                    variant="outline"
                    className="w-full h-12 border-white/10 hover:bg-white/5 rounded-xl transition-all"
                    onClick={() => setSent(false)}
                  >
                    Try another email
                  </Button>
                  <Link 
                    href="/login" 
                    className="text-sm text-muted-foreground hover:text-white transition-colors text-center font-medium mt-2"
                  >
                    Return to Login
                  </Link>
                </CardFooter>
              </motion.div>
            ) : (
              <motion.div
                key="form-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <CardHeader className="space-y-2 text-center pt-10">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30 mb-4 mx-auto">
                    <Lock className="w-6 h-6 text-indigo-400" />
                  </div>
                  <CardTitle className="text-2xl font-bold font-outfit">Forgot Password?</CardTitle>
                  <CardDescription>
                    Enter your email address and we'll send you instructions to reset your password.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-4 pt-2">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium ml-1">Email address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          {...register('email')}
                          type="email"
                          placeholder="name@example.com"
                          className="pl-10 bg-white/5 border-white/10 focus:border-indigo-500/50 transition-all h-12 rounded-xl"
                        />
                      </div>
                      {errors.email && (
                        <p className="text-xs text-destructive ml-1">{errors.email.message}</p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/25 font-bold rounded-xl group transition-all"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                      ) : (
                        <span className="flex items-center gap-2">
                          Send Recovery Link <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </Button>
                  </form>
                </CardContent>
                <CardFooter className="bg-white/5 py-6 px-8 border-t border-white/5 mt-4">
                  <div className="text-sm text-center text-muted-foreground w-full">
                    Remembered your password?{' '}
                    <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors font-bold hover:underline underline-offset-4">
                      Sign in
                    </Link>
                  </div>
                </CardFooter>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
}
