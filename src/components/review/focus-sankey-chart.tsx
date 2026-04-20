'use client'

import * as React from 'react'
import {
  ResponsiveContainer,
  Sankey,
  Tooltip,
  type SankeyLinkProps,
  type SankeyNodeProps,
} from 'recharts'
import type { FocusFlowData, FocusFlowNode } from '@/types/stats'

interface FocusSankeyChartProps {
  data: FocusFlowData
  colors: Record<string, string>
}

interface FocusTooltipProps {
  active?: boolean
  payload?: Array<{
    name?: string
    value?: number
    payload?: unknown
  }>
  colors: Record<string, string>
  monthPalette: string[]
}

interface FocusNodeRendererProps extends SankeyNodeProps {
  colors: Record<string, string>
  monthPalette: string[]
}

interface FocusLinkRendererProps extends SankeyLinkProps {
  colors: Record<string, string>
  monthPalette: string[]
}

function formatFlowValue(value: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: Number.isInteger(value) ? 0 : 1,
  }).format(value)
}

function trimLabel(value: string, maxLength: number) {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength - 3).trimEnd()}...`
}

function mixColor(base: string, blend: string, basePercent: number) {
  return `color-mix(in srgb, ${base} ${basePercent}%, ${blend})`
}

function buildMonthPalette(colors: Record<string, string>) {
  return [
    colors.primary,
    colors.accent,
    colors.statusInProgress,
    colors.statusDone,
    colors.priorityHigh,
    colors.categoryCollaboration,
    colors.statusWaiting,
    colors.categoryGrowth,
  ].filter(Boolean)
}

function getNodeAccent(
  node: FocusFlowNode,
  colors: Record<string, string>,
  monthPalette: string[],
) {
  if (node.kind === 'label' && node.labelColor) return node.labelColor
  if (node.kind === 'other') return colors.accent || colors.primary
  if (node.kind === 'unlabeled') return colors.textMuted || colors.primary
  if (node.kind === 'month' && monthPalette.length > 0) {
    return monthPalette[(node.month ?? 0) % monthPalette.length]
  }
  return colors.primary
}

function unwrapTooltipPayload(payload: unknown) {
  if (
    payload &&
    typeof payload === 'object' &&
    'payload' in payload &&
    payload.payload &&
    typeof payload.payload === 'object'
  ) {
    return payload.payload
  }

  return payload
}

function isLinkPayload(payload: unknown): payload is {
  source: FocusFlowNode
  target: FocusFlowNode
  value: number
} {
  return Boolean(
    payload &&
    typeof payload === 'object' &&
    'source' in payload &&
    'target' in payload,
  )
}

function FocusTooltip({
  active,
  payload,
  colors,
  monthPalette,
}: FocusTooltipProps) {
  if (!active || !payload?.length) return null

  const entry = payload[0]
  const rawPayload = unwrapTooltipPayload(entry.payload)

  if (!rawPayload || typeof rawPayload !== 'object') return null

  if (isLinkPayload(rawPayload)) {
    const accent = getNodeAccent(rawPayload.target, colors, monthPalette)

    return (
      <div
        className="rounded-xl border px-3 py-2.5 text-xs shadow-lg"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          color: colors.textPrimary,
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: accent }}
          />
          <p className="font-semibold">
            {rawPayload.source.name} to {rawPayload.target.name}
          </p>
        </div>
        <p className="mt-1" style={{ color: colors.textMuted }}>
          {formatFlowValue(rawPayload.value)} completed tasks
        </p>
      </div>
    )
  }

  const node = rawPayload as FocusFlowNode
  const accent = getNodeAccent(node, colors, monthPalette)

  return (
    <div
      className="rounded-xl border px-3 py-2.5 text-xs shadow-lg"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        color: colors.textPrimary,
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: accent }}
        />
        <p className="font-semibold">{node.name}</p>
      </div>
      <p className="mt-1" style={{ color: colors.textMuted }}>
        {formatFlowValue(node.total)} completed tasks
      </p>
    </div>
  )
}

function FocusNodeRenderer({
  x,
  y,
  width,
  height,
  payload,
  colors,
  monthPalette,
}: FocusNodeRendererProps) {
  const node = payload as unknown as FocusFlowNode
  const accent = getNodeAccent(node, colors, monthPalette)
  const label = trimLabel(
    node.shortLabel || node.name,
    node.kind === 'month' ? 6 : 18,
  )
  const isMonthNode = node.kind === 'month'
  const textX = isMonthNode ? x + width + 10 : x - 10
  const textAnchor = isMonthNode ? 'start' : 'end'
  const stripWidth = Math.min(4, width)
  const nodeFill = isMonthNode
    ? mixColor(accent, colors.surface2, 12)
    : mixColor(accent, colors.surface2, 18)

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={6}
        fill={nodeFill}
        stroke={accent}
        strokeOpacity={0.4}
      />
      <rect
        x={isMonthNode ? x : x + width - stripWidth}
        y={y}
        width={stripWidth}
        height={height}
        rx={6}
        fill={accent}
      />
      {height >= 12 && (
        <text
          x={textX}
          y={y + height / 2}
          textAnchor={textAnchor}
          dominantBaseline="middle"
          fontSize={11}
          fontWeight={isMonthNode ? 500 : 600}
          fill={isMonthNode ? colors.textMuted : colors.textPrimary}
        >
          {label}
        </text>
      )}
    </g>
  )
}

function FocusLinkRenderer({
  sourceX,
  targetX,
  sourceY,
  targetY,
  sourceControlX,
  targetControlX,
  linkWidth,
  payload,
  colors,
  monthPalette,
}: FocusLinkRendererProps) {
  const targetNode = payload.target as unknown as FocusFlowNode
  const accent = getNodeAccent(targetNode, colors, monthPalette)
  const stroke = mixColor(accent, colors.surface2, 38)

  return (
    <path
      d={`M${sourceX},${sourceY}C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
      fill="none"
      stroke={stroke}
      strokeOpacity={0.18}
      strokeWidth={Math.max(linkWidth, 1)}
      strokeLinecap="butt"
    />
  )
}

export function FocusSankeyChart({ data, colors }: FocusSankeyChartProps) {
  const monthPalette = React.useMemo(() => buildMonthPalette(colors), [colors])
  const hasFlow = data.links.length > 0
  const totalCompleted = data.nodes
    .filter((node) => node.kind === 'month')
    .reduce((total, node) => total + node.total, 0)
  const focusAreas = data.nodes.filter((node) => node.kind !== 'month')

  if (!colors.primary) return null

  return (
    <section
      className="h-full overflow-hidden rounded-2xl border p-4 sm:p-5"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border-color)',
        backgroundImage:
          'radial-gradient(circle at top left, color-mix(in srgb, var(--primary) 9%, transparent), transparent 34%), radial-gradient(circle at 100% 12%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 28%)',
      }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <div
            className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase"
            style={{
              borderColor:
                'color-mix(in srgb, var(--primary) 24%, var(--border-color))',
              color: 'var(--primary)',
              backgroundColor:
                'color-mix(in srgb, var(--primary) 8%, var(--surface))',
            }}
          >
            Focus Flow
          </div>
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Where your completed work concentrated
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              Each month flows into the labels that absorbed your attention.
              Tasks with multiple labels are split evenly so the chart stays
              proportional.
            </p>
          </div>
        </div>

        {hasFlow && (
          <div className="flex flex-wrap gap-2">
            <div
              className="rounded-full border px-3 py-1.5 text-sm"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--surface-2)',
                color: 'var(--text-primary)',
              }}
            >
              {formatFlowValue(totalCompleted)} tasks
            </div>
            <div
              className="rounded-full border px-3 py-1.5 text-sm"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--surface-2)',
                color: 'var(--text-primary)',
              }}
            >
              {focusAreas.length} focus areas
            </div>
          </div>
        )}
      </div>

      {!hasFlow ? (
        <div
          className="mt-5 flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed px-6 text-center"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--surface-2)',
          }}
        >
          <div>
            <p
              className="text-base font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              No completed-task flow yet
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              Finish a few labeled tasks and this view will start tracing where
              your time went.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-5 h-[300px] sm:h-[340px] lg:h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <Sankey
                data={data}
                sort={false}
                align="justify"
                verticalAlign="top"
                linkCurvature={0.42}
                nodePadding={22}
                nodeWidth={12}
                margin={{ top: 6, right: 116, bottom: 6, left: 44 }}
                node={(props) => (
                  <FocusNodeRenderer
                    {...props}
                    colors={colors}
                    monthPalette={monthPalette}
                  />
                )}
                link={(props) => (
                  <FocusLinkRenderer
                    {...props}
                    colors={colors}
                    monthPalette={monthPalette}
                  />
                )}
              >
                <Tooltip
                  content={
                    <FocusTooltip colors={colors} monthPalette={monthPalette} />
                  }
                />
              </Sankey>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {focusAreas.map((node) => {
              const accent = getNodeAccent(node, colors, monthPalette)

              return (
                <div
                  key={node.id}
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs sm:text-sm"
                  style={{
                    borderColor: 'var(--border-color)',
                    backgroundColor: mixColor(accent, colors.surface2, 10),
                    color: 'var(--text-primary)',
                  }}
                >
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: accent }}
                  />
                  <span>{node.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {formatFlowValue(node.total)}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}
