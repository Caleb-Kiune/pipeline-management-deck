import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-6">
      <div className="w-full max-w-md">
        <div className="border-t-4 border-primary rounded-lg bg-card p-8 shadow-[var(--shadow-card)]">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground tracking-wide">
          Insurance &middot; COO Platform
        </p>
      </div>
    </div>
  );
}
