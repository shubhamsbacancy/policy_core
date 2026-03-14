import { NextResponse } from "next/server";
import { z } from "zod";

export async function parseJsonBody<T extends z.ZodTypeAny>(request: Request, schema: T): Promise<z.infer<T>> {
  const body = await request.json();
  return schema.parse(body);
}

export function apiOk(data: unknown, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error: { message, details: details ?? null }
    },
    { status }
  );
}

export function withZodError(error: unknown) {
  if (error instanceof z.ZodError) {
    return apiError("Validation failed.", 422, error.flatten());
  }
  return apiError(error instanceof Error ? error.message : "Unexpected error.", 500);
}
