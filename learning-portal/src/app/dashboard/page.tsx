'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { useAuth } from '@/components/shared/AuthProvider';
import { courseApi, analyticsApi } from '@/lib/api';
import { Course } from '@/types';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import {
  BookOpen, Clock, TrendingUp, Award, PlayCircle,
  ArrowRight, BarChart2, CheckCircle2, Sparkles, Eye, Users
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Enrollment {
  id: string;
  course_id: string;
  progress_percentage: number;
  completed: boolean;
  enrolled_at: string;
  course?: Course;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [topCourses, setTopCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role === 'instructor') {
      router.push('/instructor');
      return;
    }

    const fetchData = async () => {
      try {
        const [enrollRes, topRes] = await Promise.all([
          courseApi.get('/enrollments/me'),
          analyticsApi.get('/metrics/top-courses?limit=5').catch(() => ({ data: [] })),
        ]);
        
        const enrollmentData = enrollRes.data.items || enrollRes.data || [];
        setEnrollments(enrollmentData);

        // Enrich top courses with titles
        let rawTop = topRes.data.items || topRes.data || [];
        // Filter out zero-UUID if it exists
        rawTop = rawTop.filter((c: any) => c.course_id !== '00000000-0000-0000-0000-000000000000');

        try {
          const coursesRes = await courseApi.get('/courses/');
          const allCourses = coursesRes.data.items || coursesRes.data || [];
          const enrichedTop = rawTop.map((topItem: any) => {
            const course = allCourses.find((ac: any) => ac.id === topItem.course_id);
            return {
              ...topItem,
              title: course?.title || `Course ${topItem.course_id.slice(0, 5)}...`
            };
          });
          setTopCourses(enrichedTop);
        } catch (e) {
          setTopCourses(rawTop);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, authLoading, router]);

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
  </div>;

  if (!user) return null;

  const completedCount = enrollments.filter(e => e.completed).length;
  const inProgressCount = enrollments.filter(e => !e.completed).length;
  const avgProgress = enrollments.length
    ? Math.round(enrollments.reduce((s, e) => s + (e.progress_percentage || 0), 0) / enrollments.length)
    : 0;

  const stats = [
    { label: 'Enrolled Courses', value: enrollments.length, icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'In Progress', value: inProgressCount, icon: TrendingUp, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Completed', value: completedCount, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Avg. Progress', value: `${avgProgress}%`, icon: BarChart2, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="border-b border-white/5 bg-black/20 py-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-indigo-400 mb-2 text-sm font-medium">
            <Sparkles className="w-4 h-4" /> My Learning Dashboard
          </div>
          <h1 className="text-4xl font-bold font-outfit">
            Welcome back, <span className="gradient-text">{user?.firstName || 'Learner'}</span> 👋
          </h1>
          <p className="text-muted-foreground mt-2">Track your progress and continue where you left off.</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-6 border border-white/5"
            >
              <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center mb-4', s.bg)}>
                <s.icon className={cn('w-5 h-5', s.color)} />
              </div>
              <div className="text-3xl font-bold font-outfit mb-1">{loading ? '—' : s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* My Courses */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-outfit">My Courses</h2>
              <Link href="/courses" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-indigo-400 gap-1')}>
                Browse more <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
              </div>
            ) : enrollments.length === 0 ? (
              <div className="glass rounded-3xl border border-white/5 p-12 text-center">
                <BookOpen className="w-14 h-14 text-indigo-400 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold mb-2">No courses yet</h3>
                <p className="text-muted-foreground mb-6">Start learning by enrolling in a course from our catalog.</p>
                <Link href="/courses" className={cn(buttonVariants(), 'bg-indigo-600 hover:bg-indigo-700')}>
                  Explore Courses
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {enrollments.map((enrollment, i) => (
                  <motion.div
                    key={enrollment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass rounded-2xl border border-white/5 p-5 flex items-center gap-5 group hover:border-indigo-500/30 transition-all"
                  >
                    <div className="w-14 h-14 rounded-xl bg-indigo-600/20 flex items-center justify-center flex-shrink-0 border border-indigo-500/20 group-hover:bg-indigo-600/30 transition-colors">
                      <PlayCircle className="w-7 h-7 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold truncate">Course {enrollment.course_id.slice(0, 8)}...</h3>
                        {enrollment.completed && (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[10px]">Completed</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                            style={{ width: `${enrollment.progress_percentage || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8">{enrollment.progress_percentage || 0}%</span>
                      </div>
                    </div>
                    <Link
                      href={`/courses/${enrollment.course_id}`}
                      className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-indigo-400 flex-shrink-0')}
                    >
                      Continue
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar: Top Courses & Quick Actions */}
          <div className="space-y-6">
            <div className="glass rounded-2xl border border-white/5 p-6">
              <h3 className="font-bold font-outfit mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" /> Trending Now
              </h3>
              {topCourses.length === 0 ? (
                <p className="text-muted-foreground text-sm">No data available yet.</p>
              ) : (
                <div className="space-y-4">
                  {topCourses.slice(0, 5).map((c, i) => (
                    <Link key={c.course_id || i} href={`/courses/${c.course_id}`} className="flex items-center gap-4 group">
                      <span className="text-2xl font-bold text-white/10 font-outfit w-7 group-hover:text-indigo-500/30 transition-colors">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate group-hover:text-indigo-400 transition-colors">
                          {c.course_name || c.title || `Course ${c.course_id?.slice(0, 5)}...`}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                           <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                              <Eye className="w-2 h-2" /> {c.total_views || 0} views
                           </span>
                           <span className="text-[10px] text-emerald-500 uppercase flex items-center gap-1">
                              <Users className="w-2 h-2" /> Hot
                           </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="glass rounded-2xl border border-indigo-500/20 bg-indigo-600/5 p-6">
              <Award className="w-8 h-8 text-indigo-400 mb-3" />
              <h3 className="font-bold font-outfit mb-2">Ask Your AI Tutor</h3>
              <p className="text-sm text-muted-foreground mb-4">Get instant explanations and personalized learning help.</p>
              <Link href="/ai-tutor" className={cn(buttonVariants(), 'w-full bg-indigo-600 hover:bg-indigo-700')}>
                Open AI Tutor
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
