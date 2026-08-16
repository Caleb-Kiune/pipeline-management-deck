"use client";

import { useState } from "react";
import { Branch } from "@prisma/client";
import { createCoo } from "@/features/dashboard/actions/admin.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function RegisterCooForm({ branches }: { branches: Branch[] }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    branch_id: "",
    medicalTarget: "" as number | "",
    nonMedicalTarget: "" as number | "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (formData.medicalTarget === "" || formData.nonMedicalTarget === "") {
      alert("Please provide both Medical and Non-Medical targets.");
      setLoading(false);
      return;
    }

    try {
      await createCoo(formData);
      setFormData({ name: "", email: "", password: "", branch_id: "", medicalTarget: "", nonMedicalTarget: "" });
      alert("COO successfully registered");
    } catch (error) {
      console.error(error);
      alert("Failed to register COO");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input 
          required 
          value={formData.name} 
          onChange={e => setFormData({ ...formData, name: e.target.value })} 
          placeholder="COO Name" 
        />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input 
          required 
          type="email" 
          value={formData.email} 
          onChange={e => setFormData({ ...formData, email: e.target.value })} 
          placeholder="Email address" 
        />
      </div>
      <div className="space-y-2">
        <Label>Password</Label>
        <Input 
          required 
          type="password" 
          value={formData.password} 
          onChange={e => setFormData({ ...formData, password: e.target.value })} 
          placeholder="Password" 
        />
      </div>
      <div className="space-y-2">
        <Label>Branch</Label>
        <Select 
          value={formData.branch_id ?? ""} 
          onValueChange={val => setFormData({ ...formData, branch_id: val ?? "" })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select branch" />
          </SelectTrigger>
          <SelectContent>
            {branches.map(b => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Initial Medical Target</Label>
        <Input 
          type="number" 
          required
          value={formData.medicalTarget ?? ""} 
          onChange={e => setFormData({ ...formData, medicalTarget: e.target.value === "" ? "" : Number(e.target.value) })} 
          placeholder="0" 
        />
      </div>
      <div className="space-y-2">
        <Label>Initial Non-Medical Target</Label>
        <Input 
          type="number" 
          required
          value={formData.nonMedicalTarget ?? ""} 
          onChange={e => setFormData({ ...formData, nonMedicalTarget: e.target.value === "" ? "" : Number(e.target.value) })} 
          placeholder="0" 
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Registering..." : "Register COO"}
      </Button>
    </form>
  );
}
