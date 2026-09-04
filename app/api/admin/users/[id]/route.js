import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Task from "@/models/Task";
import { requireAdmin } from "@/lib/auth";

// DELETE /api/admin/users/[id] - Permanently delete user and cascade delete their tasks
export async function DELETE(request, context) {
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

    // Guard: Prevent admin from deleting themselves
    if (currentAdmin._id.toString() === id) {
      return NextResponse.json(
        { message: "You cannot delete your own administrator account" },
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

    // Guard: Prevent deleting administrator accounts
    if (targetUser.role === "admin") {
      return NextResponse.json(
        { message: "Administrator accounts cannot be deleted through this interface" },
        { status: 403 }
      );
    }

    // Cascade delete: First delete all associated tasks
    const deletedTasksResult = await Task.deleteMany({ user: id });

    // Then delete the user record
    await User.findByIdAndDelete(id);

    return NextResponse.json({
      message: `User ${targetUser.name} and ${deletedTasksResult.deletedCount} associated task(s) were permanently deleted`,
    });
  } catch (error) {
    console.error("DELETE /api/admin/users/[id] error:", error);
    return NextResponse.json(
      { message: "Failed to delete user and associated tasks" },
      { status: 500 }
    );
  }
}
