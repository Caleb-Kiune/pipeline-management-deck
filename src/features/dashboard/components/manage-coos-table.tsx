"use client";

import { useState } from "react";
import { User, Branch, Target } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { editCoo, toggleCooStatus, hardDeleteCoo } from "@/features/dashboard/actions/admin.actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "sonner";
import { MoreHorizontal, Loader2 } from "lucide-react";

export function ManageCoosTable({ coos, branches }: { coos: (User & { branch?: Branch | null, targets?: Target[] })[], branches: Branch[] }) {
  const [editingCoo, setEditingCoo] = useState<User | null>(null);
  
  // Edit Form State
  const [editData, setEditData] = useState({ 
    name: "", 
    email: "", 
    branch: "",
    medicalTarget: "" as number | "" | undefined,
    nonMedicalTarget: "" as number | "" | undefined,
    password: "" 
  });
  const [loading, setLoading] = useState(false);

  // Alert Dialog State
  const [confirmAction, setConfirmAction] = useState<{
    type: "toggle" | "delete";
    cooId: string;
    currentStatus?: boolean;
  } | null>(null);

  const openEditModal = (coo: (User & { branch?: Branch | null, targets?: Target[] })) => {
    const target = coo.targets?.[0];
    setEditData({ 
      name: coo.name, 
      email: coo.email, 
      branch: coo.branch?.name || "",
      medicalTarget: target?.medical_target ?? "",
      nonMedicalTarget: target?.non_medical_target ?? "",
      password: "" 
    });
    setEditingCoo(coo);
  };

  const handleEditSubmit = async () => {
    if (!editingCoo) return;
    setLoading(true);

    try {
      const res = await editCoo(editingCoo.id, {
        name: editData.name,
        email: editData.email,
        branch: editData.branch,
        medicalTarget: editData.medicalTarget === "" ? 0 : editData.medicalTarget,
        nonMedicalTarget: editData.nonMedicalTarget === "" ? 0 : editData.nonMedicalTarget,
        password: editData.password
      });

      if (!res.success) {
        toast.error(res.error || "Failed to edit COO");
      } else {
        toast.success(res.message || "COO details updated successfully");
        setEditingCoo(null);
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setLoading(true);
    try {
      const res = await toggleCooStatus(id, !currentStatus);
      if (!res.success) {
        toast.error(res.error || "Failed to toggle COO status");
      } else {
        toast.success(res.message || "Status toggled successfully");
      }
    } catch (e) {
      console.error(e);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  const handleHardDelete = async (id: string) => {
    setLoading(true);
    try {
      const res = await hardDeleteCoo(id);
      if (!res.success) {
        toast.error(res.error || "Failed to hard delete COO");
      } else {
        toast.success(res.message || "COO permanently deleted");
      }
    } catch (e) {
      console.error(e);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
      setConfirmAction(null);
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
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48">
                  <EmptyState 
                    title="No active COOs found" 
                    description="You have not registered any COOs yet."
                  />
                </TableCell>
              </TableRow>
            ) : (
              coos.map((coo) => (
                <TableRow key={coo.id}>
                <TableCell className="font-medium">{coo.name}</TableCell>
                <TableCell>{coo.email}</TableCell>
                <TableCell>{coo.branch?.name || "No Branch"}</TableCell>
                <TableCell>
                  {coo.isActive ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Deactivated</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditModal(coo)}>Edit Details</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setConfirmAction({ type: "toggle", cooId: coo.id, currentStatus: coo.isActive })}>
                        {coo.isActive ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setConfirmAction({ type: "delete", cooId: coo.id })}>
                        Hard Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editingCoo} onOpenChange={(open: boolean) => !open && setEditingCoo(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit COO Details</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label>Branch</Label>
              <Input value={editData.branch} onChange={e => setEditData({...editData, branch: e.target.value})} placeholder="e.g. Nairobi CBD" disabled={loading} />
            </div>
            
            <div className="space-y-2">
              <Label>Medical Target (Optional)</Label>
              <Input 
                type="number" 
                value={editData.medicalTarget ?? ""} 
                onChange={e => setEditData({ ...editData, medicalTarget: e.target.value === "" ? "" : Number(e.target.value) })} 
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Non-Medical Target (Optional)</Label>
              <Input 
                type="number" 
                value={editData.nonMedicalTarget ?? ""} 
                onChange={e => setEditData({ ...editData, nonMedicalTarget: e.target.value === "" ? "" : Number(e.target.value) })} 
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2 sm:col-span-2 pt-2 border-t mt-4">
              <Label>Change Password (Optional)</Label>
              <PasswordInput 
                placeholder="Leave blank to keep current password" 
                value={editData.password} 
                onChange={e => setEditData({...editData, password: e.target.value})} 
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCoo(null)} disabled={loading}>Cancel</Button>
            <Button onClick={handleEditSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "toggle"
                ? `Are you sure you want to ${confirmAction.currentStatus ? 'deactivate' : 'activate'} this COO?`
                : "WARNING: Are you sure you want to completely hard delete this COO?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "delete"
                ? "All their performance data will be permanently wiped. This cannot be undone."
                : "This action will affect their access to the platform."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={confirmAction?.type === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
              disabled={loading}
              onClick={(e) => {
                e.preventDefault();
                if (confirmAction?.type === "toggle") {
                  handleToggleStatus(confirmAction.cooId, !!confirmAction.currentStatus);
                } else if (confirmAction?.type === "delete") {
                  handleHardDelete(confirmAction.cooId);
                }
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Continue"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
