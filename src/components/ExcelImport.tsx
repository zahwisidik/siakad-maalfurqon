import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  onImport: (data: any[]) => void;
  isLoading?: boolean;
}

export default function ExcelImport({ onImport, isLoading }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        if (data.length === 0) {
          toast.error("File excel kosong atau format salah");
          return;
        }

        onImport(data);
      } catch (err) {
        toast.error("Gagal membaca file excel");
      }
    };
    reader.readAsBinaryString(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".xlsx, .xls"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileUpload}
      />
      <button
        type="button"
        disabled={isLoading}
        onClick={() => fileInputRef.current?.click()}
        className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Upload className="h-4 w-4 mr-2" />
        Import Excel
      </button>
    </div>
  );
}
