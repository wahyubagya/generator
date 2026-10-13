import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { hashPassword, signToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { ok: false, error: "Nama, email, dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    if (password.length < 6) {
      return NextResponse.json(
        { ok: false, error: "Kata sandi minimal 6 karakter." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Alamat email sudah terdaftar. Silakan masuk." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const newUser = await db.user.create({
      data: {
        name: String(name).trim(),
        email: cleanEmail,
        passwordHash,
        role: "CUSTOMER",
      },
    });

    const sessionPayload = {
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role as "CUSTOMER" | "ADMIN",
    };

    const token = signToken(sessionPayload);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return NextResponse.json({
      ok: true,
      user: sessionPayload,
      message: "Pendaftaran berhasil!",
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { ok: false, error: "Terjadi kesalahan server saat mendaftar." },
      { status: 500 }
    );
  }
}
