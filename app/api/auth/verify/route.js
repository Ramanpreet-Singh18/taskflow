import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import VerificationCode from "@/models/VerificationCode";

const verifySchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  code: z
    .string()
    .length(6, "Verification code must be 6 digits")
    .regex(/^\d+$/, "Verification code must contain digits only"),
});

export async function POST(request) {
  try {
    const body = await request.json();

    // 1. Validate payload
    const result = verifySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const email = result.data.email.toLowerCase().trim();
    const { code } = result.data;

    // 2. Connect DB
    await connectDB();

    // 3. Find verification record
    const verification = await VerificationCode.findOne({ email });

    if (!verification) {
      return NextResponse.json(
        { message: "Verification code expired or not found. Please register again." },
        { status: 400 }
      );
    }

    // 4. Check expiration
    if (verification.expiresAt < new Date()) {
      await VerificationCode.deleteOne({ _id: verification._id });
      return NextResponse.json(
        { message: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // 5. Check failed attempt limits (Max 5 attempts)
    if (verification.attempts >= 5) {
      await VerificationCode.deleteOne({ _id: verification._id });
      return NextResponse.json(
        {
          message:
            "Too many incorrect attempts. This code has been invalidated. Please register again.",
        },
        { status: 429 }
      );
    }

    // 6. Compare OTP code
    const isCodeValid = await bcrypt.compare(code, verification.code);

    if (!isCodeValid) {
      verification.attempts = (verification.attempts || 0) + 1;
      await verification.save();

      const remainingAttempts = 5 - verification.attempts;
      return NextResponse.json(
        {
          message: `Invalid verification code. ${remainingAttempts} attempt${
            remainingAttempts === 1 ? "" : "s"
          } remaining.`,
        },
        { status: 400 }
      );
    }

    // 7. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      await VerificationCode.deleteOne({ _id: verification._id });
      return NextResponse.json(
        { message: "Account already exists with this email. Please sign in." },
        { status: 409 }
      );
    }

    // 8. Create verified user with default user role and active status
    const newUser = await User.create({
      name: verification.name,
      email: verification.email,
      password: verification.password,
      role: "user",
      isActive: true,
      isVerified: true,
    });

    // 9. Remove used verification record
    await VerificationCode.deleteOne({ _id: verification._id });

    return NextResponse.json(
      {
        message: "Email verified successfully! You can now log in.",
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { message: "An error occurred during verification" },
      { status: 500 }
    );
  }
}