import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { YearStats, MonthlyData } from '@/types/stats'

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export async function GET(request: NextRequest) {
  try {
    const yearParam = request.nextUrl.searchParams.get('year')
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear()

    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
    }

    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year + 1, 0, 1)

    // Fetch all todos created in this year (for "created" counts)
    const todosCreated = await db.todo.findMany({
      where: { createdAt: { gte: startDate, lt: endDate } },
      select: {
        id: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        labels: { select: { id: true, name: true, color: true } },
      },
    })

    // Fetch all todos completed in this year (updatedAt as proxy for completedAt)
    const todosCompleted = await db.todo.findMany({
      where: {
        status: 'COMPLETED',
        updatedAt: { gte: startDate, lt: endDate },
      },
      select: {
        id: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        labels: { select: { id: true, name: true, color: true } },
      },
    })

    // --- Monthly data ---
    const monthly: MonthlyData[] = MONTH_LABELS.map((label, i) => ({
      month: i,
      label,
      created: 0,
      completed: 0,
    }))

    for (const todo of todosCreated) {
      const m = new Date(todo.createdAt).getMonth()
      monthly[m].created++
    }

    for (const todo of todosCompleted) {
      const m = new Date(todo.updatedAt).getMonth()
      monthly[m].completed++
    }

    // --- Summary ---
    const totalCreated = todosCreated.length
    const totalCompleted = todosCompleted.length
    const completionRate = totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0

    // Avg completion days (using updatedAt - createdAt for completed todos)
    let totalDays = 0
    for (const todo of todosCompleted) {
      const created = new Date(todo.createdAt).getTime()
      const completed = new Date(todo.updatedAt).getTime()
      totalDays += (completed - created) / (1000 * 60 * 60 * 24)
    }
    const avgCompletionDays = totalCompleted > 0 ? Math.round(totalDays / totalCompleted) : 0

    // Current streak: consecutive months (from most recent) with at least 1 completion
    let currentStreak = 0
    const now = new Date()
    const currentMonth = year === now.getFullYear() ? now.getMonth() : 11
    for (let i = currentMonth; i >= 0; i--) {
      if (monthly[i].completed > 0) {
        currentStreak++
      } else {
        break
      }
    }

    // High priority completed (HIGH + URGENT)
    const highPriorityCompleted = todosCompleted.filter(
      t => t.priority === 'HIGH' || t.priority === 'URGENT'
    ).length

    // --- By Status (all todos created this year, current status) ---
    const statusMap = new Map<string, number>()
    for (const todo of todosCreated) {
      statusMap.set(todo.status, (statusMap.get(todo.status) || 0) + 1)
    }
    const byStatus = ['TODO', 'IN_PROGRESS', 'WAITING', 'ON_HOLD', 'COMPLETED'].map(status => ({
      status,
      count: statusMap.get(status) || 0,
    }))

    // --- By Priority (all todos created this year) ---
    const priorityMap = new Map<string, number>()
    for (const todo of todosCreated) {
      priorityMap.set(todo.priority, (priorityMap.get(todo.priority) || 0) + 1)
    }
    const byPriority = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(priority => ({
      priority,
      count: priorityMap.get(priority) || 0,
    }))

    // --- Top Labels ---
    const labelMap = new Map<string, { name: string; color: string; count: number }>()
    for (const todo of todosCreated) {
      for (const label of todo.labels) {
        const existing = labelMap.get(label.name) || { name: label.name, color: label.color, count: 0 }
        existing.count++
        labelMap.set(label.name, existing)
      }
    }
    const topLabels = Array.from(labelMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // --- Highlights ---
    const busiestMonthIdx = monthly.reduce((max, m, i) => m.created > monthly[max].created ? i : max, 0)
    const productiveMonthIdx = monthly.reduce((max, m, i) => m.completed > monthly[max].completed ? i : max, 0)

    const highlights = {
      busiestMonth: monthly[busiestMonthIdx].created > 0 ? MONTH_LABELS[busiestMonthIdx] : null,
      mostProductiveMonth: monthly[productiveMonthIdx].completed > 0 ? MONTH_LABELS[productiveMonthIdx] : null,
      topLabel: topLabels.length > 0 ? topLabels[0].name : null,
    }

    const stats: YearStats = {
      summary: {
        totalCreated,
        totalCompleted,
        completionRate,
        avgCompletionDays,
        currentStreak,
        highPriorityCompleted,
      },
      monthly,
      byStatus,
      byPriority,
      topLabels,
      highlights,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching year stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
