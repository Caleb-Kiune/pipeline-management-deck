"use client";

import React, { useRef } from 'react';
import { useReconciliation } from '../reconciliation-context';
import { PR_CATEGORIES } from '../constants';
import type { PrCategory } from '../constants';
import type { ExcelRowData } from '../types';
import { UploadSlot } from './UploadSlot';
import { ColumnMapperModal } from './ColumnMapperModal';
import * as XLSX from 'xlsx';
import { X, Search } from 'lucide-react';

export function TopBar() {
  const { state, dispatch } = useReconciliation();
  const workbooksRef = useRef<Record<string, XLSX.WorkBook>>({});
  const [cooSearch, setCooSearch] = React.useState('');
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [mappingModalState, setMappingModalState] = React.useState<{
    category: PrCategory;
    rawRows: ExcelRowData[];
    headers: string[];
    sheetName: string;
  } | null>(null);

  const handleFileSelected = async (category: PrCategory, file: File) => {
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      workbooksRef.current[category] = wb;
      
      const sheetNames = wb.SheetNames;
      dispatch({ type: 'UPLOAD_FILE', payload: { category, file, sheetNames } });
      
      if (sheetNames.length === 1) {
        handleSheetConfirmed(category, sheetNames[0]);
      }
    } catch (err: any) {
      dispatch({ type: 'UPLOAD_ERROR', payload: { category, error: err.message || 'Failed to read file' } });
    }
  };

  const handleSheetConfirmed = (category: PrCategory, sheetName: string) => {
    try {
      const wb = workbooksRef.current[category];
      if (!wb) throw new Error("Workbook not found in memory");
      
      const worksheet = wb.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet) as ExcelRowData[];
      
      if (json.length === 0) throw new Error("Sheet is empty");
      
      const headers = Object.keys(json[0]);
      setMappingModalState({ category, rawRows: json, headers, sheetName });
    } catch (err: any) {
      dispatch({ type: 'UPLOAD_ERROR', payload: { category, error: err.message || 'Failed to parse sheet' } });
    }
  };

  const handleConfirmMapping = (mapping: Record<string, string>) => {
    if (!mappingModalState) return;
    
    const safeParsePremium = (val: any) => {
      if (val === undefined || val === null) return 0;
      const str = String(val).replace(/,/g, '').trim();
      const num = Number(str);
      return isNaN(num) ? 0 : num;
    };

    const taggedJson = mappingModalState.rawRows.map(row => ({
      ...row,
      _prCategory: mappingModalState.category,
      _mappedName: String(row[mapping.clientName] || 'Unknown'),
      _mappedBranch: mapping.branch ? String(row[mapping.branch] || 'Unknown') : 'Unknown',
      _mappedProduct: mapping.product ? String(row[mapping.product] || 'Unknown') : 'Unknown',
      _mappedPremium: safeParsePremium(row[mapping.premium])
    }));

    dispatch({ 
      type: 'UPLOAD_PARSED', 
      payload: { 
        category: mappingModalState.category, 
        rows: taggedJson, 
        selectedSheet: mappingModalState.sheetName 
      } 
    });
    
    setMappingModalState(null);
  };

  const handleClear = (category: PrCategory) => {
    delete workbooksRef.current[category];
    dispatch({ type: 'UPLOAD_CLEAR', payload: { category } });
  };

  const selectedCoo = state.allCoos.find(c => c.id === state.selectedCooId);
  const filteredCoos = state.allCoos.filter(c => c.name.toLowerCase().includes(cooSearch.toLowerCase()));

  return (
    <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border h-16 flex items-center justify-between px-6 shrink-0">
      <div className="relative">
        <div 
          className="flex items-center gap-2 border border-border rounded-lg px-3 py-1.5 cursor-pointer bg-background hover:bg-muted/50 min-w-[240px]"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          {selectedCoo ? (
            <div className="flex-1 flex justify-between items-center">
              <span className="text-sm font-medium">{selectedCoo.name}</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: 'SELECT_COO', payload: null });
                }} 
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex-1 flex items-center gap-2 text-muted-foreground">
              <Search size={16} />
              <span className="text-sm">Select COO... ▾</span>
            </div>
          )}
        </div>
        
        {dropdownOpen && (
          <div className="absolute top-full left-0 mt-1 w-full bg-popover border border-border rounded-lg shadow-md max-h-64 overflow-y-auto z-40">
            <div className="p-2 sticky top-0 bg-popover border-b border-border">
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full bg-background border rounded px-2 py-1 text-sm outline-none focus:border-primary"
                value={cooSearch}
                onChange={e => setCooSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
              />
            </div>
            {filteredCoos.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">No COO found</div>
            ) : (
              <div className="p-1">
                {filteredCoos.map(coo => (
                  <button
                    key={coo.id}
                    className={`w-full text-left px-2 py-1.5 text-sm rounded flex items-center justify-between hover:bg-muted ${state.selectedCooId === coo.id ? 'bg-primary/10 text-primary font-medium' : ''}`}
                    onClick={() => {
                      dispatch({ type: 'SELECT_COO', payload: coo.id });
                      setDropdownOpen(false);
                      setCooSearch('');
                    }}
                  >
                    <span className="truncate">{coo.name}</span>
                    <span className="text-xs bg-muted-foreground/10 px-1.5 py-0.5 rounded-full">{coo.claimCount}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {PR_CATEGORIES.map(cat => (
          <UploadSlot 
            key={cat}
            category={cat}
            slotState={state.uploads[cat]}
            onFileSelected={handleFileSelected}
            onSheetConfirmed={handleSheetConfirmed}
            onClear={handleClear}
          />
        ))}
      </div>

      {mappingModalState && (
        <ColumnMapperModal
          rawHeaders={mappingModalState.headers}
          onConfirm={handleConfirmMapping}
          onCancel={() => {
            dispatch({ type: 'UPLOAD_CLEAR', payload: { category: mappingModalState.category } });
            setMappingModalState(null);
          }}
        />
      )}
    </header>
  );
}
