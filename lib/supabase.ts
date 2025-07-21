import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Tipos para o banco de dados
export interface User {
  id: string
  name: string
  email: string
  department: Department
  role: 'admin' | 'user'
  avatar?: string
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  title: string
  description: string
  type: CourseType
  duration: number // in minutes
  instructor: string
  thumbnail?: string
  lessons?: Lesson[]
  is_published: boolean
  is_mandatory: boolean
  department: Department
  created_at: string
  updated_at: string
}

export interface Lesson {
  id: string
  course_id: string
  title: string
  description: string
  type: LessonType
  content: string // URL for video, PDF, etc.
  duration?: number
  order_index: number
  created_at: string
  updated_at: string
}

export interface UserProgress {
  id: string
  user_id: string
  course_id: string
  lesson_id?: string
  progress: number // percentage
  completed_lessons: string[]
  started_at: string
  completed_at?: string
  certificate_id?: string
}

export interface Certificate {
  id: string
  user_id: string
  course_id: string
  issued_at: string
  certificate_url?: string
}

export interface CourseAssignment {
  id: string
  user_id: string
  course_id: string
  assigned_by: string
  assigned_at: string
  deadline?: string
}

export interface AdminNotification {
  id: string
  title: string
  message: string
  type: 'welcome' | 'policy' | 'announcement'
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Department = 'HR' | 'Operations' | 'Sales' | 'Engineering' | 'Finance' | 'Marketing'

export type UserRole = 'user' | 'admin'

export type CourseType = 'onboarding' | 'training' | 'compliance' | 'skills' | 'leadership'

export type LessonType = 'video' | 'document' | 'quiz' | 'link'