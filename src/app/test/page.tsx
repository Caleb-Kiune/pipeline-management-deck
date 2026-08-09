import { OpportunityForm } from "@/features/opportunities/components/opportunity-form";
import { getCOOPipeline, getCOOKPIs } from "@/features/opportunities/actions/opportunity.queries";
import { KPICards } from "@/features/opportunities/components/kpi-cards";
import { PipelineView } from "@/features/opportunities/components/pipeline-view";
import { DashboardView } from "@/features/dashboard/components/dashboard-view"; // IMPORT SLICE 4

// TEMP SANDBOX IDs
const TEMP_USER_ID = "1ce45016-5cbf-4768-b1f2-df7b1c068073"; // Jacob Mwangi
const TEMP_PERIOD_ID = "db61149d-c02f-4f12-aaee-42f293b21121"; // Active Reporting Period

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function TestPage(props: { searchParams: SearchParams }) {
  // Resolve searchParams for Next.js 15+ compatibility
  const searchParams = await props.searchParams;
  
  const kpis = await getCOOKPIs(TEMP_USER_ID, TEMP_PERIOD_ID);
  const pipeline = await getCOOPipeline(TEMP_USER_ID, TEMP_PERIOD_ID);

  return (
    <div className="container max-w-6xl mx-auto py-10 space-y-16">
      <div>
        <h1 className="text-3xl font-bold mb-2">Sandbox: Full Platform View</h1>
        <p className="text-muted-foreground">Testing Slices 2, 3, and 4.</p>
      </div>

      {/* SLICE 4: Management Dashboard */}
      <section className="p-8 bg-slate-50 dark:bg-slate-900 border rounded-xl shadow-inner">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">Executive Management Dashboard</h2>
        {/* Pass the periodId and resolved searchParams. Adjust prop names if your IDE named them differently. */}
        <DashboardView periodId={TEMP_PERIOD_ID} searchParams={searchParams} />
      </section>

      <hr />

      {/* SLICE 3 & 2: COO Workspace */}
      <section>
        <h2 className="text-2xl font-bold mb-6">COO Workspace (Jacob Mwangi)</h2>
        <div className="grid grid-cols-1 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-3">1. My KPIs</h3>
            <KPICards pipelineValue={kpis.pipelineValue} reportedClosed={kpis.reportedClosed} />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">2. Current Pipeline</h3>
            <div className="border rounded-md shadow-sm bg-card overflow-hidden">
              <PipelineView opportunities={pipeline} />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">3. Add New Opportunity</h3>
            <div className="p-6 border rounded-md shadow-sm max-w-2xl bg-card">
              <OpportunityForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}