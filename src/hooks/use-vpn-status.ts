import { useQuery } from '@tanstack/react-query'

export function useVpnStatus() {
  return useQuery({
    queryKey: ['vpn-status'],
    queryFn: async () => {
      const res = await fetch('/api/vpn-status')
      const data = await res.json()
      return data.connected as boolean
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}
