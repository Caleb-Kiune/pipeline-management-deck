import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { RegisterCooForm } from "./components/register-coo-form";
import { SetTargetForm } from "./components/set-target-form";
import { prisma } from "@/lib/db";

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Role Protection
  if (!session || session.user.role !== "MANAGEMENT") {
    redirect("/dashboard");
  }

  // Fetch prerequisites for dropdowns
  const branches = await prisma.branch.findMany();
  const coos = await prisma.user.findMany({
    where: { role: "COO" }
  });

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Settings</h1>
        <p className="text-muted-foreground">Provision users and configure targets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form 1: Register New COO */}
        <section className="bg-card p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Register New COO</h2>
          <RegisterCooForm branches={branches} />
        </section>

        {/* Form 2: Set COO Targets */}
        <section className="bg-card p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Set COO Targets</h2>
          <SetTargetForm coos={coos} />
        </section>
      </div>
    </div>
  );
}
