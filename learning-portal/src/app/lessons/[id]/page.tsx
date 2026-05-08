'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/shared/Navbar';
import { courseApi, analyticsApi } from '@/lib/api';
import { Lesson, Course } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  PlayCircle, 
  FileText, 
  CheckCircle, 
  BrainCircuit,
  MessageCircle,
  X
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

export default function LessonPlayerPage() {
  const { id } = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [syllabus, setSyllabus] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAiChat, setShowAiChat] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch lesson details
        const lessonRes = await courseApi.get(`/lessons/${id}`);
        const lessonData = lessonRes.data;
        setLesson(lessonData);

        // Fetch course and syllabus
        const [courseRes, syllabusRes] = await Promise.all([
          courseApi.get(`/courses/${lessonData.course_id}`),
          courseApi.get(`/lessons/course/${lessonData.course_id}`)
        ]);
        
        setCourse(courseRes.data);
        setSyllabus(syllabusRes.data.sort((a: any, b: any) => a.order_index - b.order_index));

        // Record view event
        analyticsApi.post('/events/view', { course_id: lessonData.course_id });
      } catch (error) {
        console.error('Failed to fetch lesson data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <div className="w-80 border-r border-white/5 p-4 hidden md:block">
            <Skeleton className="h-8 w-1/2 mb-6" />
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full mb-2" />
            ))}
          </div>
          <div className="flex-1 p-8">
            <Skeleton className="h-9 w-1/4 mb-4" />
            <Skeleton className="aspect-video w-full rounded-2xl mb-6" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!lesson || !course) return <div>Lesson not found</div>;

  const currentIdx = syllabus.findIndex(l => l.id === lesson.id);
  const prevLesson = currentIdx > 0 ? syllabus[currentIdx - 1] : null;
  const nextLesson = currentIdx < syllabus.length - 1 ? syllabus[currentIdx + 1] : null;

  return (
    <div className="min-h-screen bg-background flex flex-col h-screen overflow-hidden">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Syllabus */}
        <aside className="w-80 border-r border-white/5 bg-black/20 hidden md:flex flex-col">
          <div className="p-6 border-b border-white/5">
            <h2 className="font-bold font-outfit text-lg line-clamp-1">{course.title}</h2>
            <p className="text-xs text-muted-foreground mt-1">Course Progress: 45%</p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {syllabus.map((l, idx) => (
                <button
                  key={l.id}
                  onClick={() => router.push(`/lessons/${l.id}`)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                    l.id === lesson.id 
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' 
                      : 'hover:bg-white/5 text-muted-foreground'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {l.content_type === 'video' ? <PlayCircle className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{idx + 1}. {l.title}</p>
                    <p className="text-[10px] opacity-60">{l.duration_minutes}m</p>
                  </div>
                  {idx < currentIdx && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-black/40 relative">
          <div className="max-w-5xl mx-auto p-4 md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <Badge variant="outline" className="mb-2 text-indigo-400 border-indigo-500/30">
                  {lesson.content_type.toUpperCase()}
                </Badge>
                <h1 className="text-3xl font-bold font-outfit">{lesson.title}</h1>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-white/10"
                  disabled={!prevLesson}
                  onClick={() => router.push(`/lessons/${prevLesson?.id}`)}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-white/10"
                  disabled={!nextLesson}
                  onClick={() => router.push(`/lessons/${nextLesson?.id}`)}
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>

            {/* Video Player / Content */}
            <div className="rounded-3xl overflow-hidden border border-white/10 bg-black aspect-video mb-8 shadow-2xl">
              {lesson.content_type === 'video' ? (
                <div className="w-full h-full flex items-center justify-center relative group">
                  {lesson.content_url ? (
                    <iframe 
                      src={lesson.content_url} 
                      className="w-full h-full"
                      allowFullScreen
                    />
                  ) : (
                    <div className="text-center">
                      <PlayCircle className="w-20 h-20 text-indigo-500 mb-4 mx-auto" />
                      <p className="text-muted-foreground font-medium">Video player placeholder</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full p-12 bg-zinc-900 overflow-y-auto">
                   <div className="prose prose-invert max-w-none">
                     <p className="text-xl leading-relaxed text-zinc-300">
                       {lesson.description || "This lesson contains text-based content. Read through the material below to complete the lesson."}
                     </p>
                     {/* Add more markdown/HTML rendering logic here if needed */}
                   </div>
                </div>
              )}
            </div>

            {/* Lesson Footer */}
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-4">About this lesson</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {lesson.description || "No description provided for this lesson."}
                </p>
              </div>
              <div className="w-full md:w-72 space-y-4">
                <Button 
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 gap-2"
                  onClick={() => {}}
                >
                  <CheckCircle className="w-5 h-5" /> Mark as Complete
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full h-12 border-white/10 gap-2"
                  onClick={() => setShowAiChat(true)}
                >
                  <BrainCircuit className="w-5 h-5 text-indigo-400" /> Ask AI Tutor
                </Button>
              </div>
            </div>
          </div>

          {/* AI Chat Drawer Overlay */}
          <AnimatePresence>
            {showAiChat && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowAiChat(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40"
                />
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-zinc-900 border-l border-white/10 z-50 flex flex-col shadow-2xl"
                >
                  <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30">
                        <BrainCircuit className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="font-bold font-outfit">AI Study Tutor</h3>
                        <p className="text-xs text-emerald-500 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Online • Ready to help
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setShowAiChat(false)}>
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  <div className="flex-1 p-6 overflow-y-auto">
                    <div className="bg-white/5 rounded-2xl p-4 mb-4 text-sm">
                      Hello! I'm your AI tutor. I can explain complex concepts from this lesson, summarize key points, or help you with any questions. What's on your mind?
                    </div>
                  </div>

                  <div className="p-6 border-t border-white/5">
                    <div className="flex gap-2">
                      <Input placeholder="Ask anything about this lesson..." className="bg-white/5 border-white/10" />
                      <Button size="icon" className="bg-indigo-600 hover:bg-indigo-700">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </main>
      </div>
      
      {/* Floating AI Button (Mobile) */}
      <Button 
        size="icon" 
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-indigo-600 shadow-2xl md:hidden z-30"
        onClick={() => setShowAiChat(true)}
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    </div>
  );
}
