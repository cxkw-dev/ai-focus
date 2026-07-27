import * as React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Sidebar } from '@/components/layout/sidebar'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockUseVpnStatus = vi.fn()
const mockRefetchVpn = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => '/todos',
}))

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useLinkStatus: () => ({ pending: false }),
}))

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line jsx-a11y/alt-text -- test stub forwards alt prop via spread
    <img {...props} />
  ),
}))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  motion: new Proxy(
    {},
    {
      get: (_, tag: string) => {
        const Forwarded = React.forwardRef<
          HTMLElement,
          React.HTMLAttributes<HTMLElement>
        >(({ children, ...props }, ref) =>
          React.createElement(tag, { ref, ...props }, children),
        )
        Forwarded.displayName = `motion.${tag}`
        return Forwarded
      },
    },
  ),
}))

vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}))

vi.mock('@/hooks/use-vpn-status', () => ({
  useVpnStatus: () => mockUseVpnStatus(),
}))

vi.mock('@/hooks/use-project-nav', () => ({
  useProjectNav: () => ({
    projects: [
      {
        id: 'project-1',
        name: 'KAF',
        color: '#22c55e',
        billingCodes: [],
        archived: false,
        archivedAt: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        openCount: 3,
      },
    ],
    unassignedCount: 1,
    isLoading: false,
  }),
}))

vi.mock('@/hooks/use-local-ai-status', () => ({
  useLocalAiStatus: () => ({
    data: null,
    isLoading: true,
    refetch: vi.fn(),
    isFetching: false,
  }),
}))

describe('Sidebar projects', () => {
  beforeEach(() => {
    mockUseVpnStatus.mockReturnValue({
      data: true,
      isLoading: false,
      refetch: mockRefetchVpn,
    })
  })

  it('lists each project as a board link with its open count', () => {
    render(<Sidebar collapsed={false} onCollapse={() => {}} />)

    const projectLink = screen.getByRole('link', { name: /KAF/ })
    expect(projectLink).toHaveAttribute('href', '/projects/project-1')
    expect(projectLink).toHaveTextContent('3')
  })

  it('links the section header to the projects index', () => {
    render(<Sidebar collapsed={false} onCollapse={() => {}} />)

    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute(
      'href',
      '/projects',
    )
  })
})

describe('Sidebar timesheet link', () => {
  const openSpy = vi.spyOn(window, 'open')

  beforeEach(() => {
    mockRefetchVpn.mockReset()
    mockUseVpnStatus.mockReturnValue({
      data: false,
      isLoading: false,
      refetch: mockRefetchVpn,
    })
    openSpy.mockReset()
    openSpy.mockImplementation(() => null)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('re-checks VPN before opening the timesheet when the last known status is disconnected', async () => {
    mockRefetchVpn.mockResolvedValue({ data: true })

    render(<Sidebar collapsed={false} onCollapse={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: /timesheet/i }))

    await waitFor(() => {
      expect(mockRefetchVpn).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(openSpy).toHaveBeenCalledWith(
        'https://s4hprd.sap.kyndryl.net/sap/bc/gui/sap/its/webgui#',
        '_blank',
        'noopener,noreferrer',
      )
    })
  })

  it('keeps the timesheet closed when the VPN re-check still fails', async () => {
    mockRefetchVpn.mockResolvedValue({ data: false })

    render(<Sidebar collapsed={false} onCollapse={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: /timesheet/i }))

    await waitFor(() => {
      expect(mockRefetchVpn).toHaveBeenCalledTimes(1)
    })

    expect(openSpy).not.toHaveBeenCalled()
  })
})
