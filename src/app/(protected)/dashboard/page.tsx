import { headers } from "next/headers";
import { auth } from "@/features/auth/lib/auth";
import { redirect } from "next/navigation";
import { PeriodStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function DashboardPage(props: { searchParams: SearchParams }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  const role = session.user.role as string;
  if (role !== "MANAGEMENT" && role !== "ADMIN") {
    return <div className="container mx-auto py-10 px-4 font-medium text-destructive">Access Denied. This section is restricted to Management only.</div>;
  }

  const activePeriod = await prisma.reportingPeriod.findFirst({
    where: { status: PeriodStatus.OPEN },
  });

  if (!activePeriod) {
    return <div className="container mx-auto py-10 px-4">No active reporting period found.</div>;
  }
  
  const searchParams = await props.searchParams;

  return (
    <div className="container max-w-6xl mx-auto py-10 px-4">
      <DashboardView periodId={activePeriod.id} searchParams={searchParams} />
    </div>
  );
}
