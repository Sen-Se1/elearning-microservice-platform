'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/shared/Navbar';
import { useAuth } from '@/components/shared/AuthProvider';
import { courseApi, analyticsApi } from '@/lib/api';
import { Course } from '@/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  BookOpen, Plus, Edit2, Trash2, Eye, Users, BarChart2,
  Loader2, X, CheckCircle2, Globe, Lock, Upload, Sparkles, TrendingUp
} from 'lucide-react';

const courseFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description is required'),
  short_description: z.string().optional(),
  price: z.number().min(0),
  category: z.string().min(1, 'Category is required'),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  duration_hours: z.number().min(0),
  published: z.boolean(),
});
type CourseFormData = z.infer<typeof courseFormSchema>;

const CATEGORIES = ['Development', 'Design', 'Business', 'Marketing', 'Photography', 'Music', 'Data Science', 'IT & Software'];

export default function InstructorPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [selectedCourseMetrics, setSelectedCourseMetrics] = useState<any[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [activeMetricCourse, setActiveMetricCourse] = useState<Course | null>(null);

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: { price: 0, level: 'beginner', published: false, duration_hours: 0 },
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'instructor') {
      router.push('/dashboard');
      return;
    }
    fetchMyCourses();
  }, [user, authLoading, router]);

  if (authLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );

  if (!user || user.role !== 'instructor') return null;

  const fetchMyCourses = async () => {
    setLoading(true);
    try {
      const res = await courseApi.get('/courses/instructor/mine');
      const data = res.data.items || (Array.isArray(res.data) ? res.data : []);
      setCourses(data);
    } catch {
      // fallback: fetch all and note
      console.warn('Could not fetch instructor courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingCourse(null);
    form.reset({ price: 0, level: 'beginner', published: false, duration_hours: 0, title: '', description: '', short_description: '', category: '', });
    setShowModal(true);
  };

  const openEdit = (course: Course) => {
    setEditingCourse(course);
    form.reset({
      title: course.title,
      description: course.description || '',
      short_description: course.short_description || '',
      price: course.price || 0,
      category: course.category || '',
      level: (course.level as any) || 'beginner',
      duration_hours: course.duration_hours || 0,
      published: course.published || false,
    });
    setShowModal(true);
  };

  const onSubmit = async (data: CourseFormData) => {
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => formData.append(k, String(v)));

      if (editingCourse) {
        await courseApi.put(`/courses/${editingCourse.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Course updated!');
      } else {
        await courseApi.post('/courses/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Course created!');
      }
      setShowModal(false);
      fetchMyCourses();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const fetchCourseMetrics = async (course: Course) => {
    setActiveMetricCourse(course);
    setShowMetricsModal(true);
    setLoadingMetrics(true);
    try {
      const res = await analyticsApi.get(`/metrics/course/${course.id}`);
      setSelectedCourseMetrics(res.data || []);
    } catch (error) {
      toast.error('Failed to load metrics');
      setSelectedCourseMetrics([]);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const deleteCourse = async (id: string) => {
    if (!confirm('Delete this course and all its lessons? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await courseApi.delete(`/courses/${id}`);
      toast.success('Course deleted');
      setCourses(prev => prev.filter(c => c.id !== id));
    } catch {
      toast.error('Failed to delete course');
    } finally {
      setDeletingId(null);
    }
  };

  const publishedCount = courses.filter(c => c.published).length;
  const totalStudents = courses.reduce((s, c) => s + (c.enrollment_count || 0), 0);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="border-b border-white/5 bg-black/20 py-10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 mb-2 text-sm font-medium">
              <Sparkles className="w-4 h-4" /> Instructor Studio
            </div>
            <h1 className="text-4xl font-bold font-outfit">My Courses</h1>
            <p className="text-muted-foreground mt-1">Create, manage and publish your courses.</p>
          </div>
          <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 h-11 gap-2 shadow-lg shadow-indigo-500/20">
            <Plus className="w-4 h-4" /> New Course
          </Button>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total Courses', value: courses.length, icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
            { label: 'Published', value: publishedCount, icon: Globe, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Drafts', value: courses.length - publishedCount, icon: Lock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
            { label: 'Total Students', value: totalStudents, icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-6 border border-white/5">
              <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center mb-4', s.bg)}>
                <s.icon className={cn('w-5 h-5', s.color)} />
              </div>
              <div className="text-3xl font-bold font-outfit mb-1">{loading ? '—' : s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Courses Table */}
        {loading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
        ) : courses.length === 0 ? (
          <div className="glass rounded-3xl border border-white/5 p-16 text-center">
            <BookOpen className="w-16 h-16 text-indigo-400 mx-auto mb-4 opacity-40" />
            <h3 className="text-2xl font-bold font-outfit mb-2">No courses yet</h3>
            <p className="text-muted-foreground mb-8">Create your first course and start sharing your knowledge.</p>
            <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" /> Create First Course
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map((course, i) => (
              <motion.div key={course.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass rounded-2xl border border-white/5 p-6 flex flex-col md:flex-row md:items-center gap-4 group hover:border-indigo-500/20 transition-all">
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-800">
                  <img src={course.thumbnail_url || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&q=80`}
                    alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold truncate">{course.title}</h3>
                    <Badge className={course.published ? 'bg-emerald-500/20 text-emerald-400 border-none' : 'bg-yellow-500/20 text-yellow-400 border-none'}>
                      {course.published ? 'Published' : 'Draft'}
                    </Badge>
                    {course.category && <Badge variant="outline" className="border-white/10 text-xs">{course.category}</Badge>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {course.enrollment_count || 0} students</span>
                    <span className="flex items-center gap-1"><BarChart2 className="w-3 h-3" /> {course.level}</span>
                    <span className="font-bold text-white">${course.price || 0}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href={`/courses/${course.id}`}
                    className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-muted-foreground hover:text-white')}>
                    <Eye className="w-4 h-4" />
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => fetchCourseMetrics(course)} className="text-purple-400 hover:text-purple-300">
                    <BarChart2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(course)} className="text-indigo-400 hover:text-indigo-300">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteCourse(course.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    disabled={deletingId === course.id}>
                    {deletingId === course.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Metrics Modal */}
      <AnimatePresence>
        {showMetricsModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={() => setShowMetricsModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 25 }}
              className="fixed inset-x-4 top-[15%] bottom-[15%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[600px] bg-zinc-900 border border-white/10 rounded-3xl z-50 flex flex-col overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                      <BarChart2 className="w-5 h-5 text-purple-400" />
                   </div>
                   <div>
                     <h2 className="text-xl font-bold font-outfit">Course Performance</h2>
                     <p className="text-xs text-muted-foreground">{activeMetricCourse?.title}</p>
                   </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowMetricsModal(false)}><X className="w-5 h-5" /></Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {loadingMetrics ? (
                   <div className="py-20 flex flex-col items-center justify-center gap-4">
                      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                      <p className="text-sm text-muted-foreground">Loading performance data...</p>
                   </div>
                ) : selectedCourseMetrics.length === 0 ? (
                  <div className="py-20 text-center opacity-40">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4" />
                    <p>No activity recorded yet for this course.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                           <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Total Views</p>
                           <p className="text-2xl font-bold font-outfit">{selectedCourseMetrics.reduce((s, m) => s + (m.views || 0), 0)}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                           <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Total Enrollments</p>
                           <p className="text-2xl font-bold font-outfit text-indigo-400">{selectedCourseMetrics.reduce((s, m) => s + (m.enrollments || 0), 0)}</p>
                        </div>
                     </div>
                     
                     <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Daily Breakdown</h4>
                     <div className="space-y-2">
                        {selectedCourseMetrics.map((m, i) => (
                           <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                              <div className="font-medium text-sm">{m.date}</div>
                              <div className="flex items-center gap-6">
                                 <div className="text-right">
                                    <p className="text-[10px] text-muted-foreground uppercase">Views</p>
                                    <p className="font-bold">{m.views || 0}</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[10px] text-muted-foreground uppercase">Enrolls</p>
                                    <p className="font-bold text-indigo-400">{m.enrollments || 0}</p>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-white/5 flex justify-end">
                <Button className="bg-indigo-600" onClick={() => setShowMetricsModal(false)}>Close</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={() => setShowModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 25 }}
              className="fixed inset-x-4 top-[5%] bottom-[5%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[640px] bg-zinc-900 border border-white/10 rounded-3xl z-50 flex flex-col overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                <h2 className="text-xl font-bold font-outfit">{editingCourse ? 'Edit Course' : 'Create New Course'}</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}><X className="w-5 h-5" /></Button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <form id="course-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Course Title *</label>
                    <Input {...form.register('title')} placeholder="e.g. Complete Python Bootcamp" className="bg-white/5 border-white/10 h-11" />
                    {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Short Description</label>
                    <Input {...form.register('short_description')} placeholder="One-line summary" className="bg-white/5 border-white/10 h-11" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Description *</label>
                    <textarea {...form.register('description')} rows={4}
                      placeholder="Detailed course description..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                    {form.formState.errors.description && <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category *</label>
                      <select {...form.register('category')}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 h-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                        <option value="">Select...</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {form.formState.errors.category && <p className="text-xs text-destructive">{form.formState.errors.category.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Level</label>
                      <select {...form.register('level')}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 h-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Price ($)</label>
                      <Input {...form.register('price', { valueAsNumber: true })} type="number" min="0" step="0.01" className="bg-white/5 border-white/10 h-11" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Duration (hours)</label>
                      <Input {...form.register('duration_hours', { valueAsNumber: true })} type="number" min="0" className="bg-white/5 border-white/10 h-11" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                    <input {...form.register('published')} type="checkbox" id="published" className="w-4 h-4 accent-indigo-500" />
                    <label htmlFor="published" className="text-sm font-medium cursor-pointer">
                      Publish immediately (visible to all students)
                    </label>
                  </div>
                </form>
              </div>
              <div className="p-6 border-t border-white/5 flex-shrink-0 flex justify-end gap-3">
                <Button variant="outline" className="border-white/10" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button form="course-form" type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={saving}>
                  {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : editingCourse ? 'Save Changes' : 'Create Course'}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
