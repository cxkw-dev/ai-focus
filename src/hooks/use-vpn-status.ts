import { useQuery } from '@tanstack/react-query'

export function useVpnStatus() {
  return useQuery({
    queryKey: ['vpn-status'],
    queryFn: async () => {
      const res = await fetch('/api/vpn-status')
      const data = await res.json()
      return data.connected as boolean
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}
