'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Course } from '@/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Star, Users, ArrowRight } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn, getMediaUrl } from '@/lib/utils';

interface CourseCardProps {
  course: Course;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden glass border-white/10 h-full flex flex-col group">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          <img 
            src={getMediaUrl(course.thumbnail_url)} 
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute top-4 left-4">
            <Badge className="bg-indigo-600/90 hover:bg-indigo-600 text-white backdrop-blur-md border-none uppercase text-[10px] font-bold tracking-wider">
              {course.category}
            </Badge>
          </div>
        </div>

        <CardContent className="p-6 flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3.5 h-3.5 ${i < (course.rating || 4.5) ? 'fill-current' : ''}`} />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">(4.5)</span>
          </div>

          <h3 className="text-xl font-bold font-outfit mb-2 line-clamp-2 group-hover:text-indigo-400 transition-colors">
            {course.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {course.short_description}
          </p>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {course.duration_hours}h
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {course.enrollment_count || 1200}
            </div>
            <div className="flex items-center gap-1 uppercase font-bold tracking-tighter text-indigo-400">
              {course.level}
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-6 pt-0 border-t border-white/5 flex items-center justify-between">
          <div className="text-2xl font-bold font-outfit">
            {course.price === 0 ? 'Free' : `$${course.price}`}
          </div>
          <Link 
            href={`/courses/${course.id}`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "group/btn text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10")}
          >
            View Course <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

