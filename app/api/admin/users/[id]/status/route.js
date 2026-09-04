import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { requireAdmin } from "@/lib/auth";

// PATCH /api/admin/users/[id]/status - Deactivate or reactivate a standard user
export async function PATCH(request, context) {
  try {
    const params = await context.params;
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid user ID" },
        { status: 400 }
      );
    }

    const adminCheck = await requireAdmin(request);
    if (adminCheck.error) {
      return NextResponse.json(
        { message: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const currentAdmin = adminCheck.user;

    // Guard: Prevent admin from deactivating themselves
    if (currentAdmin._id.toString() === id) {
      return NextResponse.json(
        { message: "You cannot deactivate your own administrator account" },
        { status: 400 }
      );
    }

    await connectDB();

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Guard: Exclude or protect other admins
    if (targetUser.role === "admin") {
      return NextResponse.json(
        { message: "Administrator accounts cannot be deactivated via this endpoint" },
        { status: 403 }
      );
    }

    // Read optional explicit isActive boolean, or toggle
    let newStatus = !targetUser.isActive;
    try {
      const body = await request.json();
      if (typeof body.isActive === "boolean") {
        newStatus = body.isActive;
      }
    } catch {
      // If no JSON body, just toggled
    }

    targetUser.isActive = newStatus;
    await targetUser.save();

    return NextResponse.json({
      message: `User has been successfully ${newStatus ? "activated" : "deactivated"}`,
      user: {
        id: targetUser._id.toString(),
        name: targetUser.name,
        email: targetUser.email,
        isActive: targetUser.isActive,
      },
    });
  } catch (error) {
    console.error("PATCH /api/admin/users/[id]/status error:", error);
    return NextResponse.json(
      { message: "Failed to update user status" },
      { status: 500 }
    );
  }
}
