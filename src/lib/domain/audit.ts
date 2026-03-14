export type AuditEvent = {
  id: string;
  org_id: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  created_at: string;
};

export function createAuditEvent(event: Omit<AuditEvent, "id" | "created_at">): AuditEvent {
  return {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    ...event
  };
}
