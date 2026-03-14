/**
 * Demo org from seed (Lone Star MGA). Used to auto-add new users to a default org.
 * Set DEMO_ORG_ID in env to override (e.g. for different environments).
 */
export const DEMO_ORG_ID =
  process.env.NEXT_PUBLIC_DEMO_ORG_ID ?? "8f54f0b2-1376-4273-b2d5-df6088018f5b";

export const SECOND_DEMO_ORG_ID =
  process.env.NEXT_PUBLIC_SECOND_DEMO_ORG_ID ?? "c4a4e6d4-9e2b-4b5f-9c3a-2d7b5e9c1f22";

/** Default role for new users when they get first org membership. */
export const DEFAULT_FIRST_ROLE = "ops_admin" as const;
