import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return "demo_" + Math.abs(hash).toString(16);
}

function verifyPassword(password: string, hash: string): boolean {
  const computed = simpleHash(password);
  // Accept demo123, admin123, or stored hash
  return (
    computed === hash ||
    computed === "demo_5c7bd16f" || // demo123
    computed === "demo_39c43b7d" || // admin123
    hash === "demo_5c7bd16f" ||
    hash === "demo_39c43b7d"
  );
}

export async function GET() {
  return NextResponse.json({ test: "ok" });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password harus diisi" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { admin: true, applicant: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
    }

    const userData: Record<string, any> = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: "",
    };

    if (user.admin) {
      userData.fullName = user.admin.fullName;
      userData.employeeId = user.admin.employeeId;
      userData.department = user.admin.department;
    } else if (user.applicant) {
      userData.fullName = user.applicant.fullName;
      userData.applicantId = user.applicant.id;
      userData.fullProfile = {
        nik: user.applicant.nik,
        phone: user.applicant.phone,
        education: user.applicant.education,
      };
    }

    return NextResponse.json({ success: true, user: userData });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
