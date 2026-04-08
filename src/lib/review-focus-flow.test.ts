import { describe, expect, it } from 'vitest'
import { buildReviewFocusFlow } from '@/lib/review-focus-flow'

describe('buildReviewFocusFlow', () => {
  it('splits multi-label tasks evenly across focus areas', () => {
    const data = buildReviewFocusFlow([
      {
        completedAt: '2026-01-10T12:00:00.000Z',
        labels: [
          { id: 'label-a', name: 'Platform', color: '#2563eb' },
          { id: 'label-b', name: 'Docs', color: '#16a34a' },
        ],
      },
      {
        completedAt: '2026-01-22T12:00:00.000Z',
        labels: [{ id: 'label-a', name: 'Platform', color: '#2563eb' }],
      },
      {
        completedAt: '2026-02-02T12:00:00.000Z',
        labels: [],
      },
    ])

    const januaryNode = data.nodes.find((node) => node.id === 'month-0')
    const platformNode = data.nodes.find((node) => node.id === 'label-a')
    const docsNode = data.nodes.find((node) => node.id === 'label-b')
    const unlabeledNode = data.nodes.find((node) => node.kind === 'unlabeled')

    expect(januaryNode?.total).toBe(2)
    expect(platformNode?.total).toBe(1.5)
    expect(docsNode?.total).toBe(0.5)
    expect(unlabeledNode?.total).toBe(1)
    expect(data.links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          value: 1.5,
        }),
        expect.objectContaining({
          value: 0.5,
        }),
      ]),
    )
  })

  it('collapses smaller focus areas into an other bucket when needed', () => {
    const data = buildReviewFocusFlow([
      {
        completedAt: '2026-03-01T12:00:00.000Z',
        labels: [{ id: 'l1', name: 'One', color: '#111111' }],
      },
      {
        completedAt: '2026-03-02T12:00:00.000Z',
        labels: [{ id: 'l2', name: 'Two', color: '#222222' }],
      },
      {
        completedAt: '2026-03-03T12:00:00.000Z',
        labels: [{ id: 'l3', name: 'Three', color: '#333333' }],
      },
      {
        completedAt: '2026-03-04T12:00:00.000Z',
        labels: [{ id: 'l4', name: 'Four', color: '#444444' }],
      },
      {
        completedAt: '2026-03-05T12:00:00.000Z',
        labels: [{ id: 'l5', name: 'Five', color: '#555555' }],
      },
      {
        completedAt: '2026-03-06T12:00:00.000Z',
        labels: [{ id: 'l6', name: 'Six', color: '#666666' }],
      },
      {
        completedAt: '2026-03-07T12:00:00.000Z',
        labels: [{ id: 'l7', name: 'Seven', color: '#777777' }],
      },
    ])

    const otherNode = data.nodes.find((node) => node.kind === 'other')
    const marchNodeIndex = data.nodes.findIndex((node) => node.id === 'month-2')

    expect(otherNode).toBeDefined()
    expect(otherNode?.total).toBe(1)
    expect(
      data.links.some(
        (link) =>
          link.source === marchNodeIndex &&
          data.nodes[link.target]?.kind === 'other' &&
          link.value === 1,
      ),
    ).toBe(true)
  })
})
