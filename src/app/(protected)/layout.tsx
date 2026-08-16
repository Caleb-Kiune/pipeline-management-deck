import { ReactNode } from "react";
import { headers } from "next/headers";
import { auth } from "@/features/auth/lib/auth";
import { redirect } from "next/navigation";
import { LogOutButton } from "@/features/auth/components/logout-button";
import { HeaderNav } from "@/components/header-nav";
import { prisma } from "@/lib/db";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  // Database lookup to enforce deactivation instantly
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!dbUser || (dbUser as any).isActive === false) {
    await prisma.session.deleteMany({ where: { userId: session.user.id } });
    redirect("/");
  }

  const role = session.user.role as string;
  const isManagement = role === "MANAGEMENT" || role === "ADMIN";

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <header className="border-b border-border bg-card sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="container max-w-6xl mx-auto flex h-16 items-center justify-between px-6 lg:px-8">
          <div className="flex items-center space-x-8">
            <span className="font-semibold text-lg tracking-tight text-foreground">
              COO Platform
            </span>
            <div className="h-5 w-px bg-border" />
            <HeaderNav isManagement={isManagement} />
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">
              {session.user.name}
            </span>
            <LogOutButton />
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
