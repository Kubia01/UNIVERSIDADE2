export interface User {
  id: string;
  name: string;
  email: string;
  department: Department;
  role: UserRole;
  avatar?: string;
  joinedAt: string;
  lastLogin?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  department: Department;
  type: CourseType;
  duration: number; // in minutes
  instructor: string;
  thumbnail: string;
  lessons: Lesson[];
  isPublished: boolean;
  isMandatory: boolean;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  type: LessonType;
  content: string; // URL for video, PDF, etc.
  duration?: number;
  isCompleted?: boolean;
  quiz?: Quiz;
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'text';
  options?: string[];
  correctAnswer: string | number;
}

export interface UserProgress {
  userId: string;
  courseId: string;
  progress: number; // percentage
  completedLessons: string[];
  startedAt: string;
  completedAt?: string;
  certificateId?: string;
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  issuedAt: string;
  certificateUrl: string;
}

export interface CourseAssignment {
  id: string;
  userId: string;
  courseId: string;
  assignedBy: string;
  assignedAt: string;
  deadline?: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'welcome' | 'policy' | 'announcement';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Department = 'HR' | 'Operations' | 'Sales' | 'Engineering' | 'Finance' | 'Marketing';

export type UserRole = 'student' | 'instructor' | 'admin' | 'manager';

export type CourseType = 'onboarding' | 'training' | 'compliance' | 'skills' | 'leadership';

export type LessonType = 'video' | 'document' | 'quiz' | 'interactive';

export interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Partial<User>, password: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
  isLoading: boolean;
}