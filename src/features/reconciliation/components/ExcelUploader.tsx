"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

export interface ExcelRowData {
  Insured?: string;
  Gross_premium_kshs?: number;
  Branch_name?: string;
  Created_by?: string;
  Policy_number?: string;
  [key: string]: any;
}

export interface ExcelUploaderProps {
  onDataProcessed: (data: ExcelRowData[]) => void;
}

export function ExcelUploader({ onDataProcessed }: ExcelUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setWorkbook(null);
    setSheetNames([]);
    setSelectedSheet("");

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      setWorkbook(wb);
      setSheetNames(wb.SheetNames);
      if (wb.SheetNames.length > 0) {
        setSelectedSheet(wb.SheetNames[0]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to process the Excel file.");
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleSheetConfirm = () => {
    if (!workbook || !selectedSheet) return;
    
    setLoading(true);
    setError(null);
    try {
      const worksheet = workbook.Sheets[selectedSheet];
      const json = XLSX.utils.sheet_to_json(worksheet) as ExcelRowData[];
      
      if (json.length === 0) {
        throw new Error("No data found in the selected sheet.");
      }
      
      onDataProcessed(json);
    } catch (err: any) {
      setError(err.message || "Failed to parse sheet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border rounded-xl bg-card text-card-foreground shadow-sm mb-8">
      <h3 className="text-lg font-medium mb-2">Upload Underwriter Report</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Upload the official Excel report and select the correct sheet to load into memory.
      </p>
      
      {!workbook ? (
        <div className="flex items-center gap-4">
          <label className="relative cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium text-sm">
            {loading ? "Reading File..." : "Select Excel File"}
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={handleFileUpload}
              disabled={loading}
            />
          </label>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="w-full sm:w-64">
            <label className="block text-sm font-medium mb-2">Select Sheet</label>
            <select 
              value={selectedSheet}
              onChange={(e) => setSelectedSheet(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {sheetNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={handleSheetConfirm}
            disabled={loading}
            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium text-sm"
          >
            {loading ? "Parsing..." : "Load Sheet"}
          </button>
          <button 
            onClick={() => setWorkbook(null)}
            className="px-4 py-2 border rounded-md font-medium text-sm hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md">
          {error}
        </div>
      )}
    </div>
  );
}
