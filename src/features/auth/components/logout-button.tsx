"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "../lib/auth-client";
import { useRouter } from "next/navigation";

export function LogOutButton() {
  const router = useRouter();
  
  return (
    <Button variant="outline" size="sm" onClick={async () => {
      await authClient.signOut();
      router.push("/");
      router.refresh();
    }}>
      Logout
    </Button>
  );
}
