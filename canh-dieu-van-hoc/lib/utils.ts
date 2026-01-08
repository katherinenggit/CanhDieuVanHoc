import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes with conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format score with commas
 */
export function formatScore(score: number): string {
  return score.toLocaleString('vi-VN')
}

/**
 * Calculate level from XP (Level = sqrt(XP / 100) + 1)
 */
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

/**
 * Calculate XP needed for next level
 */
export function calculateXPForNextLevel(currentLevel: number): number {
  return Math.pow(currentLevel, 2) * 100
}

/**
 * Get badge color based on badge tier
 */
export function getBadgeColor(badge: string): string {
  const colors = {
    Đồng: 'bg-amber-600',
    Bạc: 'bg-gray-400',
    Vàng: 'bg-yellow-500',
    'Hồng ngọc': 'bg-pink-500',
    'Kim cương': 'bg-blue-500',
  }
  return colors[badge as keyof typeof colors] || 'bg-gray-500'
}

/**
 * Get difficulty color
 */
export function getDifficultyColor(difficulty: string): string {
  const colors = {
    Dễ: 'text-green-500',
    'Trung bình': 'text-yellow-500',
    Khó: 'text-red-500',
  }
  return colors[difficulty as keyof typeof colors] || 'text-gray-500'
}

/**
 * Calculate accuracy percentage
 */
export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0
  return Math.round((correct / total) * 100)
}

/**
 * Format time in seconds to MM:SS
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Generate random room code (6 characters)
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Calculate score based on accuracy and time
 * Formula: Score = Accuracy (0-100) × Time Factor
 */
export function calculateQuizScore(
  isCorrect: boolean,
  timeLeft: number,
  totalTime: number,
  basePoints: number = 100
): number {
  if (!isCorrect) return 0

  const timeFactor = timeLeft / totalTime // 0 to 1
  return Math.round(basePoints * timeFactor)
}

/**
 * Get performance message based on score
 */
export function getPerformanceMessage(accuracyPercent: number): string {
  if (accuracyPercent >= 90) return '🎉 Xuất sắc!'
  if (accuracyPercent >= 70) return '👏 Giỏi lắm!'
  if (accuracyPercent >= 50) return '💪 Khá đấy!'
  return '📚 Cố gắng lên!'
}

/**
 * Shuffle array (Fisher-Yates algorithm)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}