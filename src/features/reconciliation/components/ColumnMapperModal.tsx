"use client";

import React, { useState, useEffect } from 'react';
import { KNOWN_HEADERS } from '../constants';
import { X } from 'lucide-react';

export interface ColumnMapperModalProps {
  rawHeaders: string[];
  onConfirm: (mapping: Record<string, string>) => void;
  onCancel: () => void;
}

export function ColumnMapperModal({ rawHeaders, onConfirm, onCancel }: ColumnMapperModalProps) {
  const [mapping, setMapping] = useState({
    clientName: '',
    branch: '',
    product: '',
    premium: ''
  });

  useEffect(() => {
    // Auto-guess headers
    const guess = (knownList: readonly string[]) => {
      const match = rawHeaders.find(h => 
        knownList.some(known => h.toLowerCase().trim() === known.toLowerCase().trim())
      );
      return match || '';
    };

    setMapping({
      clientName: guess(KNOWN_HEADERS.clientName),
      branch: guess(KNOWN_HEADERS.branch),
      product: guess(KNOWN_HEADERS.product),
      premium: guess(KNOWN_HEADERS.premium)
    });
  }, [rawHeaders]);

  const isValid = Boolean(mapping.clientName) && Boolean(mapping.premium);

  const renderSelect = (label: string, field: keyof typeof mapping, required: boolean) => (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
        value={mapping[field]}
        onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
      >
        <option value="">[ Ignore / Not Found ]</option>
        {rawHeaders.map((h, i) => (
          <option key={i} value={h}>{h}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md rounded-xl shadow-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <h2 className="text-lg font-semibold">Map Excel Columns</h2>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-muted-foreground mb-6">
            Please confirm the column mappings for this file. We've auto-selected the best matches.
          </p>
          
          {renderSelect("Client Name", "clientName", true)}
          {renderSelect("Premium Amount", "premium", true)}
          {renderSelect("Branch", "branch", false)}
          {renderSelect("Product / Category", "product", false)}
        </div>
        
        <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => onConfirm(mapping)}
            disabled={!isValid}
            className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Confirm Mapping
          </button>
        </div>
      </div>
    </div>
  );
}
