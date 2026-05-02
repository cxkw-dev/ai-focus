import { NextResponse } from 'next/server'
import { getLocalAiStatus } from '@/lib/local-ai'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await getLocalAiStatus())
}
