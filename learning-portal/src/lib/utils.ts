import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMediaUrl(url?: string | null, fallback?: string) {
  const defaultFallback = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80';
  if (!url) return fallback || defaultFallback;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  
  // Use gateway URL if provided, otherwise fallback to course service URL
  const baseUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || process.env.NEXT_PUBLIC_COURSE_SERVICE_URL || 'http://localhost:8001';
  return `${baseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
}
