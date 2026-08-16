import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { RegisterCooForm } from "./components/register-coo-form";
import { prisma } from "@/lib/db";
import { ManageCoosTable } from "@/features/dashboard/components/manage-coos-table";

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Role Protection
  if (!session || session.user.role !== "MANAGEMENT") {
    redirect("/dashboard");
  }

  // Fetch active reporting period
  const activePeriod = await prisma.reportingPeriod.findFirst({
    where: { status: "OPEN" },
  });

  // Fetch prerequisites for dropdowns
  const branches = await prisma.branch.findMany();
  const coos = await prisma.user.findMany({
    where: { role: "COO" },
    include: {
      branch: true,
      targets: activePeriod ? { where: { period_id: activePeriod.id } } : false,
    },
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
      </div>

      {/* Form 3: Manage COOs */}
      <section className="bg-card p-6 rounded-lg border shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Manage COOs</h2>
        <ManageCoosTable coos={coos} branches={branches} />
      </section>
    </div>
  );
}
