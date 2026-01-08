// Generated types from Supabase schema
// Run: npx supabase gen types typescript --project-id id_dự_án_supabase > lib/supabase/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string
          username: string
          email: string | null
          avatar_url: string | null
          level: number
          xp: number
          badge: 'Đồng' | 'Bạc' | 'Vàng' | 'Hồng ngọc' | 'Kim cương'
          total_games: number
          total_questions_answered: number
          total_correct_answers: number
          total_wrong_answers: number
          longest_streak: number
          current_streak: number
          weekly_score: number
          monthly_score: number
          total_score: number
          is_verified: boolean
          is_anonymous: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name: string
          username: string
          email?: string | null
          avatar_url?: string | null
          level?: number
          xp?: number
          badge?: 'Đồng' | 'Bạc' | 'Vàng' | 'Hồng ngọc' | 'Kim cương'
          total_games?: number
          total_questions_answered?: number
          total_correct_answers?: number
          total_wrong_answers?: number
          longest_streak?: number
          current_streak?: number
          weekly_score?: number
          monthly_score?: number
          total_score?: number
          is_verified?: boolean
          is_anonymous?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          username?: string
          email?: string | null
          avatar_url?: string | null
          level?: number
          xp?: number
          badge?: 'Đồng' | 'Bạc' | 'Vàng' | 'Hồng ngọc' | 'Kim cương'
          total_games?: number
          total_questions_answered?: number
          total_correct_answers?: number
          total_wrong_answers?: number
          longest_streak?: number
          current_streak?: number
          weekly_score?: number
          monthly_score?: number
          total_score?: number
          is_verified?: boolean
          is_anonymous?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      literary_works: {
        Row: {
          id: string
          title: string
          author: string
          period: string
          genre: string
          description: string | null
          cover_image_url: string | null
          question_count: number
          total_plays: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          author: string
          period: string
          genre: string
          description?: string | null
          cover_image_url?: string | null
          question_count?: number
          total_plays?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          author?: string
          period?: string
          genre?: string
          description?: string | null
          cover_image_url?: string | null
          question_count?: number
          total_plays?: number
          created_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          content: string
          question_type: 'multiple_choice' | 'fill_in_blank'
          answer_data: Json
          work_id: string | null
          difficulty: 'Dễ' | 'Trung bình' | 'Khó'
          explanation: string | null
          created_by: string | null
          is_public: boolean
          is_ai_generated: boolean
          usage_count: number
          correct_rate: number
          average_time: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content: string
          question_type?: 'multiple_choice' | 'fill_in_blank'
          answer_data: Json
          work_id?: string | null
          difficulty: 'Dễ' | 'Trung bình' | 'Khó'
          explanation?: string | null
          created_by?: string | null
          is_public?: boolean
          is_ai_generated?: boolean
          usage_count?: number
          correct_rate?: number
          average_time?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content?: string
          question_type?: 'multiple_choice' | 'fill_in_blank'
          answer_data?: Json
          work_id?: string | null
          difficulty?: 'Dễ' | 'Trung bình' | 'Khó'
          explanation?: string | null
          created_by?: string | null
          is_public?: boolean
          is_ai_generated?: boolean
          usage_count?: number
          correct_rate?: number
          average_time?: number
          created_at?: string
          updated_at?: string
        }
      }
      game_sessions: {
        Row: {
          id: string
          room_code: string
          created_by: string | null
          game_mode: 'personal' | 'competition'
          game_type: 'quiz_race' | 'time_battle' | 'literary_map'
          competition_type: 'direct' | 'extended' | null
          settings: Json
          status: 'waiting' | 'playing' | 'finished' | 'cancelled'
          join_deadline: string | null
          started_at: string | null
          finished_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          room_code: string
          created_by?: string | null
          game_mode: 'personal' | 'competition'
          game_type: 'quiz_race' | 'time_battle' | 'literary_map'
          competition_type?: 'direct' | 'extended' | null
          settings: Json
          status?: 'waiting' | 'playing' | 'finished' | 'cancelled'
          join_deadline?: string | null
          started_at?: string | null
          finished_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          room_code?: string
          created_by?: string | null
          game_mode?: 'personal' | 'competition'
          game_type?: 'quiz_race' | 'time_battle' | 'literary_map'
          competition_type?: 'direct' | 'extended' | null
          settings?: Json
          status?: 'waiting' | 'playing' | 'finished' | 'cancelled'
          join_deadline?: string | null
          started_at?: string | null
          finished_at?: string | null
          created_at?: string
        }
      }
      game_participants: {
        Row: {
          id: string
          session_id: string
          player_id: string
          score: number
          correct_count: number
          wrong_count: number
          longest_streak: number
          current_streak: number
          hearts_remaining: number | null
          energy_remaining: number | null
          keys_count: number
          current_node: number
          power_ups: Json
          answers_history: Json
          rank: number | null
          joined_at: string
          finished_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          player_id: string
          score?: number
          correct_count?: number
          wrong_count?: number
          longest_streak?: number
          current_streak?: number
          hearts_remaining?: number | null
          energy_remaining?: number | null
          keys_count?: number
          current_node?: number
          power_ups?: Json
          answers_history?: Json
          rank?: number | null
          joined_at?: string
          finished_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          player_id?: string
          score?: number
          correct_count?: number
          wrong_count?: number
          longest_streak?: number
          current_streak?: number
          hearts_remaining?: number | null
          energy_remaining?: number | null
          keys_count?: number
          current_node?: number
          power_ups?: Json
          answers_history?: Json
          rank?: number | null
          joined_at?: string
          finished_at?: string | null
        }
      }
      leaderboards: {
        Row: {
          id: string
          user_id: string
          leaderboard_type: 'global' | 'weekly' | 'monthly' | 'work_specific'
          work_id: string | null
          score: number
          rank: number | null
          period_start: string | null
          period_end: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          leaderboard_type: 'global' | 'weekly' | 'monthly' | 'work_specific'
          work_id?: string | null
          score?: number
          rank?: number | null
          period_start?: string | null
          period_end?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          leaderboard_type?: 'global' | 'weekly' | 'monthly' | 'work_specific'
          work_id?: string | null
          score?: number
          rank?: number | null
          period_start?: string | null
          period_end?: string | null
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}