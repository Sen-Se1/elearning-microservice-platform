'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/shared/Navbar';
import { courseApi, analyticsApi, aiApi } from '@/lib/api';
import { Lesson, Course, ChatMessage } from '@/types';
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
  X,
  Send,
  Loader2,
  Award,
  Sparkles
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function LessonPlayerPage() {
  const { id: courseId, lessonId } = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [syllabus, setSyllabus] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAiChat, setShowAiChat] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  
  // AI Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hello! I'm your AI study tutor. I've analyzed this lesson and the course context. How can I help you understand the material better today?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleGenerateQuiz = async () => {
    setGeneratingQuiz(true);
    setShowQuiz(true);
    try {
      const res = await aiApi.post('/quiz', {
        course_id: courseId,
        lesson_id: lessonId,
        num_questions: 5
      });
      setQuizQuestions(res.data.questions || []);
      setCurrentQuestionIndex(0);
      setQuizScore(0);
      setQuizCompleted(false);
      setSelectedOption(null);
      setShowExplanation(false);
    } catch (error) {
      toast.error("Failed to generate quiz. AI might be busy.");
      setShowQuiz(false);
    } finally {
      setGeneratingQuiz(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch lesson details
        const lessonRes = await courseApi.get(`/lessons/${lessonId}`);
        const lessonData = lessonRes.data;
        setLesson(lessonData);

        // Fetch course and syllabus
        const [courseRes, syllabusRes] = await Promise.all([
          courseApi.get(`/courses/${courseId}`),
          courseApi.get(`/lessons/course/${courseId}`)
        ]);
        
        setCourse(courseRes.data);
        const lessonItems = syllabusRes.data.items || syllabusRes.data;
        setSyllabus(lessonItems.sort((a: any, b: any) => a.order_index - b.order_index));
      } catch (error) {
        console.error('Failed to fetch lesson data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (lessonId && courseId) fetchData();
  }, [lessonId, courseId]);

  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = { role: 'user', content: chatInput };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    try {
      const response = await aiApi.post('/chat', {
        messages: [...messages, userMsg],
        course_id: courseId,
        lesson_id: lessonId,
        stream: false
      });
      
      const aiMsg: ChatMessage = { 
        role: 'assistant', 
        content: response.data.content || response.data.response 
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      toast.error("Failed to get AI response. Please try again.");
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment." }]);
    } finally {
      setIsTyping(false);
    }
  };

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
            <div className="flex items-center justify-between mt-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Progress</p>
              <p className="text-[10px] text-indigo-400 font-bold">45%</p>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-indigo-500 w-[45%]" />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {syllabus.map((l, idx) => (
                <button
                  key={l.id}
                  onClick={() => router.push(`/courses/${courseId}/lessons/${l.id}`)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group ${
                    l.id === lesson.id 
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' 
                      : 'hover:bg-white/5 text-muted-foreground'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    l.id === lesson.id ? 'bg-indigo-600 text-white' : 'bg-white/5 group-hover:bg-white/10'
                  }`}>
                    {l.content_type === 'video' ? <PlayCircle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${l.id === lesson.id ? 'text-white' : ''}`}>
                      {idx + 1}. {l.title}
                    </p>
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
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                   <Badge variant="outline" className="text-indigo-400 border-indigo-500/30">
                    {lesson.content_type.toUpperCase()}
                  </Badge>
                  {lesson.is_preview && <Badge className="bg-emerald-500/20 text-emerald-400 border-none">Free Preview</Badge>}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold font-outfit">{lesson.title}</h1>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="border-white/10 h-11 px-6 rounded-xl hover:bg-white/5"
                  disabled={!prevLesson}
                  onClick={() => router.push(`/courses/${courseId}/lessons/${prevLesson?.id}`)}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                </Button>
                <Button 
                  variant="outline" 
                  className="border-white/10 h-11 px-6 rounded-xl hover:bg-white/5"
                  disabled={!nextLesson}
                  onClick={() => router.push(`/courses/${courseId}/lessons/${nextLesson?.id}`)}
                >
                  Next <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* Video Player / Content */}
            <div className="rounded-3xl overflow-hidden border border-white/10 bg-black aspect-video mb-8 shadow-2xl relative group">
              {lesson.content_type === 'video' ? (
                <div className="w-full h-full flex items-center justify-center">
                  {lesson.content_url ? (
                    <iframe 
                      src={lesson.content_url} 
                      className="w-full h-full"
                      allowFullScreen
                    />
                  ) : (
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-indigo-600/20 flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
                        <PlayCircle className="w-10 h-10 text-indigo-500" />
                      </div>
                      <p className="text-muted-foreground font-medium">Video content currently unavailable</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full p-12 bg-zinc-900/50 overflow-y-auto">
                   <div className="prose prose-invert max-w-none">
                     <p className="text-xl leading-relaxed text-zinc-300">
                       {lesson.description || "This lesson contains text-based content. Read through the material below to complete the lesson."}
                     </p>
                   </div>
                </div>
              )}
            </div>

            {/* Lesson Footer */}
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="glass rounded-3xl p-8 border-white/5">
                  <h3 className="text-xl font-bold font-outfit mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-400" /> Lesson Description
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {lesson.description || "No detailed description provided for this lesson."}
                  </p>
                  
                  <div className="mt-8 pt-8 border-t border-white/5 flex flex-wrap gap-4">
                     <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-xs text-muted-foreground">
                        <CheckCircle className="w-3 h-3 text-indigo-400" /> Resources Attached
                     </div>
                     <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-xs text-muted-foreground">
                        <BrainCircuit className="w-3 h-3 text-indigo-400" /> AI Support Available
                     </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <Button 
                  className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 gap-3 text-lg font-bold rounded-2xl shadow-xl shadow-indigo-500/20"
                  onClick={() => {
                    toast.success("Lesson marked as complete!");
                    if (nextLesson) router.push(`/courses/${courseId}/lessons/${nextLesson.id}`);
                  }}
                >
                  <CheckCircle className="w-5 h-5" /> Complete Lesson
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full h-14 border-white/10 gap-3 text-lg font-bold rounded-2xl hover:bg-white/5"
                  onClick={() => setShowAiChat(true)}
                >
                  <BrainCircuit className="w-5 h-5 text-indigo-400" /> Ask AI Tutor
                </Button>
                <Button 
                  variant="secondary" 
                  className="w-full h-14 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 gap-3 text-lg font-bold rounded-2xl"
                  onClick={handleGenerateQuiz}
                >
                  <Sparkles className="w-5 h-5" /> Take Lesson Quiz
                </Button>
              </div>
            </div>
          </div>

          {/* Quiz Overlay */}
          <AnimatePresence>
            {showQuiz && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
              >
                <Card className="w-full max-w-2xl glass border-white/10 overflow-hidden relative">
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-4 right-4 rounded-full"
                    onClick={() => setShowQuiz(false)}
                   >
                     <X className="w-5 h-5" />
                   </Button>

                   <CardContent className="p-8">
                      {generatingQuiz ? (
                        <div className="py-20 text-center space-y-6">
                           <div className="relative w-20 h-20 mx-auto">
                              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                              <BrainCircuit className="w-8 h-8 text-indigo-500 absolute inset-0 m-auto" />
                           </div>
                           <h3 className="text-2xl font-bold font-outfit">AI is generating your quiz...</h3>
                           <p className="text-muted-foreground">Analyzing lesson content to create relevant questions.</p>
                        </div>
                      ) : quizCompleted ? (
                        <div className="py-12 text-center space-y-6">
                           <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                              <Award className="w-12 h-12 text-emerald-400" />
                           </div>
                           <h3 className="text-3xl font-bold font-outfit">Quiz Completed!</h3>
                           <div className="text-5xl font-black text-indigo-400">
                             {quizScore} <span className="text-2xl text-muted-foreground">/ {quizQuestions.length}</span>
                           </div>
                           <p className="text-muted-foreground text-lg">
                             {quizScore === quizQuestions.length ? "Perfect score! You've mastered this lesson." : "Great effort! Review the explanations to strengthen your understanding."}
                           </p>
                           <div className="flex gap-4 justify-center mt-8">
                             <Button className="bg-indigo-600 px-8 h-12" onClick={() => setShowQuiz(false)}>Back to Lesson</Button>
                             <Button variant="outline" className="border-white/10 h-12" onClick={handleGenerateQuiz}>Retake Quiz</Button>
                           </div>
                        </div>
                      ) : (
                        <div className="space-y-8">
                           <div className="flex justify-between items-center">
                              <Badge className="bg-indigo-600/20 text-indigo-400 border-none">
                                Question {currentQuestionIndex + 1} of {quizQuestions.length}
                              </Badge>
                              <div className="h-2 w-32 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }} />
                              </div>
                           </div>

                           <h3 className="text-2xl font-bold font-outfit leading-snug">
                             {quizQuestions[currentQuestionIndex]?.question}
                           </h3>

                           <div className="grid gap-3">
                              {quizQuestions[currentQuestionIndex]?.options.map((opt: string) => (
                                <button
                                  key={opt}
                                  disabled={showExplanation}
                                  onClick={() => setSelectedOption(opt)}
                                  className={cn(
                                    "w-full p-4 rounded-2xl text-left border transition-all duration-200",
                                    selectedOption === opt 
                                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-300" 
                                      : "bg-white/5 border-white/5 hover:bg-white/10",
                                    showExplanation && opt === quizQuestions[currentQuestionIndex].correct_answer && "bg-emerald-500/20 border-emerald-500 text-emerald-400",
                                    showExplanation && selectedOption === opt && opt !== quizQuestions[currentQuestionIndex].correct_answer && "bg-red-500/20 border-red-500 text-red-400"
                                  )}
                                >
                                  {opt}
                                </button>
                              ))}
                           </div>

                           {showExplanation ? (
                             <motion.div 
                               initial={{ opacity: 0, y: 10 }}
                               animate={{ opacity: 1, y: 0 }}
                               className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20"
                             >
                                <p className="text-sm font-bold text-indigo-400 mb-1 flex items-center gap-2">
                                  {selectedOption === quizQuestions[currentQuestionIndex].correct_answer ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4 text-red-500" />}
                                  {selectedOption === quizQuestions[currentQuestionIndex].correct_answer ? "Correct!" : "Not quite right"}
                                </p>
                                <p className="text-sm text-indigo-200/80 italic leading-relaxed">
                                  {quizQuestions[currentQuestionIndex].explanation}
                                </p>
                                <Button 
                                  className="mt-4 w-full bg-indigo-600"
                                  onClick={() => {
                                    if (currentQuestionIndex + 1 < quizQuestions.length) {
                                      setCurrentQuestionIndex(prev => prev + 1);
                                      setSelectedOption(null);
                                      setShowExplanation(false);
                                    } else {
                                      setQuizCompleted(true);
                                    }
                                  }}
                                >
                                  {currentQuestionIndex + 1 < quizQuestions.length ? "Next Question" : "See Results"}
                                </Button>
                             </motion.div>
                           ) : (
                             <Button 
                               className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-lg font-bold rounded-2xl disabled:opacity-30"
                               disabled={!selectedOption}
                               onClick={() => {
                                 setShowExplanation(true);
                                 if (selectedOption === quizQuestions[currentQuestionIndex].correct_answer) {
                                   setQuizScore(prev => prev + 1);
                                 }
                               }}
                             >
                               Submit Answer
                             </Button>
                           )}
                        </div>
                      )}
                   </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Chat Drawer Overlay */}
          <AnimatePresence>
            {showAiChat && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowAiChat(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                />
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-zinc-900 border-l border-white/10 z-[110] flex flex-col shadow-2xl"
                >
                  <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30">
                        <BrainCircuit className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="font-bold font-outfit">AI Study Tutor</h3>
                        <p className="text-[10px] text-emerald-500 flex items-center gap-1 uppercase font-bold tracking-widest">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Online
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setShowAiChat(false)}>
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  <ScrollArea className="flex-1 p-6">
                    <div className="space-y-4">
                      {messages.map((msg, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[85%] rounded-2xl p-4 text-sm ${
                            msg.role === 'user' 
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                              : 'bg-white/5 text-foreground border border-white/10'
                          }`}>
                            {msg.content}
                          </div>
                        </motion.div>
                      ))}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-white/5 rounded-2xl p-4 flex gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  <div className="p-6 border-t border-white/5 bg-zinc-900/50">
                    <div className="flex gap-2 relative">
                      <Input 
                        placeholder="Ask anything about this lesson..." 
                        className="bg-white/5 border-white/10 h-12 pr-12 rounded-xl focus-visible:ring-indigo-500"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                      />
                      <Button 
                        size="icon" 
                        className="absolute right-1 top-1 h-10 w-10 bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                        onClick={handleSendChatMessage}
                        disabled={isTyping || !chatInput.trim()}
                      >
                        {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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
