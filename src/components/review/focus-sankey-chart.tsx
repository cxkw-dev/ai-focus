'use client'

import {
  ResponsiveContainer,
  Sankey,
  Tooltip,
  type SankeyLinkProps,
  type SankeyNodeProps,
} from 'recharts'
import { Icon } from '@/components/ui/icon'
import { seriesColor, type ChartColors } from '@/hooks/use-chart-colors'
import { cssVars } from '@/lib/utils'
import type { FocusFlowData, FocusFlowNode } from '@/types/stats'
import { ChartTip } from './chart-tooltip'

interface FocusSankeyChartProps {
  data: FocusFlowData
  colors: ChartColors
}

/** Resolved colour per node id: labels take the series set in order, Other the chart's Other tone, months stay quiet. */
type Accents = Map<string, string>

interface FocusTooltipProps {
  active?: boolean
  payload?: Array<{ payload?: unknown }>
  accents: Accents
}

interface FocusNodeRendererProps extends SankeyNodeProps {
  accents: Accents
}

interface FocusLinkRendererProps extends SankeyLinkProps {
  accents: Accents
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

function buildAccents(nodes: FocusFlowNode[], colors: ChartColors): Accents {
  const accents: Accents = new Map()
  let series = 0
  for (const node of nodes) {
    // A label keeps the colour the user gave it, so AMEX is the same colour here as in the side nav and on chips.
    if (node.kind === 'label')
      accents.set(node.id, node.labelColor ?? seriesColor(colors, series++))
    else if (node.kind === 'other') accents.set(node.id, colors.other)
    else if (node.kind === 'unlabeled') accents.set(node.id, colors.textMuted)
    else accents.set(node.id, colors.textQuiet)
  }
  return accents
}

function isFocusNode(value: unknown): value is FocusFlowNode {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'id' in value &&
    'kind' in value &&
    'name' in value,
  )
}

function isFocusLink(value: unknown): value is {
  source: FocusFlowNode
  target: FocusFlowNode
  value: number
} {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'source' in value &&
    'target' in value &&
    isFocusNode(value.source) &&
    isFocusNode(value.target),
  )
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

function FocusTooltip({ active, payload, accents }: FocusTooltipProps) {
  if (!active || !payload?.length) return null

  const rawPayload = unwrapTooltipPayload(payload[0].payload)

  if (isFocusLink(rawPayload)) {
    return (
      <ChartTip
        title={`${rawPayload.source.name} → ${rawPayload.target.name}`}
        rows={[
          {
            label: 'Completed tasks',
            value: formatFlowValue(rawPayload.value),
            color: accents.get(rawPayload.target.id),
          },
        ]}
      />
    )
  }

  if (!isFocusNode(rawPayload)) return null

  return (
    <ChartTip
      title={rawPayload.name}
      rows={[
        {
          label: 'Completed tasks',
          value: formatFlowValue(rawPayload.total),
          color: accents.get(rawPayload.id),
        },
      ]}
    />
  )
}

// Month labels sit left of the month nodes in mono; focus-area names sit right of theirs, in the text colour.
function FocusNodeRenderer({
  x,
  y,
  width,
  height,
  payload,
  accents,
}: FocusNodeRendererProps) {
  if (!isFocusNode(payload)) return null

  const isMonthNode = payload.kind === 'month'
  const label = trimLabel(
    payload.shortLabel || payload.name,
    isMonthNode ? 6 : 18,
  )

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={Math.max(height, 1)}
        rx={2}
        fill={accents.get(payload.id)}
      />
      <text
        x={isMonthNode ? x - 6 : x + width + 6}
        y={y + height / 2}
        textAnchor={isMonthNode ? 'end' : 'start'}
        dominantBaseline="middle"
        className={
          isMonthNode
            ? 'fill-muted font-mono text-xs'
            : 'fill-text text-xs font-semibold'
        }
      >
        {label}
      </text>
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
  accents,
}: FocusLinkRendererProps) {
  const target = payload.target
  const stroke = isFocusNode(target) ? accents.get(target.id) : undefined

  return (
    <path
      d={`M${sourceX},${sourceY}C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
      fill="none"
      stroke={stroke}
      strokeOpacity={0.3}
      strokeWidth={Math.max(linkWidth, 1)}
      strokeLinecap="butt"
      className="transition-[stroke-opacity] hover:[stroke-opacity:0.55]"
    />
  )
}

export function FocusSankeyChart({ data, colors }: FocusSankeyChartProps) {
  const accents = buildAccents(data.nodes, colors)
  const hasFlow = data.links.length > 0
  const totalCompleted = data.nodes
    .filter((node) => node.kind === 'month')
    .reduce((total, node) => total + node.total, 0)
  const focusAreas = data.nodes.filter((node) => node.kind !== 'month')

  return (
    <section
      aria-labelledby="review-focus-title"
      className="flex h-full min-w-0 flex-col"
    >
      <header className="dd-table-header">
        <h2 className="dd-table-header__title" id="review-focus-title">
          focus flow
        </h2>
      </header>

      <figure className="dd-chart flex-1 [--dd-chart-height:300px]">
        <figcaption className="dd-chart__head">
          <div className="max-w-prose min-w-0">
            <p className="dd-chart__title">
              Where your completed work concentrated
            </p>
            <p className="dd-chart__sub">
              Each month flows into the labels that absorbed your attention.
              Tasks with multiple labels are split evenly so the chart stays
              proportional.
            </p>
          </div>
          {hasFlow && (
            <div className="dd-stat-inline-group">
              <p className="dd-stat dd-stat--inline">
                <span className="dd-stat__label">Tasks</span>
                <span className="dd-stat__value">
                  {formatFlowValue(totalCompleted)}
                </span>
              </p>
              <p className="dd-stat dd-stat--inline">
                <span className="dd-stat__label">Focus areas</span>
                <span className="dd-stat__value">{focusAreas.length}</span>
              </p>
            </div>
          )}
        </figcaption>

        {!hasFlow ? (
          <div className="dd-chart__frame">
            <div className="dd-chart__plot is-empty">
              <div className="dd-chart__empty">
                <Icon name="chart" />
                <b>No completed-task flow yet</b>
                <span>
                  Finish a few labeled tasks and this view will start tracing
                  where your time went.
                </span>
              </div>
            </div>
          </div>
        ) : (
          <>
            <ul className="dd-chart__legend">
              {focusAreas.map((node) => (
                <li
                  key={node.id}
                  className="dd-chart__key"
                  style={cssVars({
                    '--dd-series': accents.get(node.id) ?? colors.other,
                  })}
                >
                  {node.name}
                  <span className="dd-chart__key-value pl-1.5">
                    {formatFlowValue(node.total)}
                  </span>
                </li>
              ))}
            </ul>

            {/* Fills the card, so the plot grows to match the pace story beside it; absolute so it never sizes it. */}
            <div
              className="relative min-h-64 flex-1 sm:min-h-72"
              role="img"
              aria-label={`Completed tasks flowing from each month into ${focusAreas.length} focus areas`}
            >
              <div className="absolute inset-0">
                <ResponsiveContainer width="100%" height="100%">
                  <Sankey
                    data={data}
                    sort={false}
                    align="justify"
                    verticalAlign="top"
                    linkCurvature={0.42}
                    nodePadding={22}
                    nodeWidth={10}
                    margin={{ top: 6, right: 124, bottom: 6, left: 32 }}
                    node={(props) => (
                      <FocusNodeRenderer {...props} accents={accents} />
                    )}
                    link={(props) => (
                      <FocusLinkRenderer {...props} accents={accents} />
                    )}
                  >
                    <Tooltip content={<FocusTooltip accents={accents} />} />
                  </Sankey>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </figure>
    </section>
  )
}
