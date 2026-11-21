import { NextResponse } from "next/server";
import { appwriteRequest, getPlatformSession, platformSessionCookieName } from "@/lib/platform-auth";

export const runtime = "nodejs";
export async function POST() {
  const session = await getPlatformSession();
  if (session) await appwriteRequest("/account/sessions/current", { method: "DELETE" }, session).catch(() => undefined);
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(platformSessionCookieName(), "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
