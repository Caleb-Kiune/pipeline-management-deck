"use client";

import { useState } from "react";
import { User } from "@prisma/client";
import { upsertTarget } from "@/features/dashboard/actions/admin.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function SetTargetForm({ coos }: { coos: User[] }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    user_id: "",
    medical_target: 0,
    non_medical_target: 0,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.user_id) return alert("Please select a COO");
    
    setLoading(true);
    try {
      await upsertTarget(formData);
      setFormData({ ...formData, medical_target: 0, non_medical_target: 0 });
      alert("Targets successfully updated");
    } catch (error) {
      console.error(error);
      alert("Failed to update targets");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Select COO</Label>
        <Select 
          value={formData.user_id} 
          onValueChange={val => setFormData({ ...formData, user_id: val ?? "" })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select COO" />
          </SelectTrigger>
          <SelectContent>
            {coos.map(coo => (
              <SelectItem key={coo.id} value={coo.id}>{coo.name} ({coo.email})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Medical Target</Label>
        <Input 
          required 
          type="number" 
          value={formData.medical_target ?? ""} 
          onChange={e => setFormData({ ...formData, medical_target: parseFloat(e.target.value) || 0 })} 
          placeholder="0" 
        />
      </div>
      <div className="space-y-2">
        <Label>Non-Medical Target</Label>
        <Input 
          required 
          type="number" 
          value={formData.non_medical_target ?? ""} 
          onChange={e => setFormData({ ...formData, non_medical_target: parseFloat(e.target.value) || 0 })} 
          placeholder="0" 
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Saving..." : "Set Targets"}
      </Button>
    </form>
  );
}
