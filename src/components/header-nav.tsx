"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

function NavLink({ href, children, className }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={cn(
        "relative text-sm font-medium transition-colors py-5",
        isActive
          ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {children}
    </Link>
  );
}

interface HeaderNavProps {
  isManagement: boolean;
}

export function HeaderNav({ isManagement }: HeaderNavProps) {
  return (
    <nav className="flex items-center space-x-6">
      {!isManagement && (
        <NavLink href="/pipeline">Pipeline</NavLink>
      )}
      {isManagement && (
        <>
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/dashboard/settings">Settings</NavLink>
        </>
      )}
    </nav>
  );
}
