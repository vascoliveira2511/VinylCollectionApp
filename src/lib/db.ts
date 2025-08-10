import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();
export const db = prisma;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function verifyAuth(request: NextRequest) {
  try {
    // Get the user session from cookies or headers
    const userId = request.cookies.get("user-id")?.value;
    
    if (!userId) {
      return null;
    }

    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    return user;
  } catch (error) {
    console.error("Auth verification error:", error);
    return null;
  }
}
