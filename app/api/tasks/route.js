import { NextResponse } from "next/server";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import { requireAuth } from "@/lib/auth";

const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title cannot exceed 200 characters"),
  description: z.string().optional().default(""),
  status: z
    .enum(["pending", "in-progress", "completed"])
    .optional()
    .default("pending"),
  priority: z
    .enum(["low", "medium", "high"])
    .optional()
    .default("medium"),
  dueDate: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val ? new Date(val) : null)),
});

// GET /api/tasks - Retrieve all tasks for the logged in user with filtering & search
export async function GET(request) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) {
      const response = NextResponse.json(
        { message: authResult.error },
        { status: authResult.status }
      );
      if (authResult.status === 401 || authResult.status === 403) {
        response.cookies.set("token", "", {
          httpOnly: true,
          expires: new Date(0),
          path: "/",
        });
      }
      return response;
    }

    const { user } = authResult;
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");

    // Strictly enforce ownership to authenticated user
    const query = { user: user._id };

    if (status && ["pending", "in-progress", "completed"].includes(status)) {
      query.status = status;
    }

    if (priority && ["low", "medium", "high"].includes(priority)) {
      query.priority = priority;
    }

    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json(
      { message: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create task for authenticated user
export async function POST(request) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) {
      const response = NextResponse.json(
        { message: authResult.error },
        { status: authResult.status }
      );
      if (authResult.status === 401 || authResult.status === 403) {
        response.cookies.set("token", "", {
          httpOnly: true,
          expires: new Date(0),
          path: "/",
        });
      }
      return response;
    }

    const { user } = authResult;
    const body = await request.json();

    const result = createTaskSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: result.error.issues[0].message },
        { status: 400 }
      );
    }

    await connectDB();

    // Enforce user ownership directly from session
    const task = await Task.create({
      ...result.data,
      user: user._id,
    });

    return NextResponse.json(
      {
        message: "Task created successfully",
        task,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json(
      { message: "Failed to create task" },
      { status: 500 }
    );
  }
}
