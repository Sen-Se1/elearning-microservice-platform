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
import { BookOpen, Loader2, ArrowLeft, MailCheck, Mail, Send, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const resendSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ResendForm = z.infer<typeof resendSchema>;

export default function ResendVerificationPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  React.useEffect(() => {
    if (!loading && user) {
      router.push('/courses');
    }
  }, [user, loading, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResendForm>({
    resolver: zodResolver(resendSchema),
  });

  const onSubmit = async (data: ResendForm) => {
    setIsLoading(true);
    try {
      await userPublicApi.post('/resend-verification-email', data);
      setIsSent(true);
      toast.success('Verification email resent! Please check your inbox.');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to resend verification email.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
      {/* Premium Background Orbs */}
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
          <CardHeader className="space-y-2 text-center pt-10">
            <CardTitle className="text-2xl font-bold font-outfit">Resend Verification</CardTitle>
            <CardDescription className="px-4">
              Lost your link? No problem. Enter your email and we'll send you a fresh one.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-10">
            <AnimatePresence mode="wait">
              {isSent ? (
                <motion.div 
                  key="sent"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6 space-y-6"
                >
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto shadow-[inset_0_0_20px_rgba(52,211,153,0.1)]">
                    <MailCheck className="w-10 h-10 text-emerald-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-xl text-white">Check your inbox</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      We've sent a new verification link to your email address. If you don't see it, check your spam folder.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full h-12 border-white/10 hover:bg-white/5 rounded-xl transition-all"
                    onClick={() => setIsSent(false)}
                  >
                    Use a different email
                  </Button>
                </motion.div>
              ) : (
                <motion.form 
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={handleSubmit(onSubmit)} 
                  className="space-y-6"
                >
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
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xl shadow-indigo-500/25 font-bold rounded-xl group"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <span className="flex items-center gap-2">
                        Resend Link <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
          <CardFooter className="bg-white/5 py-6 px-8 border-t border-white/5">
            <p className="text-sm text-center text-muted-foreground w-full">
              Remembered your password?{' '}
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors font-bold hover:underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
