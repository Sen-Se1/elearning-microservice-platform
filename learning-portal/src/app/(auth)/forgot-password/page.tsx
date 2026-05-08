'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { userApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Loader2, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const forgotSchema = z.object({
  email: z.string().email('Invalid email address'),
});
type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    setIsLoading(true);
    try {
      await userApi.post('/forgotPassword', data);
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
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] -z-10" />

      <Link href="/login" className="absolute top-8 left-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Login
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <BookOpen className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold font-outfit">AuraLearn</span>
          </div>
        </div>

        <Card className="glass border-white/10">
          {sent ? (
            <>
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <CardTitle className="text-2xl font-bold font-outfit">Check Your Email</CardTitle>
                <CardDescription>
                  We sent a password reset link to your email address. It may take a minute to arrive.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex flex-col gap-4 pt-4">
                <Button
                  variant="outline"
                  className="w-full border-white/10"
                  onClick={() => setSent(false)}
                >
                  Try another email
                </Button>
                <Link href="/login" className="text-sm text-indigo-400 hover:underline text-center">
                  Back to login
                </Link>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1">
                <div className="w-12 h-12 rounded-xl bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30 mb-2">
                  <Mail className="w-6 h-6 text-indigo-400" />
                </div>
                <CardTitle className="text-2xl font-bold font-outfit">Forgot Password?</CardTitle>
                <CardDescription>
                  Enter your email and we'll send you a link to reset your password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      {...register('email')}
                      type="email"
                      placeholder="name@example.com"
                      className="bg-white/5 border-white/10 h-11"
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email.message}</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                </form>
              </CardContent>
              <CardFooter>
                <div className="text-sm text-center text-muted-foreground w-full">
                  Remember your password?{' '}
                  <Link href="/login" className="text-indigo-400 hover:underline font-medium">
                    Sign in
                  </Link>
                </div>
              </CardFooter>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
