import { Database } from '@/lib/supabase/database.types'

// Question types
export type Question = Database['public']['Tables']['questions']['Row']

export interface QuestionWithAnswer {
  id: string
  content: string
  question_type: 'multiple_choice' | 'fill_in_blank'
  answer_data: {
    options?: string[] // For multiple choice: ["A", "B", "C", "D"]
    correct?: string // For multiple choice: "A"
    correct_answers?: string[] // For fill in blank
    case_sensitive?: boolean
  }
  work_id: string | null
  difficulty: 'Dễ' | 'Trung bình' | 'Khó'
  explanation: string | null
}

// Answer tracking
export interface AnswerRecord {
  question_id: string
  answer: string
  is_correct: boolean
  time_taken: number // seconds
  timestamp: string
}

// Game state for Quiz Race
export interface QuizRaceState {
  sessionId: string | null
  currentQuestionIndex: number
  questions: QuestionWithAnswer[]
  answers: AnswerRecord[]
  score: number
  streak: number
  longestStreak: number
  startTime: number | null
  timeRemaining: number
  gameStatus: 'idle' | 'playing' | 'paused' | 'finished'
  powerUps: {
    fiftyFifty: number
    timeFreeze: number
    skip: number
  }
}

// Game settings
export interface GameSettings {
  workIds: string[] // Selected literary works
  questionCount: number // 2-50
  difficulty: 'Dễ' | 'Trung bình' | 'Khó' | 'Hỗn hợp'
  timeLimit: boolean
  timePerQuestion: number // seconds (15-60)
  gameMode: 'personal' | 'competition'
  competitionType?: 'direct' | 'extended'
}

// Game result
export interface GameResult {
  totalQuestions: number
  correctAnswers: number
  wrongAnswers: number
  accuracy: number
  totalScore: number
  longestStreak: number
  averageTime: number
  answers: AnswerRecord[]
  aiFeedback?: string
}

// Power-up types
export type PowerUpType = 'fifty_fifty' | 'time_freeze' | 'skip'

// Literary Map specific types
export interface MapNode {
  id: number
  type: 'plains' | 'forest' | 'mountain' | 'waterfall'
  difficulty: 'Dễ' | 'Trung bình' | 'Khó'
  points: number
  energyCost: number
  completed: boolean
  locked: boolean
}

export interface LiteraryMapState extends Omit<QuizRaceState, 'powerUps'> {
    hearts: number
    maxHearts: number
    energy: number
    maxEnergy: number
    keys: number
    currentNode: number
    nodes: MapNode[]
    regions: {
      workId: string
      workName: string
      nodes: MapNode[]
    }[]
    powerUps: { // Bây giờ bạn có thể định nghĩa thoải mái
      shield: number
      fifty_fifty: number
      specialBox: number
      secretPath: number
    }
  }

  