import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init)
}

export function created<T>(data: T) {
  return ok(data, { status: 201 })
}

export function jsonError(error: string, status: number, details?: unknown) {
  return NextResponse.json(
    details === undefined ? { error } : { error, details },
    { status },
  )
}

export function badRequest(error: string, details?: unknown) {
  return jsonError(error, 400, details)
}

export function notFound(error: string) {
  return jsonError(error, 404)
}

export function conflict(error: string) {
  return jsonError(error, 409)
}

export function validationError(error: ZodError) {
  return badRequest('Validation failed', error.issues)
}

export function internalError(
  userMessage: string,
  error: unknown,
  context: string,
) {
  console.error(`${context}:`, error)
  return jsonError(userMessage, 500)
}

export async function parseJsonBody<T>(
  request: Request,
  schema: { parse(data: unknown): T },
): Promise<T> {
  const body = await request.json()
  return schema.parse(body)
}
