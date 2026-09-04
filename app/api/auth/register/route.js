import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import VerificationCode from "@/models/VerificationCode";
import transporter from "@/lib/mailer";

const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password is too long"),
});

export async function POST(request) {
  try {
    const body = await request.json();

    // 1. Validate
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, password } = result.data;
    const email = result.data.email.toLowerCase().trim();

    // 2. Connect DB
    await connectDB();

    // 3. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // 4. Rate-limiting check: Prevent spamming registrations within 45 seconds
    const existingCode = await VerificationCode.findOne({ email });
    if (existingCode) {
      const timeSinceCreation = Date.now() - new Date(existingCode.createdAt).getTime();
      if (timeSinceCreation < 45 * 1000) {
        const remainingSeconds = Math.ceil((45 * 1000 - timeSinceCreation) / 1000);
        return NextResponse.json(
          {
            message: `Please wait ${remainingSeconds} seconds before requesting another code`,
          },
          { status: 429 }
        );
      }
    }

    // 5. Generate secure 6 digit code
    const code = crypto.randomInt(100000, 1000000).toString();

    // 6. Hash password & code
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedCode = await bcrypt.hash(code, 10);

    // 7. Clear any existing verification code for this email
    await VerificationCode.deleteMany({ email });

    // 8. Store temporary registration with 10-minute expiry and zero attempts
    await VerificationCode.create({
      name,
      email,
      password: hashedPassword,
      code: hashedCode,
      attempts: 0,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    // 9. Send email with dev fallback
    let emailSent = false;
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail({
          from: `"TaskFlow Auth" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "Your TaskFlow Verification Code",
          text: `Your verification code is ${code}. It expires in 10 minutes.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
              <h2 style="color: #0f172a; margin-bottom: 8px;">Verify Your Email</h2>
              <p style="color: #475569; font-size: 15px; margin-bottom: 24px;">Hello <strong>${name}</strong>, thank you for registering with TaskFlow. Use the code below to complete your verification:</p>
              <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
                <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #2563eb;">${code}</span>
              </div>
              <p style="color: #64748b; font-size: 13px; margin: 0;">This code will expire in <strong>10 minutes</strong>. If you did not request this, you can safely ignore this email.</p>
            </div>
          `,
        });
        emailSent = true;
      }
    } catch (emailError) {
      console.error("Nodemailer error:", emailError?.message || emailError);
    }

    // 10. Development log fallback
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n========================================`);
      console.log(`[DEV OTP] Code for ${email}: ${code}`);
      console.log(`========================================\n`);
    }

    // If production and email failed completely
    if (!emailSent && process.env.NODE_ENV === "production") {
      await VerificationCode.deleteMany({ email });
      return NextResponse.json(
        { message: "Could not send verification email. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Verification code sent to your email",
        email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Internal server error during registration" },
      { status: 500 }
    );
  }
}