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
import { cn, getMediaUrl } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  BookOpen, Plus, Edit2, Trash2, Eye, Users, BarChart2,
  Loader2, X, CheckCircle2, Globe, Lock, Upload, Sparkles, TrendingUp,
  PlayCircle
} from 'lucide-react';

const courseFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description is required'),
  short_description: z.string().optional(),
  price: z.number().min(0),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  duration_hours: z.number().min(0),
  published: z.boolean(),
  is_featured: z.boolean().optional(),
});

const lessonFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  content_type: z.enum(['video', 'text', 'pdf', 'quiz', 'audio', 'image']),
  duration_minutes: z.number().min(0),
  order_index: z.number().min(0),
  is_preview: z.boolean(),
  is_published: z.boolean(),
  content_url: z.string().optional(),
});

type CourseFormData = z.infer<typeof courseFormSchema>;
type LessonFormData = z.infer<typeof lessonFormSchema>;

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
  const [selectedCourseSummary, setSelectedCourseSummary] = useState<any | null>(null);
  const [filterDate, setFilterDate] = useState<string>('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  // Course Enrollment states
  const [showCourseEnrollments, setShowCourseEnrollments] = useState(false);
  const [selectedCourseEnrollments, setSelectedCourseEnrollments] = useState<any[]>([]);
  const [loadingCourseEnrollments, setLoadingCourseEnrollments] = useState(false);
  const [activeEnrollmentCourse, setActiveEnrollmentCourse] = useState<Course | null>(null);

  // Stats data
  const [instructorEnrollments, setInstructorEnrollments] = useState<any[]>([]);
  const [totalEnrollmentsCount, setTotalEnrollmentsCount] = useState(0);

  // Lesson states
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [activeCourseForLessons, setActiveCourseForLessons] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [lessonSaving, setLessonSaving] = useState(false);
  const [lessonFile, setLessonFile] = useState<File | null>(null);

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: { 
      price: 0, 
      level: 'beginner', 
      published: false, 
      is_featured: false,
      duration_hours: 0,
      subcategory: ''
    },
  });

  const lessonForm = useForm<LessonFormData>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: {
      content_type: 'video',
      duration_minutes: 0,
      order_index: 0,
      is_preview: false,
      is_published: true,
      title: '',
      description: '',
      content_url: ''
    }
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
    fetchEnrollmentStats();
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

  const fetchEnrollmentStats = async () => {
    try {
      const res = await courseApi.get('/enrollments/instructor');
      const enrolls = res.data.enrolls || [];
      setInstructorEnrollments(enrolls);
      
      // Calculate total enrollments (sum of items in each course group)
      const total = enrolls.reduce((sum: number, group: any) => sum + group.items.length, 0);
      setTotalEnrollmentsCount(total);
    } catch {
      console.warn('Could not fetch enrollment stats');
    }
  };

  const openCreate = () => {
    setEditingCourse(null);
    setThumbnailFile(null);
    form.reset({ 
      price: 0, 
      level: 'beginner', 
      published: false, 
      is_featured: false,
      duration_hours: 0, 
      title: '', 
      description: '', 
      short_description: '', 
      category: '',
      subcategory: ''
    });
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
      subcategory: (course as any).subcategory || '',
      level: (course.level as any) || 'beginner',
      duration_hours: course.duration_hours || 0,
      published: course.published || false,
      is_featured: (course as any).is_featured || false,
    });
    setShowModal(true);
  };

  const onSubmit = async (data: CourseFormData) => {
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          formData.append(k, String(v));
        }
      });
      
      if (thumbnailFile) {
        formData.append('thumbnail_file', thumbnailFile);
      }

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

  const fetchCourseMetrics = async (course: Course, dateFilter?: string) => {
    setActiveMetricCourse(course);
    setShowMetricsModal(true);
    setLoadingMetrics(true);
    if (!dateFilter) setFilterDate(''); // Reset filter if opening new course
    
    try {
      const summaryRes = await analyticsApi.get(`/metrics/course/${course.id}/summary`);
      setSelectedCourseSummary(summaryRes.data);

      const metricsUrl = dateFilter 
        ? `/metrics/course/${course.id}?date=${dateFilter}`
        : `/metrics/course/${course.id}`;
        
      const res = await analyticsApi.get(metricsUrl);
      setSelectedCourseMetrics(res.data || []);
    } catch (error) {
      toast.error('Failed to load metrics');
      setSelectedCourseMetrics([]);
      setSelectedCourseSummary(null);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const fetchCourseEnrollments = async (course: Course) => {
    setActiveEnrollmentCourse(course);
    setShowCourseEnrollments(true);
    setLoadingCourseEnrollments(true);
    try {
      const res = await courseApi.get(`/enrollments/course/${course.id}/enrollments`);
      setSelectedCourseEnrollments(res.data.items || []);
    } catch {
      toast.error('Failed to load course enrollments');
    } finally {
      setLoadingCourseEnrollments(false);
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

  // Lesson Functions
  const openLessonsManager = async (course: Course) => {
    setActiveCourseForLessons(course);
    setShowLessonModal(true);
    fetchLessons(course.id);
  };

  const fetchLessons = async (courseId: string) => {
    setLoadingLessons(true);
    try {
      const res = await courseApi.get(`/lessons/course/${courseId}`);
      setLessons(res.data.items || res.data || []);
    } catch {
      toast.error('Failed to load lessons');
    } finally {
      setLoadingLessons(false);
    }
  };

  const openCreateLesson = () => {
    setEditingLesson(null);
    setLessonFile(null);
    lessonForm.reset({
      title: '',
      description: '',
      content_type: 'video',
      duration_minutes: 0,
      order_index: lessons.length,
      is_preview: false,
      is_published: true,
      content_url: ''
    });
    setShowLessonForm(true);
  };

  const openEditLesson = (lesson: any) => {
    setEditingLesson(lesson);
    setLessonFile(null);
    lessonForm.reset({
      title: lesson.title,
      description: lesson.description || '',
      content_type: lesson.content_type,
      duration_minutes: lesson.duration_minutes || 0,
      order_index: lesson.order_index || 0,
      is_preview: lesson.is_preview || false,
      is_published: lesson.is_published !== false,
      content_url: lesson.content_url || ''
    });
    setShowLessonForm(true);
  };

  const onSubmitLesson = async (data: LessonFormData) => {
    if (!activeCourseForLessons) return;
    setLessonSaving(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          formData.append(k, String(v));
        }
      });
      formData.append('course_id', activeCourseForLessons.id);
      if (lessonFile) {
        formData.append('content_file', lessonFile);
      }

      if (editingLesson) {
        await courseApi.put(`/lessons/${editingLesson.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Lesson updated!');
      } else {
        await courseApi.post('/lessons/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Lesson created!');
      }
      setShowLessonForm(false);
      fetchLessons(activeCourseForLessons.id);
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Lesson operation failed');
    } finally {
      setLessonSaving(false);
    }
  };

  const deleteLesson = async (lessonId: string) => {
    if (!confirm('Delete this lesson?')) return;
    try {
      await courseApi.delete(`/lessons/${lessonId}`);
      toast.success('Lesson deleted');
      if (activeCourseForLessons) fetchLessons(activeCourseForLessons.id);
    } catch {
      toast.error('Failed to delete lesson');
    }
  };

  const publishedCount = courses.filter(c => c.published).length;
  
  // Count unique student IDs across all courses to avoid double counting
  const uniqueStudentCount = Array.from(new Set(
    instructorEnrollments.flatMap(group => group.items.map((s: any) => s.user_id))
  )).length;

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
            { label: 'Total Students', value: uniqueStudentCount, icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { label: 'Total Enrollments', value: totalEnrollmentsCount, icon: TrendingUp, color: 'text-orange-400', bg: 'bg-orange-500/10' },
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
                  <img src={getMediaUrl(course.thumbnail_url, 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&q=80')}
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
                  <Button variant="ghost" size="sm" onClick={() => openLessonsManager(course)} className="text-emerald-400 hover:text-emerald-300">
                    <PlayCircle className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => fetchCourseEnrollments(course)} className="text-purple-400 hover:text-purple-300">
                    <Users className="w-4 h-4" />
                  </Button>
                  <Link href={`/courses/${course.id}`}
                    className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-muted-foreground hover:text-white')}>
                    <Eye className="w-4 h-4" />
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => fetchCourseMetrics(course)} className="text-indigo-400 hover:text-indigo-300">
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
                         <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">All-Time Views</p>
                            <p className="text-2xl font-bold font-outfit">{selectedCourseSummary?.total_views || 0}</p>
                         </div>
                         <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">All-Time Enrolls</p>
                            <p className="text-2xl font-bold font-outfit text-emerald-400">{selectedCourseSummary?.total_enrollments || 0}</p>
                         </div>
                      </div>

                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Daily Activity</h4>
                        <div className="flex items-center gap-2">
                           <Input 
                             type="date" 
                             value={filterDate} 
                             onChange={(e) => {
                               setFilterDate(e.target.value);
                               if (activeMetricCourse) fetchCourseMetrics(activeMetricCourse, e.target.value);
                             }}
                             className="h-8 bg-white/5 border-white/10 text-xs w-36"
                           />
                           {filterDate && (
                             <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-indigo-400" 
                               onClick={() => {
                                 setFilterDate('');
                                 if (activeMetricCourse) fetchCourseMetrics(activeMetricCourse);
                               }}>
                               Clear
                             </Button>
                           )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {selectedCourseMetrics.map((m, i) => (
                           <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                              <div className="font-medium text-sm">{m.metric_date}</div>
                              <div className="flex items-center gap-6">
                                 <div className="text-right">
                                    <p className="text-[10px] text-muted-foreground uppercase">Views</p>
                                    <p className="font-bold">{m.views_count || 0}</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[10px] text-muted-foreground uppercase">Enrolls</p>
                                    <p className="font-bold text-indigo-400">{m.enrollments_count || 0}</p>
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
                      <label className="text-sm font-medium">Subcategory</label>
                      <Input {...form.register('subcategory')} placeholder="e.g. Web Development" className="bg-white/5 border-white/10 h-11" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                      <input {...form.register('published')} type="checkbox" id="published" className="w-4 h-4 accent-indigo-500" />
                      <label htmlFor="published" className="text-sm font-medium cursor-pointer">
                        Published
                      </label>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                      <input {...form.register('is_featured')} type="checkbox" id="is_featured" className="w-4 h-4 accent-amber-500" />
                      <label htmlFor="is_featured" className="text-sm font-medium cursor-pointer">
                        Featured Course
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Upload className="w-4 h-4 text-indigo-400" /> Course Thumbnail
                    </label>
                    <div className={cn(
                      "border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-indigo-500/50 transition-colors cursor-pointer bg-white/5",
                      thumbnailFile && "border-indigo-500/50 bg-indigo-500/5"
                    )} onClick={() => document.getElementById('thumbnail-upload')?.click()}>
                      {thumbnailFile ? (
                        <div className="flex flex-col items-center">
                          <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                          <p className="text-sm font-medium">{thumbnailFile.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">Click to change file</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-3">
                            <Upload className="w-6 h-6 text-indigo-400" />
                          </div>
                          <p className="text-sm font-medium">Click to upload or drag and drop</p>
                          <p className="text-xs text-muted-foreground mt-1">SVG, PNG, JPG or GIF (max. 800x400px)</p>
                        </div>
                      )}
                      <input 
                        type="file" 
                        id="thumbnail-upload" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setThumbnailFile(file);
                        }}
                      />
                    </div>
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
      
      {/* Lesson Management Modal */}
      <AnimatePresence>
        {showLessonModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={() => setShowLessonModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 25 }}
              className="fixed inset-x-4 top-[10%] bottom-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[700px] bg-zinc-900 border border-white/10 rounded-3xl z-50 flex flex-col overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <BookOpen className="w-5 h-5 text-emerald-400" />
                   </div>
                   <div>
                     <h2 className="text-xl font-bold font-outfit">Curriculum Management</h2>
                     <p className="text-xs text-muted-foreground">{activeCourseForLessons?.title}</p>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={openCreateLesson} className="bg-indigo-600 h-9 px-4 text-xs gap-2">
                    <Plus className="w-3 h-3" /> Add Lesson
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setShowLessonModal(false)}><X className="w-5 h-5" /></Button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 bg-black/20">
                {loadingLessons ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading curriculum...</p>
                  </div>
                ) : lessons.length === 0 ? (
                  <div className="py-20 text-center opacity-40">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                      <PlayCircle className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold mb-1">Your curriculum is empty</h3>
                    <p className="text-sm">Start adding lessons to your course.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lessons.sort((a: any, b: any) => a.order_index - b.order_index).map((lesson, i) => (
                      <div key={lesson.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-muted-foreground">
                          {lesson.order_index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm truncate">{lesson.title}</h4>
                            <Badge variant="outline" className="text-[10px] uppercase border-white/10 py-0 h-4">
                              {lesson.content_type}
                            </Badge>
                            {!lesson.is_published && <Badge className="bg-yellow-500/10 text-yellow-500 border-none text-[9px] h-4">Draft</Badge>}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{lesson.description || 'No description'}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-400" onClick={() => openEditLesson(lesson)}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => deleteLesson(lesson.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-white/5 flex justify-end">
                <Button variant="outline" size="sm" className="border-white/10" onClick={() => setShowLessonModal(false)}>Done</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Course Enrollments Modal */}
      <AnimatePresence>
        {showCourseEnrollments && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={() => setShowCourseEnrollments(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 25 }}
              className="fixed inset-x-4 top-[10%] bottom-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[600px] bg-zinc-900 border border-white/10 rounded-3xl z-50 flex flex-col overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                      <Users className="w-5 h-5 text-purple-400" />
                   </div>
                   <div>
                     <h2 className="text-xl font-bold font-outfit">Course Enrollments</h2>
                     <p className="text-xs text-muted-foreground">{activeEnrollmentCourse?.title}</p>
                   </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowCourseEnrollments(false)}><X className="w-5 h-5" /></Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 bg-black/20">
                {loadingCourseEnrollments ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading enrollments...</p>
                  </div>
                ) : selectedCourseEnrollments.length === 0 ? (
                  <div className="py-20 text-center opacity-40">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                      <Users className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold mb-1">No students enrolled yet</h3>
                    <p className="text-sm">When students enroll, they will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedCourseEnrollments.map((enroll, i) => (
                      <div key={enroll.enrollment_id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-indigo-400 text-sm border border-white/5">
                          {enroll.user_id.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                             <p className="text-sm font-bold truncate">Student ID: {enroll.user_id.slice(0, 8)}...</p>
                             {enroll.completed && <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[10px]">Completed</Badge>}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5">
                            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className={cn("h-full", enroll.completed ? "bg-emerald-500" : "bg-indigo-500")} style={{ width: `${enroll.progress_percentage || 0}%` }} />
                            </div>
                            <span className="text-[10px] text-muted-foreground">{Math.round(enroll.progress_percentage || 0)}%</span>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                             <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">Time: {enroll.total_time_spent_minutes || 0}m</span>
                             <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">Joined: {new Date(enroll.enrolled_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-white/5 flex justify-end">
                <Button variant="outline" size="sm" className="border-white/10" onClick={() => setShowCourseEnrollments(false)}>Close</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Lesson Form Modal */}
      <AnimatePresence>
        {showLessonForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]" onClick={() => setShowLessonForm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 25 }}
              className="fixed inset-x-4 top-[5%] bottom-[5%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[600px] bg-zinc-900 border border-white/10 rounded-3xl z-[70] flex flex-col overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-bold font-outfit">{editingLesson ? 'Edit Lesson' : 'Create New Lesson'}</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowLessonForm(false)}><X className="w-5 h-5" /></Button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <form id="lesson-form" onSubmit={lessonForm.handleSubmit(onSubmitLesson)} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Lesson Title *</label>
                    <Input {...lessonForm.register('title')} placeholder="e.g. Introduction to React Hooks" className="bg-white/5 border-white/10 h-11" />
                    {lessonForm.formState.errors.title && <p className="text-xs text-destructive">{lessonForm.formState.errors.title.message}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea {...lessonForm.register('description')} rows={3}
                      placeholder="What will students learn in this lesson?"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Content Type *</label>
                      <select {...lessonForm.register('content_type')}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 h-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                        <option value="video">Video</option>
                        <option value="text">Text / Article</option>
                        <option value="pdf">PDF Document</option>
                        <option value="quiz">Quiz</option>
                        <option value="audio">Audio</option>
                        <option value="image">Image</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Order Index</label>
                      <Input {...lessonForm.register('order_index', { valueAsNumber: true })} type="number" min="0" className="bg-white/5 border-white/10 h-11" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Duration (minutes)</label>
                      <Input {...lessonForm.register('duration_minutes', { valueAsNumber: true })} type="number" min="0" className="bg-white/5 border-white/10 h-11" />
                    </div>
                    <div className="flex items-center gap-3 h-11 mt-7">
                      <input {...lessonForm.register('is_preview')} type="checkbox" id="is_preview" className="w-4 h-4 accent-indigo-500" />
                      <label htmlFor="is_preview" className="text-sm font-medium cursor-pointer">Preview Lesson</label>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Lesson Content</label>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">File or URL</span>
                    </div>
                    
                    <div className={cn(
                      "border-2 border-dashed border-white/10 rounded-2xl p-6 text-center hover:border-indigo-500/50 transition-colors cursor-pointer bg-white/5",
                      lessonFile && "border-indigo-500/50 bg-indigo-500/5"
                    )} onClick={() => document.getElementById('lesson-file-upload')?.click()}>
                      {lessonFile ? (
                        <div className="flex flex-col items-center">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                          <p className="text-sm font-medium">{lessonFile.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">File selected</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="w-6 h-6 text-indigo-400 mb-2" />
                          <p className="text-sm font-medium">Upload File</p>
                          <p className="text-[10px] text-muted-foreground">Video, PDF, or Audio file</p>
                        </div>
                      )}
                      <input 
                        type="file" 
                        id="lesson-file-upload" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setLessonFile(file);
                        }}
                      />
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5" /></div>
                      <div className="relative flex justify-center text-xs uppercase"><span className="bg-zinc-900 px-2 text-muted-foreground">Or Use URL</span></div>
                    </div>

                    <Input {...lessonForm.register('content_url')} placeholder="https://youtube.com/watch?v=..." className="bg-white/5 border-white/10 h-11" />
                  </div>
                </form>
              </div>
              <div className="p-6 border-t border-white/5 flex justify-end gap-3 flex-shrink-0">
                <Button variant="outline" className="border-white/10" onClick={() => setShowLessonForm(false)}>Cancel</Button>
                <Button form="lesson-form" type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={lessonSaving}>
                  {lessonSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : editingLesson ? 'Update Lesson' : 'Add Lesson'}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
