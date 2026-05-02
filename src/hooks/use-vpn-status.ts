import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'

export function useVpnStatus() {
  return useQuery({
    queryKey: queryKeys.vpnStatus,
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
