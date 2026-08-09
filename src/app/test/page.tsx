import { OpportunityForm } from "@/features/opportunities/components/opportunity-form";

export default function TestPage() {
  return (
    <div className="container max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Sandbox: COO Data Entry</h1>
      <div className="p-6 border rounded-md shadow-sm">
        <OpportunityForm userId="1ce45016-5cbf-4768-b1f2-df7b1c068073" />
      </div>
    </div>
  );
}