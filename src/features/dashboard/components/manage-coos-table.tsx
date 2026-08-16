"use client";

import { useState } from "react";
import { User, Branch, Target } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { editCoo, deleteCoo } from "@/features/dashboard/actions/admin.actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal } from "lucide-react";

export function ManageCoosTable({ coos, branches }: { coos: (User & { branch?: Branch | null, targets?: Target[] })[], branches: Branch[] }) {
  const [editingCoo, setEditingCoo] = useState<User | null>(null);
  
  // Edit Form State
  const [editData, setEditData] = useState({ 
    name: "", 
    email: "", 
    branch_id: "",
    medicalTarget: "" as number | "",
    nonMedicalTarget: "" as number | "",
    password: "" 
  });
  const [loading, setLoading] = useState(false);

  const openEditModal = (coo: (User & { targets?: Target[] })) => {
    const target = coo.targets?.[0];
    setEditData({ 
      name: coo.name, 
      email: coo.email, 
      branch_id: coo.branch_id || "",
      medicalTarget: target?.medical_target ?? "",
      nonMedicalTarget: target?.non_medical_target ?? "",
      password: "" 
    });
    setEditingCoo(coo);
  };

  const handleEditSubmit = async () => {
    if (!editingCoo) return;
    setLoading(true);
    
    // Convert empty strings back to 0 or block submission? 
    // We agreed it should be strictly required
    if (editData.medicalTarget === "" || editData.nonMedicalTarget === "") {
      alert("Please provide both Medical and Non-Medical targets.");
      setLoading(false);
      return;
    }

    try {
      await editCoo(editingCoo.id, {
        name: editData.name,
        email: editData.email,
        branch_id: editData.branch_id,
        medicalTarget: editData.medicalTarget,
        nonMedicalTarget: editData.nonMedicalTarget,
        password: editData.password
      });
      setEditingCoo(null);
      window.location.reload(); 
    } catch (error) {
      console.error(error);
      alert("Failed to edit COO");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this COO? Their records will be preserved but they won't be able to log in or appear on active lists.")) {
      try {
        await deleteCoo(id);
        window.location.reload();
      } catch (e) {
        console.error(e);
        alert("Failed to delete COO");
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coos.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                  No active COOs found.
                </TableCell>
              </TableRow>
            )}
            {coos.map((coo) => (
              <TableRow key={coo.id}>
                <TableCell className="font-medium">{coo.name}</TableCell>
                <TableCell>{coo.email}</TableCell>
                <TableCell>{coo.branch?.name || "No Branch"}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditModal(coo)}>Edit Details</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(coo.id)}>
                        Delete (Soft)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editingCoo} onOpenChange={(open: boolean) => !open && setEditingCoo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit COO Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select value={editData.branch_id || ""} onValueChange={(val) => setEditData({...editData, branch_id: val || ""})}>
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
              <Label>Medical Target</Label>
              <Input 
                type="number" 
                required
                value={editData.medicalTarget ?? ""} 
                onChange={e => setEditData({ ...editData, medicalTarget: e.target.value === "" ? "" : Number(e.target.value) })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Non-Medical Target</Label>
              <Input 
                type="number" 
                required
                value={editData.nonMedicalTarget ?? ""} 
                onChange={e => setEditData({ ...editData, nonMedicalTarget: e.target.value === "" ? "" : Number(e.target.value) })} 
              />
            </div>
            
            <div className="space-y-2 pt-2 border-t mt-4">
              <Label>Change Password (Optional)</Label>
              <Input 
                type="password" 
                placeholder="Leave blank to keep current password" 
                value={editData.password} 
                onChange={e => setEditData({...editData, password: e.target.value})} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCoo(null)}>Cancel</Button>
            <Button onClick={handleEditSubmit} disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
