'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/shared/AuthProvider';
import { userApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Loader2, ArrowLeft, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (!loading && user) {
      router.push('/courses');
    }
  }, [user, loading, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await userApi.post('/login', data);
      const { token, data: user } = response.data;
      
      // The backend returns { status: "success", data: userObject, token: "..." }
      // So response.data.data is the user object.
      login(token, user, { message: 'Successfully logged in!', redirect: '/courses' });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Visual Side (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-indigo-950 overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-md text-center"
        >
          <div className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
            <BookOpen className="text-white w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-6 font-outfit">
            Master New Skills with <span className="gradient-text">AuraLearn</span>
          </h1>
          <p className="text-indigo-200 text-lg leading-relaxed mb-8">
            Access thousands of courses from industry experts and take your career to the next level.
          </p>
          
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, delay: i * 0.5, repeat: Infinity, repeatDelay: 3 }}
                  className="h-full bg-white/60"
                />
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Form Side */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-4 md:px-8 relative">
        <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
        </Link>

        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex justify-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <BookOpen className="text-white w-6 h-6" />
              </div>
              <span className="text-2xl font-bold font-outfit">AuraLearn</span>
            </div>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold font-outfit tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>

          <Card className="border-none shadow-none bg-transparent lg:bg-transparent">
            <CardContent className="p-0 space-y-6">
              <div className="grid grid-cols-2 gap-4">
    
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium ml-1">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      {...register('email')}
                      type="email"
                      placeholder="name@example.com"
                      className="pl-10 bg-white/5 border-white/10 focus:border-indigo-500/50 transition-all h-11"
                    />
                  </div>
                  {errors.email && (
                    <motion.p 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      className="text-xs text-destructive ml-1"
                    >
                      {errors.email.message}
                    </motion.p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-sm font-medium">Password</label>
                    <Link href="/forgot-password" title="Recover your password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    {...register('password')}
                    type="password"
                    placeholder="••••••••"
                    className="bg-white/5 border-white/10 focus:border-indigo-500/50 transition-all h-11"
                  />
                  {errors.password && (
                    <motion.p 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      className="text-xs text-destructive ml-1"
                    >
                      {errors.password.message}
                    </motion.p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-lg shadow-indigo-500/20 font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="p-0 pt-8 flex flex-col space-y-4">
              <p className="text-sm text-center text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/register" className="text-indigo-400 hover:text-indigo-300 transition-colors font-semibold underline-offset-4 hover:underline">
                  Sign up for free
                </Link>
              </p>
              <div className="text-xs text-center text-muted-foreground/60">
                By signing in, you agree to our{' '}
                <Link href="/terms" className="underline hover:text-foreground transition-colors">Terms</Link> and{' '}
                <Link href="/privacy" className="underline hover:text-foreground transition-colors">Privacy Policy</Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
