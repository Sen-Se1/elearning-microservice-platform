import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMediaUrl(url?: string | null, fallback?: string) {
  const defaultFallback = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80';
  if (!url) return fallback || defaultFallback;
  if (url.startsWith('data:')) {
    return url;
  }

  // Resolve base URL from env (gateway preferred, then course service, then localhost gateway)
  const baseUrl = (process.env.NEXT_PUBLIC_GATEWAY_URL || process.env.NEXT_PUBLIC_COURSE_SERVICE_URL || 'http://localhost').replace(/\/$/, '');

  // If URL is already absolute, rewrite internal service host to gateway so the browser can reach it
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const u = new URL(url);
      // Replace internal course-service host with the configured base URL
      if (u.hostname === 'localhost' && u.port === '8001') {
        return `${baseUrl}${u.pathname}${u.search}`;
      }
      if (u.hostname === 'course-service' && u.port === '8001') {
        return `${baseUrl}${u.pathname}${u.search}`;
      }
      return url;
    } catch {
      return url;
    }
  }

  // Relative path — prepend base URL
  return `${baseUrl}/${url.replace(/^\//, '')}`;
}
