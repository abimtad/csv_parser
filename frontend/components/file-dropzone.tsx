"use client";

import * as React from "react";
import { FileUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  accept?: string;
  onFileSelected: (file: File) => void;
  selectedFile?: File | null;
}

export function FileDropzone({
  accept = ".csv,text/csv",
  onFileSelected,
  selectedFile,
}: FileDropzoneProps) {
  const [isOver, setIsOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
    const file = e.dataTransfer.files?.[0];
    validateAndSelect(file);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    validateAndSelect(file);
  };

  const validateAndSelect = (file?: File) => {
    setError(null);
    if (!file) return;
    const ok = [".csv", "text/csv"].some(
      (ext) => file.name.toLowerCase().endsWith(ext) || file.type === ext
    );
    if (!ok) {
      setError("Only .csv files are allowed.");
      return;
    }
    onFileSelected(file);
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsOver(true);
        }}
        onDragLeave={() => setIsOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-all",
          "surface hover:surface-strong",
          isOver && "surface-strong"
        )}
      >
        <FileUp className="h-6 w-6 mb-2" />
        {selectedFile ? (
          <>
            <p className="text-sm font-medium">{selectedFile.name}</p>
            <p className="text-xs text-white/60 mt-1">Click to change file</p>
          </>
        ) : (
          <>
            <p className="text-sm">
              Drag and drop your CSV here, or click to browse.
            </p>
            <p className="text-xs text-white/60">
              Only .csv files are accepted.
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={onChange}
          hidden
        />
      </div>
      {error && (
        <div className="flex items-center gap-2 text-amber-300 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}
