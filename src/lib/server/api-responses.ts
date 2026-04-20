import { NextResponse } from 'next/server'
import { ZodError, ZodIssueCode } from 'zod'

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
  let body: unknown

  try {
    body = await request.json()
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ZodError([
        {
          code: ZodIssueCode.custom,
          path: [],
          message: 'Request body must be valid JSON',
        },
      ])
    }

    throw error
  }

  return schema.parse(body)
}
