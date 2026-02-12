export interface MonthlyData {
  month: number
  label: string
  created: number
  completed: number
}

export interface StatusData {
  status: string
  count: number
}

export interface PriorityData {
  priority: string
  count: number
}

export interface LabelData {
  name: string
  color: string
  count: number
}

export interface Highlights {
  busiestMonth: string | null
  mostProductiveMonth: string | null
  topLabel: string | null
}

export interface YearStats {
  summary: {
    totalCreated: number
    totalCompleted: number
    completionRate: number
    avgCompletionDays: number
    currentStreak: number
    highPriorityCompleted: number
  }
  monthly: MonthlyData[]
  byStatus: StatusData[]
  byPriority: PriorityData[]
  topLabels: LabelData[]
  highlights: Highlights
}
