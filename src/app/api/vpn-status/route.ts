export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)

    const response = await fetch('https://s4hprd.sap.kyndryl.net', {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    })

    clearTimeout(timeout)
    return Response.json({ connected: response.ok || response.status < 500 })
  } catch {
    return Response.json({ connected: false })
  }
}
