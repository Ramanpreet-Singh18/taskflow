import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Task from "@/models/Task";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/users - List standard users (excluding admins) and dashboard stats
export async function GET(request) {
  try {
    const adminCheck = await requireAdmin(request);
    if (adminCheck.error) {
      return NextResponse.json(
        { message: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";

    // Query exclusively standard users (role: 'user')
    const query = { role: "user" };

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    // Fetch task counts per user in parallel
    const userIds = users.map((u) => u._id);
    const taskCounts = await Task.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: "$user", count: { $sum: 1 } } },
    ]);

    const taskCountMap = {};
    taskCounts.forEach((item) => {
      taskCountMap[item._id.toString()] = item.count;
    });

    const usersWithStats = users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      isVerified: u.isVerified,
      createdAt: u.createdAt,
      taskCount: taskCountMap[u._id.toString()] || 0,
    }));

    // General admin dashboard metrics
    const totalUsers = await User.countDocuments({ role: "user" });
    const activeUsers = await User.countDocuments({ role: "user", isActive: true });
    const deactivatedUsers = await User.countDocuments({
      role: "user",
      isActive: false,
    });
    const totalTasks = await Task.countDocuments();

    return NextResponse.json({
      users: usersWithStats,
      stats: {
        totalUsers,
        activeUsers,
        deactivatedUsers,
        totalTasks,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json(
      { message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
