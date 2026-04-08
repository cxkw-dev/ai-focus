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
}))

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: new Proxy(
    {},
    {
      get: (_, tag: string) =>
        React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
          ({ children, ...props }, ref) =>
            React.createElement(tag, { ref, ...props }, children),
        ),
    },
  ),
}))

vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/hooks/use-vpn-status', () => ({
  useVpnStatus: () => mockUseVpnStatus(),
}))

vi.mock('@/hooks/use-ollama-status', () => ({
  useOllamaStatus: () => ({
    data: null,
    isLoading: true,
    refetch: vi.fn(),
    isFetching: false,
  }),
}))

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

    render(
      <Sidebar
        collapsed={false}
        onCollapse={() => {}}
      />,
    )

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

    render(
      <Sidebar
        collapsed={false}
        onCollapse={() => {}}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /timesheet/i }))

    await waitFor(() => {
      expect(mockRefetchVpn).toHaveBeenCalledTimes(1)
    })

    expect(openSpy).not.toHaveBeenCalled()
  })
})
