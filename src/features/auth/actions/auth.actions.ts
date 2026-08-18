"use server";

import { prisma } from "@/lib/db";

export async function checkUserStatus(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: true, exists: false };
    }

    return { success: true, exists: true, isActive: user.isActive };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to check user status" };
  }
}
