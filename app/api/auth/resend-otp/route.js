import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import VerificationCode from "@/models/VerificationCode";
import transporter from "@/lib/mailer";

const resendSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const result = resendSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const email = result.data.email.toLowerCase().trim();

    await connectDB();

    // Check if user is already verified and registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "Account is already verified. Please sign in." },
        { status: 400 }
      );
    }

    // Check if a verification record exists
    const record = await VerificationCode.findOne({ email });
    if (!record) {
      return NextResponse.json(
        { message: "No pending registration found. Please register again." },
        { status: 404 }
      );
    }

    // Rate-limiting check: 45-second cooldown
    const timeSinceUpdate = Date.now() - new Date(record.updatedAt).getTime();
    if (timeSinceUpdate < 45 * 1000) {
      const remainingSeconds = Math.ceil((45 * 1000 - timeSinceUpdate) / 1000);
      return NextResponse.json(
        {
          message: `Please wait ${remainingSeconds} seconds before requesting a new code`,
        },
        { status: 429 }
      );
    }

    // Generate new code & hash it
    const newCode = crypto.randomInt(100000, 1000000).toString();
    const hashedCode = await bcrypt.hash(newCode, 10);

    // Update the record
    record.code = hashedCode;
    record.attempts = 0;
    record.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await record.save();

    // Send email
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail({
          from: `"TaskFlow Auth" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "Your New TaskFlow Verification Code",
          text: `Your new verification code is ${newCode}. It expires in 10 minutes.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
              <h2 style="color: #0f172a; margin-bottom: 8px;">New Verification Code</h2>
              <p style="color: #475569; font-size: 15px; margin-bottom: 24px;">Here is your newly requested verification code:</p>
              <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
                <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #2563eb;">${newCode}</span>
              </div>
              <p style="color: #64748b; font-size: 13px; margin: 0;">Expires in <strong>10 minutes</strong>.</p>
            </div>
          `,
        });
      }
    } catch (mailErr) {
      console.error("Resend OTP mail error:", mailErr?.message || mailErr);
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(`\n========================================`);
      console.log(`[DEV OTP RESEND] Code for ${email}: ${newCode}`);
      console.log(`========================================\n`);
    }

    return NextResponse.json(
      { message: "A new verification code has been sent" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend OTP error:", error);
    return NextResponse.json(
      { message: "Could not resend verification code" },
      { status: 500 }
    );
  }
}
