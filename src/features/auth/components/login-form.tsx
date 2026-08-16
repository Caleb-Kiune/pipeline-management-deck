"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "../lib/auth-client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error } = await authClient.signIn.email({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setError(error.message || "Login failed");
    } else {
      const { data: session } = await authClient.getSession();
      setLoading(false);
      
      const role = (session?.user as { role?: string })?.role;
      if (role === "MANAGEMENT" || role === "ADMIN") {
        router.push("/dashboard");
      } else {
        router.push("/pipeline");
      }
      router.refresh();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>
        <p className="text-sm text-muted-foreground">Log in to your account</p>
      </div>
      <form onSubmit={handleLogin} className="space-y-4">
        {error && <div className="text-red-500 text-sm text-center font-medium">{error}</div>}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="m@example.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input 
            id="password" 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    </div>
  );
}
