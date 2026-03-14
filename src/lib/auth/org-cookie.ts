import { cookies } from "next/headers";

export const ORG_COOKIE_NAME = "policycore_org_id";

/**
 * Reads the current org id from the cookie (set by org switcher).
 * Use in server components and layout to scope data to the selected org.
 */
export async function getCurrentOrgIdFromCookie(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(ORG_COOKIE_NAME)?.value?.trim();
  return value && /^[0-9a-f-]{36}$/i.test(value) ? value : null;
}
