import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function extractToken(request) {
  // 1. Check HTTP-only cookie
  const cookieToken = request.cookies?.get("token")?.value;
  if (cookieToken) return cookieToken;

  // 2. Check Authorization header (Bearer token)
  const authHeader = request.headers?.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return null;
}

export async function getAuthenticatedUser(request) {
  const token = extractToken(request);
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) return null;

  await connectDB();
  const user = await User.findById(decoded.userId).select("-password");

  if (!user || user.isActive === false) {
    return null;
  }

  return user;
}

export async function requireAuth(request) {
  const token = extractToken(request);
  if (!token) {
    return { error: "Authentication required", status: 401 };
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) {
    return { error: "Invalid or expired session", status: 401 };
  }

  await connectDB();
  const user = await User.findById(decoded.userId).select("-password");

  if (!user) {
    return { error: "User account no longer exists", status: 401 };
  }

  if (user.isActive === false) {
    return {
      error: "Your account has been deactivated. Please contact an administrator.",
      status: 403,
    };
  }

  return { user };
}

export async function requireAdmin(request) {
  const authResult = await requireAuth(request);
  if (authResult.error) {
    return authResult;
  }

  if (authResult.user.role !== "admin") {
    return { error: "Forbidden: Admin privileges required", status: 403 };
  }

  return { user: authResult.user };
}