import { MapNode } from '@/lib/types/game'
import { shuffleArray } from '@/lib/utils'

/**
 * Generate map nodes for a literary work region
 */
export function generateMapNodes(workId: string, workName: string): MapNode[] {
  const terrainTypes: Array<'plains' | 'forest' | 'mountain' | 'waterfall'> = [
    'plains',
    'plains',
    'forest',
    'forest',
    'mountain',
  ]

  const nodes: MapNode[] = terrainTypes.map((type, index) => {
    let difficulty: 'Dễ' | 'Trung bình' | 'Khó' = 'Dễ'
    let points = 3

    if (type === 'plains') {
      difficulty = 'Dễ'
      points = 3
    } else if (type === 'forest') {
      difficulty = 'Trung bình'
      points = 5
    } else if (type === 'mountain') {
      difficulty = 'Khó'
      points = 7
    } else if (type === 'waterfall') {
      difficulty = 'Dễ'
      points = 0 // Recovery node
    }

    return {
      id: index,
      type,
      difficulty,
      points,
      energyCost: type === 'plains' ? 1 : type === 'forest' ? 2 : type === 'mountain' ? 3 : 0,
      completed: false,
      locked: index > 0, // First node unlocked, rest locked
    }
  })

  // Add one waterfall at random position (not first or last)
  const waterfallPosition = Math.floor(Math.random() * 3) + 1 // Position 1, 2, or 3
  nodes[waterfallPosition] = {
    id: waterfallPosition,
    type: 'waterfall',
    difficulty: 'Dễ',
    points: 0,
    energyCost: 0,
    completed: false,
    locked: true,
  }

  return nodes
}

/**
 * Calculate points for Literary Map based on difficulty
 */
export function calculateMapPoints(
  difficulty: 'Dễ' | 'Trung bình' | 'Khó',
  terrainType: 'plains' | 'forest' | 'mountain' | 'waterfall'
): number {
  const basePoints = {
    plains: 3,
    forest: 5,
    mountain: 7,
    waterfall: 0,
  }

  return basePoints[terrainType]
}

/**
 * Check if player should earn keys
 */
export function checkKeyReward(
  streak: number,
  nodeType: string,
  timeTaken: number,
  difficulty: string
): number {
  let keysEarned = 0

  // Streak reward: Every 5 correct answers
  if (streak > 0 && streak % 5 === 0) {
    keysEarned += 2
  }

  // Fast answer on hard question: < 10 seconds
  if (difficulty === 'Khó' && timeTaken < 10) {
    keysEarned += 2
  }

  return keysEarned
}

/**
 * Use power-up and return updated state
 */
export function usePowerUp(
  powerUpType: 'shield' | 'fifty_fifty' | 'special_box' | 'secret_path',
  keys: number,
  powerUps: Record<string, number>
): { success: boolean; keysUsed: number; newPowerUps: Record<string, number> } {
  const costs = {
    shield: 2,
    fifty_fifty: 1,
    special_box: 5,
    secret_path: 2,
  }

  const cost = costs[powerUpType]

  if (keys < cost) {
    return { success: false, keysUsed: 0, newPowerUps: powerUps }
  }

  const newPowerUps = { ...powerUps }
  newPowerUps[powerUpType] = (newPowerUps[powerUpType] || 0) + 1

  return {
    success: true,
    keysUsed: cost,
    newPowerUps,
  }
}

/**
 * Process waterfall recovery
 */
export function processWaterfallRecovery(
  choice: 'heart' | 'keys',
  currentHearts: number,
  maxHearts: number,
  currentKeys: number
): { hearts: number; keys: number } {
  if (choice === 'heart') {
    return {
      hearts: Math.min(currentHearts + 1, maxHearts),
      keys: currentKeys,
    }
  } else {
    return {
      hearts: currentHearts,
      keys: currentKeys + 1,
    }
  }
}

/**
 * Check if region is completed
 */
export function isRegionCompleted(nodes: MapNode[]): boolean {
  return nodes.every((node) => node.completed || node.type === 'waterfall')
}

/**
 * Calculate region completion bonus
 */
export function calculateRegionBonus(
  nodesCompleted: number,
  heartsLost: number,
  difficulty: string
): { points: number; keys: number } {
  let points = 20 // Base bonus

  // No hearts lost bonus
  if (heartsLost === 0) {
    points += 10
    return { points, keys: 2 }
  }

  return { points, keys: 0 }
}

/**
 * Get next unlockable node
 */
export function getNextNode(nodes: MapNode[]): MapNode | null {
  const completedCount = nodes.filter((n) => n.completed).length
  
  if (completedCount >= nodes.length) {
    return null // All completed
  }

  // Unlock next node
  const nextIndex = completedCount
  if (nextIndex < nodes.length) {
    return nodes[nextIndex]
  }

  return null
}

/**
 * Calculate final Literary Map result
 */
export function calculateLiteraryMapResult(
  totalScore: number,
  totalQuestions: number,
  correctAnswers: number,
  wrongAnswers: number,
  regionsCompleted: number,
  heartsRemaining: number,
  keysUsed: number
): {
  score: number
  accuracy: number
  grade: string
  message: string
} {
  const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0

  let grade = 'D'
  let message = 'Cố gắng lên!'

  if (accuracy >= 90 && heartsRemaining >= 3) {
    grade = 'S'
    message = 'Huyền thoại! Bạn là bậc thầy văn học!'
  } else if (accuracy >= 80) {
    grade = 'A'
    message = 'Xuất sắc! Tri thức của bạn thật ấn tượng!'
  } else if (accuracy >= 70) {
    grade = 'B'
    message = 'Tốt lắm! Bạn đã làm rất tốt!'
  } else if (accuracy >= 60) {
    grade = 'C'
    message = 'Khá đấy! Tiếp tục cố gắng nhé!'
  }

  return {
    score: totalScore,
    accuracy: Math.round(accuracy),
    grade,
    message,
  }
}