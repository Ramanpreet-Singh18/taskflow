import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function GET(request) {
  try {
    const authResult = await requireAuth(request);

    if (authResult.error) {
      const response = NextResponse.json(
        { message: authResult.error },
        { status: authResult.status }
      );

      // If user was deactivated or not found, clear the stale cookie
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

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { message: "Failed to verify session" },
      { status: 500 }
    );
  }
}