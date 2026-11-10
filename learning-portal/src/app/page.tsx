'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/shared/Navbar';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Sparkles, 
  Play, 
  Users, 
  Award, 
  BrainCircuit,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent -z-10" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] -z-10" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] -z-10" />

        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="outline" className="px-4 py-1 mb-6 border-indigo-500/30 bg-indigo-500/10 text-indigo-400 gap-2">
                <Sparkles className="w-3 h-3" /> AI-Powered Learning
              </Badge>
              <h1 className="text-5xl md:text-7xl font-extrabold font-outfit mb-6 tracking-tight leading-[1.1]">
                Master Any Skill with <br />
                <span className="gradient-text">Personalized AI Tutoring</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Join 50,000+ students learning from the world's best instructors with 24/7 AI-guided support and interactive lessons.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link 
                  href="/courses" 
                  className={cn(buttonVariants({ size: "lg" }), "h-14 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 group")}
                >
                  Explore Courses <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-white/10 hover:bg-white/5 gap-2">
                  <Play className="w-5 h-5 fill-current" /> Watch Demo
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-black/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-outfit mb-4">Why Aura Learning?</h2>
            <p className="text-muted-foreground">The most advanced platform for modern learners.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<BrainCircuit className="w-10 h-10 text-indigo-400" />}
              title="AI Smart Tutor"
              description="Get instant answers and explanations tailored to your learning style while you study."
            />
            <FeatureCard 
              icon={<Users className="w-10 h-10 text-purple-400" />}
              title="Expert Instructors"
              description="Learn from industry leaders and experts who are passionate about teaching."
            />
            <FeatureCard 
              icon={<Award className="w-10 h-10 text-pink-400" />}
              title="Certifications"
              description="Earn recognized certificates upon completion to boost your career prospects."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 mt-20">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-500 flex items-center justify-center">
              <BookOpen className="text-white w-4 h-4" />
            </div>
            <span className="font-bold font-outfit">AuraLearn</span>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact Us</Link>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Aura Learning. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="p-8 rounded-3xl border border-white/5 bg-white/5 hover:bg-white/[0.08] transition-colors"
    >
      <div className="mb-6">{icon}</div>
      <h3 className="text-2xl font-bold mb-4 font-outfit">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
}

