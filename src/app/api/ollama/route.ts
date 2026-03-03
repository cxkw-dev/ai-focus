import { NextResponse } from 'next/server'

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral:7b'

export async function GET() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    })

    if (!res.ok) {
      return NextResponse.json({ connected: false, model: OLLAMA_MODEL, url: OLLAMA_URL })
    }

    const data = (await res.json()) as { models?: { name: string }[] }
    const modelLoaded = data.models?.some((m) => m.name.startsWith(OLLAMA_MODEL.split(':')[0])) ?? false

    return NextResponse.json({
      connected: true,
      model: OLLAMA_MODEL,
      url: OLLAMA_URL,
      modelLoaded,
    })
  } catch {
    return NextResponse.json({ connected: false, model: OLLAMA_MODEL, url: OLLAMA_URL })
  }
}
