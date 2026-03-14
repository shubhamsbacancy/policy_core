import { z } from "zod";
import { apiOk, parseJsonBody, withZodError } from "@/lib/domain/http";
import { requireAuth, requireOrgAccess } from "@/lib/auth/api-auth";
import { ORG_COOKIE_NAME } from "@/lib/auth/org-cookie";

const SetOrgBodySchema = z.object({ org_id: z.string().uuid() });

/**
 * POST /api/v1/me/org — Set current org (for org switcher). Sets cookie and returns ok.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const body = await parseJsonBody(request, SetOrgBodySchema);
    const forbidden = await requireOrgAccess(auth.user.id, body.org_id);
    if (forbidden) return forbidden;

    const res = apiOk({ org_id: body.org_id });
    res.cookies.set(ORG_COOKIE_NAME, body.org_id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production"
    });
    return res;
  } catch (error) {
    return withZodError(error);
  }
}
