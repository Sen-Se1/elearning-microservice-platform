'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/shared/AuthProvider';
import { Navbar } from '@/components/shared/Navbar';
import { aiApi, courseApi } from '@/lib/api';
import { Course, ChatMessage } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BrainCircuit, 
  Sparkles, 
  Send, 
  BookOpen, 
  ArrowRight,
  TrendingUp,
  History
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function AiTutorPage() {
  const [recommendations, setRecommendations] = useState<Course[]>([]);
  const [learningStats, setLearningStats] = useState({ enrollments: 0, lessons: 0, questions: 156 });
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hello! I'm your universal AI Tutor. I can help you find the right course, explain concepts, or even quiz you on what you've learned. How can I assist you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user && user.role === 'instructor') {
      router.push('/instructor');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || user.role === 'instructor') return;
    // 1. Fetch Learning Stats (Fast)
    const fetchStats = async () => {
      try {
        const enrollRes = await courseApi.get('/enrollments/me', { params: { limit: 1 } });
        setLearningStats(prev => ({
          ...prev,
          enrollments: enrollRes.data.total || 0,
          lessons: (enrollRes.data.total || 0) * 7 
        }));
      } catch (e) {
        console.error('Failed to fetch stats:', e);
      }
    };

    // 2. Fetch AI Recommendations (Slow - LLM)
    const fetchRecommendations = async (force = false) => {
      // Check cache first
      if (!force) {
        const cached = localStorage.getItem('ai_recommendations');
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const isFresh = Date.now() - timestamp < 60000; // 1 minute
          if (isFresh) {
            setRecommendations(data);
            setLoadingRecommendations(false);
            return;
          }
        }
      }

      setLoadingRecommendations(true);
      try {
        const recRes = await aiApi.get('/recommendations');
        // Specific structure: res.data.recommendations[0].recommendations
        const data = recRes.data;
        let items = [];
        
        if (Array.isArray(data.recommendations) && data.recommendations[0]?.recommendations) {
          items = data.recommendations[0].recommendations;
        } else {
          items = data.recommendations || data;
        }
        
        const finalItems = Array.isArray(items) ? items : [];
        setRecommendations(finalItems);
        
        // Save to cache
        localStorage.setItem('ai_recommendations', JSON.stringify({
          data: finalItems,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
        setRecommendations([]);
      } finally {
        setLoadingRecommendations(false);
      }
    };

    fetchStats();
    fetchRecommendations();
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await aiApi.post('/chat', {
        messages: [...messages, userMsg],
        stream: false
      });
      
      const aiMsg: ChatMessage = { role: 'assistant', content: response.data.content || response.data.response };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;
  if (!user || user.role === 'instructor') return null;

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col lg:flex-row gap-8 overflow-hidden">
        
        {/* Left Column: AI Recommendations & Stats */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="glass rounded-[2rem] p-8 border-indigo-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[40px] -z-10" />
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30">
                <Sparkles className="w-6 h-6 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold font-outfit">AI Picks for You</h2>
            </div>
            
            <div className="space-y-4">
              {loadingRecommendations ? (
                // Skeletons for slow LLM content
                [1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 animate-pulse">
                    <div className="flex justify-between mb-3">
                      <div className="h-4 w-16 bg-white/10 rounded" />
                      <div className="h-3 w-3 bg-white/10 rounded-full" />
                    </div>
                    <div className="h-4 w-full bg-white/10 rounded mb-2" />
                    <div className="h-3 w-3/4 bg-white/10 rounded" />
                  </div>
                ))
              ) : Array.isArray(recommendations) && recommendations.length > 0 ? (
                recommendations.map((course, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Link href={`/courses/${(course as any).course_id || course.id}`} className="block group">
                      <div className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="secondary" className="text-[10px] uppercase">{course.category || 'Trending'}</Badge>
                          <TrendingUp className="w-3 h-3 text-emerald-500" />
                        </div>
                        <h3 className="font-bold text-sm mb-1 line-clamp-1 group-hover:text-indigo-400 transition-colors">{course.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">{(course as any).reason || 'Match: 98% based on your interests'}</p>
                      </div>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No recommendations found at the moment.
                </div>
              )}
            </div>
            
            <Button 
              variant="ghost" 
              className="w-full mt-6 text-indigo-400 hover:text-indigo-300"
              onClick={() => {
                const fetchRecommendations = async (force = true) => {
                  setLoadingRecommendations(true);
                  try {
                    const recRes = await aiApi.get('/recommendations');
                    const data = recRes.data;
                    let items = [];
                    if (Array.isArray(data.recommendations) && data.recommendations[0]?.recommendations) {
                      items = data.recommendations[0].recommendations;
                    } else {
                      items = data.recommendations || data;
                    }
                    const finalItems = Array.isArray(items) ? items : [];
                    setRecommendations(finalItems);
                    localStorage.setItem('ai_recommendations', JSON.stringify({
                      data: finalItems,
                      timestamp: Date.now()
                    }));
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setLoadingRecommendations(false);
                  }
                };
                fetchRecommendations(true);
              }}
            >
              Refresh Recommendations
            </Button>
          </div>

          <div className="glass rounded-[2rem] p-8 border-white/5">
             <h3 className="font-bold flex items-center gap-2 mb-4">
               <History className="w-4 h-4 text-muted-foreground" /> Learning Activity
             </h3>
             <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Courses in progress</span>
                  <span className="font-bold">{learningStats.enrollments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lessons completed</span>
                  <span className="font-bold">{learningStats.lessons}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">AI Questions asked</span>
                  <span className="font-bold">{learningStats.questions}</span>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Advanced Chat Interface */}
        <div className="flex-1 flex flex-col glass rounded-[2rem] border-white/10 overflow-hidden min-h-[600px]">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <BrainCircuit className="text-white w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-outfit leading-none mb-1">Advanced AI Tutor</h2>
                <p className="text-xs text-muted-foreground">Powered by GPT-4 & Your Course Content</p>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6 max-w-3xl mx-auto">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl p-4 ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                      : 'bg-white/10 text-foreground border border-white/10'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 rounded-2xl p-4 flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-6 bg-white/5 border-t border-white/5">
            <div className="max-w-3xl mx-auto flex gap-4">
              <div className="relative flex-1">
                <Input 
                  placeholder="Type your question here..." 
                  className="bg-background/50 border-white/10 h-14 pl-6 pr-12 text-lg rounded-2xl focus-visible:ring-indigo-500"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button 
                  size="icon" 
                  onClick={handleSendMessage}
                  disabled={loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 w-10 h-10 rounded-xl"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="max-w-3xl mx-auto mt-4 flex flex-wrap gap-2">
              <button className="text-[10px] px-3 py-1 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">Explain Python decorators</button>
              <button className="text-[10px] px-3 py-1 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">Summarize Course Content</button>
              <button className="text-[10px] px-3 py-1 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">Create a React Quiz</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
