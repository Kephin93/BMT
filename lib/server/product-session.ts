import { verifySession } from "@/lib/auth";

export function hasProductWriteSession(token: string | undefined) {
  try {
    const session = token ? verifySession(token) : null;
    return !!session && typeof session.uid === "string" && !!session.uid
      && typeof session.iat === "number" && Number.isFinite(session.iat)
      && session.iat <= Date.now() && Date.now() - session.iat < 7 * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}
