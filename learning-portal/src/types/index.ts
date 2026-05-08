export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'learner' | 'instructor' | 'admin';
  phone?: string;
  dateOfBirth?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

export interface Course {
  total_enrollments: number | undefined;
  id: string;
  title: string;
  description: string;
  short_description: string;
  price: number;
  category: string;
  subcategory?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration_hours: number;
  published: boolean;
  is_featured: boolean;
  thumbnail_url?: string;
  instructor_id: string;
  created_at: string;
  updated_at: string;
  rating?: number;
  enrollment_count?: number;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  content_type: 'video' | 'text' | 'pdf' | 'quiz' | 'audio' | 'image';
  content_url?: string;
  duration_minutes: number;
  order_index: number;
  is_preview: boolean;
  is_published: boolean;
  created_at: string;
}

export interface Enrollment {
  id: string;
  course_id: string;
  user_id: string;
  enrolled_at: string;
  completed_at?: string;
  progress: number;
  course?: Course;
}

export interface Feedback {
  id: string;
  course_id: string;
  user_id: string;
  rating: number;
  comment: string;
  ai_summary?: string;
  created_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}
