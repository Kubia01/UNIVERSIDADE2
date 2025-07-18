import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para o banco de dados
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  department?: string
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  title: string
  description: string
  thumbnail?: string
  duration: number
  level: 'beginner' | 'intermediate' | 'advanced'
  category: string
  created_by: string
  created_at: string
  updated_at: string
  is_published: boolean
}

export interface Video {
  id: string
  course_id: string
  title: string
  description?: string
  video_url: string
  duration: number
  order: number
  created_at: string
  updated_at: string
}

export interface UserProgress {
  id: string
  user_id: string
  video_id: string
  course_id: string
  completed: boolean
  progress_percentage: number
  last_watched_at: string
  created_at: string
  updated_at: string
}

export interface Certificate {
  id: string
  user_id: string
  course_id: string
  issued_at: string
  certificate_url: string
}