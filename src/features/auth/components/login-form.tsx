"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "../lib/auth-client";
import { PasswordInput } from "@/components/ui/password-input";
import { Loader2, AlertCircle } from "lucide-react";

import { checkUserStatus } from "../actions/auth.actions";

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

    try {
      const statusRes = await checkUserStatus(email);
      if (statusRes.success && statusRes.exists && !statusRes.isActive) {
        setError("Your account has been deactivated. Please contact management.");
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("Failed to check user status", err);
    }

    const { data, error } = await authClient.signIn.email({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      if (error.code === "USER_DEACTIVATED" || error.message?.toLowerCase().includes("deactivated")) {
        setError("Your account has been deactivated. Please contact management.");
      } else {
        setError(error.message || "Login failed");
      }
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
    <div className="w-full space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welcome Back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your account</p>
      </div>
      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="you@company.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput 
            id="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Authenticating...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>
    </div>
  );
}
