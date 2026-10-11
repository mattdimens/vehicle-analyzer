import type { NextRequest, NextResponse } from "next/server";

/**
 * First-party analytics session id (`vf_sid`), shared by /go and the vehicle
 * selector logger so their rows can be joined. httpOnly: the browser sends it
 * automatically but page scripts cannot read it. Disclosed in /privacy.
 */
const SESSION_COOKIE_NAME = "vf_sid";
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/** Returns the request's session id, or a fresh one (isNew = true) to set. */
export function resolveSessionId(req: NextRequest): { sessionId: string; isNew: boolean } {
  const existing = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (existing && /^[0-9a-f-]{36}$/i.test(existing)) {
    return { sessionId: existing, isNew: false };
  }
  return { sessionId: crypto.randomUUID(), isNew: true };
}

export function setSessionCookie(response: NextResponse, sessionId: string) {
  response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_COOKIE_MAX_AGE,
    path: "/",
  });
}
