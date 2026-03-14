export function getActorUserId(request: Request): string | null {
  return request.headers.get("x-user-id");
}
