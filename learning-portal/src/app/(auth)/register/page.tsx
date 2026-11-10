'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/shared/AuthProvider';
import { userPublicApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Loader2, ArrowLeft, User, Mail, Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const baseRegisterSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  passwordConfirm: z.string().min(8, 'Confirm password is required'),
  role: z.enum(['learner', 'instructor']),
});

const registerSchema = baseRegisterSchema.refine((data) => data.password === data.passwordConfirm, {
  message: "Passwords don't match",
  path: ["passwordConfirm"],
});

type RegisterForm = z.infer<typeof baseRegisterSchema>;

export default function RegisterPage() {
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && user) {
      router.push('/courses');
    }
  }, [user, loading, router]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'learner',
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await userPublicApi.post('/register', {
        ...data,
        phone: "+12125550123", // Valid E.164 format
        dateOfBirth: "1990-01-01",
        street: "123 Main St",
        city: "New York",
        state: "NY",
        country: "US", // Valid ISO 3166-1 alpha-2
        zipCode: "10001" // Valid US zip code
      });
      toast.success('Registration successful! Please check your email to verify your account.');
      router.push('/login');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const currentRole = watch('role');

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Visual Side (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-5/12 relative bg-indigo-950 overflow-hidden items-center justify-center p-12 border-r border-white/5">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-md text-center"
        >
          <div className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
            <ShieldCheck className="text-white w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-6 font-outfit">
            Start Your <span className="gradient-text">Learning Journey</span>
          </h1>
          <p className="text-indigo-200 text-lg leading-relaxed mb-8">
            Join a community of learners and educators from around the globe.
          </p>
          
          <div className="space-y-4">
            {[
              "Personalized learning paths",
              "Expert-led video courses",
              "AI-powered tutoring support",
              "Interactive coding environments"
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-3 text-indigo-300 text-sm"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                {feature}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Form Side */}
      <div className="w-full lg:w-7/12 flex flex-col items-center justify-center px-4 md:px-12 py-12 relative overflow-y-auto">
        <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
        </Link>

        <div className="w-full max-w-lg space-y-8">
          <div className="lg:hidden flex justify-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <BookOpen className="text-white w-6 h-6" />
              </div>
              <span className="text-2xl font-bold font-outfit text-white">AuraLearn</span>
            </div>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold font-outfit tracking-tight">Create an account</h2>
            <p className="text-muted-foreground">
              Sign up today and get access to exclusive learning content
            </p>
          </div>

          <Card className="bg-transparent border-none ring-0 shadow-none">
            <CardContent className="p-0">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium ml-1">First Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        {...register('firstName')}
                        placeholder="John"
                        className="pl-10 bg-white/5 border-white/10 focus:border-indigo-500/50 transition-all h-11"
                      />
                    </div>
                    {errors.firstName && (
                      <p className="text-xs text-destructive ml-1">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium ml-1">Last Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        {...register('lastName')}
                        placeholder="Doe"
                        className="pl-10 bg-white/5 border-white/10 focus:border-indigo-500/50 transition-all h-11"
                      />
                    </div>
                    {errors.lastName && (
                      <p className="text-xs text-destructive ml-1">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>
                
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
                    <p className="text-xs text-destructive ml-1">{errors.email.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        {...register('password')}
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 bg-white/5 border-white/10 focus:border-indigo-500/50 transition-all h-11"
                      />
                    </div>
                    {errors.password && (
                      <p className="text-xs text-destructive ml-1">{errors.password.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium ml-1">Confirm</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        {...register('passwordConfirm')}
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 bg-white/5 border-white/10 focus:border-indigo-500/50 transition-all h-11"
                      />
                    </div>
                    {errors.passwordConfirm && (
                      <p className="text-xs text-destructive ml-1">{errors.passwordConfirm.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium ml-1">I want to join as</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button" 
                      className={`h-24 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 ${
                        currentRole === 'learner' 
                          ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.15)]' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                      onClick={() => setValue('role', 'learner')}
                    >
                      <User className={`w-6 h-6 ${currentRole === 'learner' ? 'text-indigo-400' : 'text-muted-foreground'}`} />
                      <span className={`text-sm font-semibold ${currentRole === 'learner' ? 'text-white' : 'text-muted-foreground'}`}>Learner</span>
                    </button>
                    <button 
                      type="button" 
                      className={`h-24 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 ${
                        currentRole === 'instructor' 
                          ? 'bg-purple-600/20 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.15)]' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                      onClick={() => setValue('role', 'instructor')}
                    >
                      <ShieldCheck className={`w-6 h-6 ${currentRole === 'instructor' ? 'text-purple-400' : 'text-muted-foreground'}`} />
                      <span className={`text-sm font-semibold ${currentRole === 'instructor' ? 'text-white' : 'text-muted-foreground'}`}>Instructor</span>
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-lg shadow-indigo-500/20 font-bold text-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="p-0 pt-8 bg-transparent border-none">
              <p className="text-sm text-center text-muted-foreground w-full">
                Already have an account?{' '}
                <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors font-bold hover:underline underline-offset-4">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
