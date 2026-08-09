import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="p-8 border rounded-xl shadow-sm bg-white dark:bg-slate-800 w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}
