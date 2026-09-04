import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import { requireAuth } from "@/lib/auth";

const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title cannot exceed 200 characters")
    .optional(),
  description: z.string().optional(),
  status: z.enum(["pending", "in-progress", "completed"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val ? new Date(val) : null)),
});

function handleAuthError(authResult) {
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

// GET /api/tasks/[id]
export async function GET(request, context) {
  try {
    const params = await context.params;
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid task ID" },
        { status: 400 }
      );
    }

    const authResult = await requireAuth(request);
    if (authResult.error) {
      return handleAuthError(authResult);
    }

    const { user } = authResult;
    await connectDB();

    const task = await Task.findOne({ _id: id, user: user._id });
    if (!task) {
      return NextResponse.json(
        { message: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("GET /api/tasks/[id] error:", error);
    return NextResponse.json(
      { message: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

// PUT / PATCH /api/tasks/[id]
export async function PATCH(request, context) {
  try {
    const params = await context.params;
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid task ID" },
        { status: 400 }
      );
    }

    const authResult = await requireAuth(request);
    if (authResult.error) {
      return handleAuthError(authResult);
    }

    const { user } = authResult;
    const body = await request.json();

    const result = updateTaskSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: result.error.issues[0].message },
        { status: 400 }
      );
    }

    await connectDB();

    const task = await Task.findOne({ _id: id, user: user._id });
    if (!task) {
      return NextResponse.json(
        { message: "Task not found" },
        { status: 404 }
      );
    }

    // Apply updates
    if (result.data.title !== undefined) task.title = result.data.title;
    if (result.data.description !== undefined) task.description = result.data.description;
    if (result.data.status !== undefined) task.status = result.data.status;
    if (result.data.priority !== undefined) task.priority = result.data.priority;
    if (result.data.dueDate !== undefined) task.dueDate = result.data.dueDate;

    await task.save();

    return NextResponse.json({
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    console.error("PATCH /api/tasks/[id] error:", error);
    return NextResponse.json(
      { message: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function PUT(request, context) {
  return PATCH(request, context);
}

// DELETE /api/tasks/[id]
export async function DELETE(request, context) {
  try {
    const params = await context.params;
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid task ID" },
        { status: 400 }
      );
    }

    const authResult = await requireAuth(request);
    if (authResult.error) {
      return handleAuthError(authResult);
    }

    const { user } = authResult;
    await connectDB();

    const deleted = await Task.findOneAndDelete({ _id: id, user: user._id });
    if (!deleted) {
      return NextResponse.json(
        { message: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/tasks/[id] error:", error);
    return NextResponse.json(
      { message: "Failed to delete task" },
      { status: 500 }
    );
  }
}
