"use client";

import React, { useState } from 'react';
import { useReconciliation } from '../reconciliation-context';
import { updateReconciliationStatus } from '../actions/update-reconciliation-status';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Undo, ChevronUp, ChevronDown } from 'lucide-react';

export function PayrollCart() {
  const { state, dispatch } = useReconciliation();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const selectedCoo = state.allCoos.find(c => c.id === state.selectedCooId);

  const handleUndo = async (opportunityId: string) => {
    dispatch({ type: 'UNDO_PAYROLL', payload: { opportunityId } });
    await updateReconciliationStatus(opportunityId, 'UNRECONCILED');
  };

  const totalCommission = state.payrollCart.reduce((acc, row) => acc + row.commission, 0);

  if (!selectedCoo) return null;

  return (
    <div className="flex flex-col h-full relative">
      <div 
        className="flex items-center justify-between px-6 py-3 bg-emerald-50/30 hover:bg-emerald-50/50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30 border-b border-border sticky top-0 z-10 cursor-pointer transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <span>💼</span> 
          Payroll Cart — {selectedCoo.name} ({state.payrollCart.length} records)
        </h3>
        <div className="flex items-center gap-4">
          <div className="text-right flex items-center gap-2">
            <span className="font-semibold text-foreground uppercase tracking-wider text-sm">Total Commission:</span>
            <span className="font-bold text-lg text-emerald-700 dark:text-emerald-400">
              Ksh {totalCommission.toLocaleString()}
            </span>
          </div>
          <div className="text-emerald-700 dark:text-emerald-400">
            {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="flex-1 overflow-y-auto min-h-0">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0">
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead className="text-right">Gross Premium</TableHead>
              <TableHead className="text-right">1% Commission</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.payrollCart.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No verified records yet. Approve candidates from the Triage Arena.
                </TableCell>
              </TableRow>
            ) : (
              state.payrollCart.map((row) => (
                <TableRow key={row.opportunityId}>
                  <TableCell className="font-medium text-foreground">{row.clientName}</TableCell>
                  <TableCell className="text-muted-foreground">{row.product.replace(/_/g, ' ')}</TableCell>
                  <TableCell className="text-muted-foreground">{row.cooBranch}</TableCell>
                  <TableCell className="text-right font-mono">Ksh {row.grossPremium.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-emerald-600 font-semibold">
                    Ksh {row.commission.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <button 
                      onClick={() => handleUndo(row.opportunityId)}
                      className="text-xs text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1 justify-end w-full"
                      title="Undo Approval"
                    >
                      <Undo size={14} /> Undo
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
