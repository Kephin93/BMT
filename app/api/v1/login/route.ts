import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyPassword, signSession, hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      !password
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Query by username (make sure username is unique)
    const snap = await adminDb
      .collection("users")
      .where("username", "==", username.trim())
      .limit(1)
      .get();

    if (snap.empty) {
      // don’t reveal which part is wrong
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const doc = snap.docs[0];
    const user = doc.data() as { username: string; password: string };

    // user.password should be a bcrypt hash
    const ok = await verifyPassword(password, user.password);

    if (!ok) {
      return NextResponse.json(
        {
          error: "Invalid credentials",
        },
        { status: 401 },
      );
    }

    // Create a signed session payload
    const sessionToken = signSession({
      uid: doc.id,
      username: user.username,
      iat: Date.now(),
    });

    const cookieName = process.env.AUTH_COOKIE_NAME || "app_session";

    const res = NextResponse.json({
      user: { id: doc.id, username: user.username },
    });

    res.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      // set your preferred session duration:
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
