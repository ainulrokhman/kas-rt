import { NextRequest, NextResponse } from "next/server";
import { SystemRepository } from "@/lib/repositories/systemRepository";
import crypto from "crypto";

const PUBLIC_SESSION_COOKIE = "kas-rt-public-session";

/**
 * Server-side hashing for PIN
 */
function hashPin(pin: string): string {
  return crypto.createHash("sha256").update(pin).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();

    if (!pin || typeof pin !== "string") {
      return NextResponse.json(
        { message: "PIN diperlukan." },
        { status: 400 }
      );
    }

    const settings = await SystemRepository.getGlobalSetting();
    const hashedInput = hashPin(pin);

    if (hashedInput === settings.public_pin) {
      const response = NextResponse.json({ success: true });
      
      // Set cookie for 7 days
      response.cookies.set(PUBLIC_SESSION_COOKIE, "1", {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
        sameSite: "strict",
      });

      return response;
    } else {
      return NextResponse.json(
        { message: "PIN salah. Silakan coba lagi." },
        { status: 401 }
      );
    }
  } catch (error: unknown) {
    console.error("Public Auth Error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan internal." },
      { status: 500 }
    );
  }
}
