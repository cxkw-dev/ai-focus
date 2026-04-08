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

export type FocusFlowNodeKind = 'month' | 'label' | 'other' | 'unlabeled'

export interface FocusFlowNode {
  id: string
  name: string
  shortLabel: string
  kind: FocusFlowNodeKind
  total: number
  month?: number
  labelColor?: string | null
}

export interface FocusFlowLink {
  source: number
  target: number
  value: number
}

export interface FocusFlowData {
  nodes: FocusFlowNode[]
  links: FocusFlowLink[]
}

export interface AccomplishmentCategoryData {
  category: string
  count: number
}

export interface Highlights {
  busiestMonth: string | null
  mostProductiveMonth: string | null
  topLabel: string | null
  topCategory: string | null
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
  focusFlow: FocusFlowData
  highlights: Highlights
  accomplishments: {
    total: number
    byCategory: AccomplishmentCategoryData[]
  }
}
