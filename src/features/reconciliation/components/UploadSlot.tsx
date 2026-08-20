"use client";

import React, { useRef, useState } from 'react';
import type { UploadSlotState } from '../types';
import type { PrCategory } from '../constants';
import { X } from 'lucide-react';

export interface UploadSlotProps {
  category: PrCategory;
  slotState: UploadSlotState;
  onFileSelected: (category: PrCategory, file: File) => void;
  onSheetConfirmed: (category: PrCategory, sheetName: string) => void;
  onClear: (category: PrCategory) => void;
}

export function UploadSlot({ category, slotState, onFileSelected, onSheetConfirmed, onClear }: UploadSlotProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedSheet, setSelectedSheet] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(category, file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isLoaded = slotState.status === 'loaded';
  const isLoading = slotState.status === 'loading';
  const isError = slotState.status === 'error';
  const hasMultipleSheets = slotState.sheetNames && slotState.sheetNames.length > 1 && !slotState.selectedSheet;

  return (
    <div className="relative inline-block">
      {hasMultipleSheets ? (
        <div className="flex items-center gap-2 bg-muted rounded-full px-3 py-1.5 shadow-sm border border-border">
          <span className="text-sm font-medium">{category}</span>
          <select 
            className="text-xs bg-background border rounded px-1 py-0.5"
            value={selectedSheet}
            onChange={e => setSelectedSheet(e.target.value)}
          >
            <option value="" disabled>Select sheet...</option>
            {slotState.sheetNames?.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <button
            disabled={!selectedSheet}
            onClick={() => {
              onSheetConfirmed(category, selectedSheet);
              setSelectedSheet('');
            }}
            className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded disabled:opacity-50"
          >
            Confirm
          </button>
          <button onClick={() => onClear(category)} className="text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        </div>
      ) : (
        <div 
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 border transition-colors shadow-sm ${
            isLoaded 
              ? 'bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-800 dark:text-emerald-300' 
              : isError 
                ? 'bg-red-100 border-red-200 text-red-700 dark:bg-red-900/40 dark:border-red-800 dark:text-red-300'
                : isLoading
                  ? 'bg-muted border-border text-muted-foreground'
                  : 'bg-muted border-border text-muted-foreground hover:bg-muted/80 cursor-pointer'
          }`}
        >
          {!isLoaded && !isLoading && !isError && (
             <label className="cursor-pointer text-sm font-medium flex-1">
               {category}
               <input 
                 type="file" 
                 accept=".xlsx,.xls,.csv" 
                 className="hidden" 
                 onChange={handleFileChange} 
                 ref={fileInputRef}
               />
             </label>
          )}
          {isLoading && (
            <span className="text-sm font-medium flex items-center gap-1">
               <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               Parsing...
            </span>
          )}
          {isLoaded && (
            <span className="text-sm font-medium flex items-center gap-1">
               {category} ✓ Loaded
            </span>
          )}
          {isError && (
            <span className="text-sm font-medium" title={slotState.error}>
               {category} ⚠ Error
            </span>
          )}
          
          <button 
            onClick={(e) => {
              e.preventDefault();
              onClear(category);
            }}
            className="hover:bg-black/5 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors"
            title="Clear"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
