"use client";

import React from "react";
import { Upload, Download, CheckCircle2, CircleAlert, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileDropzone } from "@/components/file-dropzone";

export default function HomePage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState<number>(0);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{
    downloadLink: string;
    processingTimeMs: number;
    departmentCount: number;
  } | null>(null);
  const [previewRows, setPreviewRows] = React.useState<string[][] | null>(null);
  const [previewText, setPreviewText] = React.useState<string | null>(null);

  const clearAll = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setPreviewRows(null);
    setPreviewText(null);
    setProgress(0);
    setUploading(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!file) {
      setError("Please choose a CSV file to upload.");
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      const promise: Promise<Response> = new Promise((resolve, reject) => {
        xhr.open("POST", "/api/upload", true);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 100);
            setProgress(pct);
          }
        };
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            const res = new Response(xhr.responseText, {
              status: xhr.status,
              headers: {
                "content-type":
                  xhr.getResponseHeader("content-type") || "application/json",
              },
            });
            resolve(res);
          }
        };
        xhr.onerror = reject;
        xhr.send(formData);
      });

      const res = await promise;
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Upload failed");
      }
      setResult(data);
      toast.success("Upload complete", {
        description: "Your file was processed successfully.",
      });
      // Fetch processed CSV for preview
      try {
        const url = new URL(data.downloadLink);
        const filename = url.pathname.split("/").pop();
        if (filename) {
          const resp = await fetch(
            `/api/download?filename=${encodeURIComponent(filename)}`
          );
          if (resp.ok) {
            const text = await resp.text();
            setPreviewText(text);
            const rows = text
              .trim()
              .split(/\r?\n/)
              .map((line) => line.split(","));
            setPreviewRows(rows);
          }
        }
      } catch {
        // ignore preview fetch errors
      }
    } catch (err: any) {
      const msg = err.message || "Upload failed";
      setError(msg);
      toast.error("Upload failed", { description: msg });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!result?.downloadLink) return;
    const url = new URL(result.downloadLink);
    const filename = url.pathname.split("/").pop();
    if (!filename) return;
    window.location.href = `/api/download?filename=${encodeURIComponent(
      filename
    )}`;
  };

  return (
    <main className="min-h-dvh relative z-10 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            CSV Processor
          </h1>
          <p className="text-neutral-600 dark:text-white/70 mt-2">
            interface to upload and process CSV files.
          </p>
        </div>

        <Card className="card-glass">
          <CardHeader>
            <CardTitle>Upload CSV</CardTitle>
            <CardDescription>
              Stream-processed securely on the server.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="file">CSV file</Label>
                <FileDropzone onFileSelected={setFile} selectedFile={file} />
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={uploading || !file}>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
                {(file || result) && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={clearAll}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
                {result?.downloadLink && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download processed CSV
                  </Button>
                )}
              </div>
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-neutral-700 dark:text-white/80">
                    <span>Uploading</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}
            </form>

            {error && (
              <p className="text-red-400 mt-4 text-sm flex items-center gap-2">
                <CircleAlert className="h-4 w-4" />
                {error}
              </p>
            )}

            {result && (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-md border border-black/10 dark:border-white/10 p-3">
                    <div className="text-xs text-neutral-600 dark:text-white/70">
                      Unique Departments
                    </div>
                    <div className="text-lg font-semibold">
                      {result.departmentCount}
                    </div>
                  </div>
                  <div className="rounded-md border border-black/10 dark:border-white/10 p-3">
                    <div className="text-xs text-neutral-600 dark:text-white/70">
                      Processing Time
                    </div>
                    <div className="text-lg font-semibold">
                      {result.processingTimeMs} ms
                    </div>
                  </div>
                  <div className="rounded-md border border-black/10 dark:border-white/10 p-3">
                    <div className="text-xs text-neutral-600 dark:text-white/70">
                      Status
                    </div>
                    <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-300 inline-flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Ready
                    </div>
                  </div>
                </div>
                {previewRows && (
                  <div className="rounded-lg surface-strong p-4 overflow-auto">
                    <div className="text-xs text-neutral-700 dark:text-white/80 mb-2">
                      Preview (processed CSV)
                    </div>
                    <div className="w-full overflow-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="text-left border-b border-neutral-300 dark:border-white/10">
                            {previewRows[0]?.map((h, i) => (
                              <th
                                key={i}
                                className="pr-6 pb-2 font-medium text-neutral-900 dark:text-white"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewRows.slice(1, 26).map((r, idx) => (
                            <tr
                              key={idx}
                              className="border-t border-neutral-200 dark:border-white/10"
                            >
                              {r.map((c, i) => (
                                <td
                                  key={i}
                                  className="pr-6 py-2 text-neutral-900 dark:text-white"
                                >
                                  {c}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {!previewRows?.length && previewText && (
                      <pre className="text-sm whitespace-pre-wrap break-words mt-2 text-neutral-900 dark:text-white">
                        {previewText}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
