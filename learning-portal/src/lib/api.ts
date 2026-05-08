import axios from 'axios';
import Cookies from 'js-cookie';

const USER_SERVICE_URL = process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:8002/api/v1/users';
const COURSE_SERVICE_URL = process.env.NEXT_PUBLIC_COURSE_SERVICE_URL || 'http://localhost:8001/api/v1';
const ANALYTICS_SERVICE_URL = process.env.NEXT_PUBLIC_ANALYTICS_SERVICE_URL || 'http://localhost:8003';
const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8004/api/v1/tutor';

// Base axios instance with interceptors
const createInstance = (baseURL: string) => {
  const instance = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use(
    (config) => {
      const token = Cookies.get('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  return instance;
};

export const userApi = createInstance(USER_SERVICE_URL);
export const courseApi = createInstance(COURSE_SERVICE_URL);
export const analyticsApi = createInstance(ANALYTICS_SERVICE_URL);
export const aiApi = createInstance(AI_SERVICE_URL);

// Helper for multipart/form-data (used for thumbnails/lessons)
export const courseApiMultipart = axios.create({
  baseURL: COURSE_SERVICE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

courseApiMultipart.interceptors.request.use((config) => {
  const token = Cookies.get('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
