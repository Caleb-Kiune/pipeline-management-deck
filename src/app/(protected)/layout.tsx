import { ReactNode } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/features/auth/lib/auth";
import { redirect } from "next/navigation";
import { LogOutButton } from "@/features/auth/components/logout-button";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  const role = session.user.role as string;
  const isManagement = role === "MANAGEMENT" || role === "ADMIN";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <header className="border-b bg-white dark:bg-slate-800 sticky top-0 z-10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-8">
            <h1 className="font-bold text-xl text-primary hidden sm:block">CIC Platform</h1>
            <nav className="flex space-x-6">
              <Link href="/pipeline" className="text-sm font-medium hover:text-primary transition-colors">
                Pipeline
              </Link>
              {isManagement && (
                <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                  Dashboard
                </Link>
              )}
            </nav>
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
