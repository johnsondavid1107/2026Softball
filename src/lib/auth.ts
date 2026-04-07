import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const COOKIE_NAME = "admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/** Verify a raw password against the env var. */
export function verifyPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return password === expected;
}

/** Set the admin session cookie on a response. */
export function setSessionCookie(res: Response): void {
  // We build the Set-Cookie header manually so this works without next/server
  // Response helpers.
  res.headers.append(
    "Set-Cookie",
    `${COOKIE_NAME}=1; HttpOnly; SameSite=Lax; Path=/; Max-Age=${COOKIE_MAX_AGE}${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`
  );
}

/** Clear the admin session cookie. */
export function clearSessionCookie(res: Response): void {
  res.headers.append(
    "Set-Cookie",
    `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
  );
}

/** Check if the incoming API request carries a valid session cookie. */
export function isAuthenticated(req: NextRequest): boolean {
  return req.cookies.get(COOKIE_NAME)?.value === "1";
}

/** Server-component version: check cookies() from next/headers. */
export async function isAuthenticatedServer(): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === "1";
}
