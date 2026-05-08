'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/shared/Navbar';
import { courseApi, analyticsApi } from '@/lib/api';
import { Course, Lesson } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Users, 
  Star, 
  Play, 
  CheckCircle2, 
  Globe, 
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  FileText,
  Send,
  Loader2
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useAuth } from '@/components/shared/AuthProvider';

export default function CourseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const [courseRes, lessonsRes, feedbackRes] = await Promise.all([
          courseApi.get(`/courses/${id}`),
          courseApi.get(`/lessons/course/${id}`),
          courseApi.get(`/feedback/course/${id}`).catch(() => ({ data: [] })),
        ]);
        setCourse(courseRes.data);
        setLessons(lessonsRes.data.sort((a: any, b: any) => a.order_index - b.order_index));
        setFeedbacks(feedbackRes.data || []);
        
        // Record view
        analyticsApi.post('/events/view', { course_id: id });
      } catch (error) {
        console.error('Failed to fetch course:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCourse();
  }, [id]);

  const handleSubmitFeedback = async () => {
    if (!user) { toast.error('Please log in to leave a review.'); return; }
    setSubmittingFeedback(true);
    try {
      const res = await courseApi.post('/feedback/', {
        course_id: id,
        rating: myRating,
        comment: myComment,
      });
      setFeedbacks(prev => [res.data, ...prev]);
      setMyComment('');
      setMyRating(5);
      toast.success('Review submitted!');
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to submit review');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleEnroll = async () => {
    try {
      await courseApi.post('/enrollments/', { course_id: id });
      analyticsApi.post('/events/enroll', { course_id: id });
      toast.success('Successfully enrolled!');
      if (lessons.length > 0) {
        router.push(`/lessons/${lessons[0].id}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to enroll. Please login first.');
    }
  };

  if (loading) return <CourseSkeleton />;
  if (!course) return <div>Course not found</div>;

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden border-b border-white/5">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent -z-10" />
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex gap-2 mb-6">
              <Badge className="bg-indigo-600/20 text-indigo-400 border-indigo-500/30 uppercase tracking-wider px-3">
                {course.category}
              </Badge>
              <Badge variant="outline" className="border-white/10 text-muted-foreground uppercase tracking-wider px-3">
                {course.level}
              </Badge>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold font-outfit mb-6 leading-tight">
              {course.title}
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-xl">
              {course.short_description}
            </p>
            
            <div className="flex flex-wrap gap-6 mb-10">
              <div className="flex items-center gap-2">
                <div className="flex text-yellow-500">
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <span className="font-bold text-lg">4.8</span>
                <span className="text-muted-foreground text-sm">(2,450 reviews)</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span className="font-bold">{course.enrollment_count || 12000}+ students</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-400" />
                <span className="text-muted-foreground">English, Spanish</span>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 inline-flex">
              <div className="w-12 h-12 rounded-full bg-zinc-800" />
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Instructor</p>
                <p className="font-bold">Dr. Sarah Johnson</p>
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-32 h-fit">
            <Card className="glass border-white/20 p-2 overflow-hidden shadow-2xl">
               <div className="aspect-video relative rounded-xl overflow-hidden mb-6">
                 <img src={course.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80'} alt="" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Button variant="ghost" size="icon" className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/40">
                      <Play className="w-8 h-8 text-white fill-current" />
                    </Button>
                 </div>
               </div>
               <div className="p-6 pt-0">
                  <div className="flex items-baseline gap-3 mb-6">
                    <span className="text-4xl font-bold font-outfit">${course.price}</span>
                    <span className="text-xl text-muted-foreground line-through">$199.99</span>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-none">85% OFF</Badge>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                     <Button className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-lg font-bold shadow-xl shadow-indigo-500/20" onClick={handleEnroll}>
                       Enroll Now
                     </Button>
                     <Button variant="outline" className="w-full h-14 border-white/10 text-lg font-bold">
                       Add to Wishlist
                     </Button>
                  </div>

                  <div className="space-y-3">
                    <p className="font-bold mb-4">This course includes:</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 text-indigo-400" /> {course.duration_hours} hours on-demand video
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400" /> {lessons.length} downloadable resources
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <MessageSquare className="w-4 h-4 text-indigo-400" /> 24/7 AI Tutor Support
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" /> Full lifetime access
                    </div>
                  </div>
               </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Syllabus Section */}
      <section className="py-24 container mx-auto px-4 max-w-4xl">
        <h2 className="text-3xl font-bold font-outfit mb-12">Course Curriculum</h2>
        <div className="space-y-4">
          {lessons.map((lesson, idx) => (
            <div key={lesson.id} className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all flex items-center justify-between group">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-sm text-muted-foreground group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold">{lesson.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                       {lesson.content_type === 'video' ? <Play className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                       {lesson.duration_minutes} minutes
                    </p>
                  </div>
               </div>
               {lesson.is_preview && (
                 <Button variant="ghost" className="text-indigo-400 gap-2">
                    Preview <ChevronRight className="w-4 h-4" />
                 </Button>
               )}
            </div>
          ))}
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-16 container mx-auto px-4 max-w-4xl">
        <h2 className="text-3xl font-bold font-outfit mb-10">Student Reviews</h2>

        {/* Submit Review */}
        {user ? (
          <div className="glass rounded-3xl border border-white/5 p-8 mb-10">
            <h3 className="font-bold font-outfit text-lg mb-6">Leave a Review</h3>
            {/* Star Picker */}
            <div className="flex items-center gap-2 mb-6">
              <span className="text-sm font-medium text-muted-foreground mr-2">Your Rating:</span>
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setMyRating(s)}
                  className={`transition-transform hover:scale-110 ${s <= myRating ? 'text-yellow-400' : 'text-white/20'}`}>
                  <Star className="w-7 h-7 fill-current" />
                </button>
              ))}
              <span className="ml-2 text-lg font-bold">{myRating}/5</span>
            </div>
            <textarea
              value={myComment}
              onChange={e => setMyComment(e.target.value)}
              placeholder="Share your experience with this course..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 mb-4"
            />
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 gap-2"
              disabled={submittingFeedback || !myComment.trim()}
              onClick={handleSubmitFeedback}
            >
              {submittingFeedback ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4" /> Submit Review</>}
            </Button>
          </div>
        ) : (
          <div className="glass rounded-2xl border border-white/5 p-6 mb-10 flex items-center justify-between">
            <p className="text-muted-foreground text-sm">Sign in to leave a review</p>
            <Button variant="outline" className="border-indigo-500/30 text-indigo-400" onClick={() => router.push('/login')}>
              Sign In
            </Button>
          </div>
        )}

        {/* Reviews List */}
        {feedbacks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No reviews yet. Be the first to review this course!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {feedbacks.map((fb: any) => (
              <div key={fb.id} className="glass rounded-2xl border border-white/5 p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center border border-indigo-500/20 font-bold text-indigo-400 text-sm">
                      {(fb.user_id || 'A').toString().charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">Anonymous Learner</p>
                      <p className="text-[11px] text-muted-foreground">{fb.created_at ? new Date(fb.created_at).toLocaleDateString() : 'Recently'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= fb.rating ? 'text-yellow-400 fill-current' : 'text-white/20'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{fb.comment}</p>
                {fb.ai_summary && (
                  <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                    <p className="text-[11px] font-bold text-indigo-400 mb-1">✨ AI Summary</p>
                    <p className="text-xs text-indigo-300">{fb.ai_summary}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function CourseSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-24 grid lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
          <div className="flex gap-4">
             <Skeleton className="h-10 w-32" />
             <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <Skeleton className="h-[600px] w-full rounded-3xl" />
      </div>
    </div>
  );
}

