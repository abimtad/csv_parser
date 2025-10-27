"use client";

import React from "react";
import { Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{
    downloadLink: string;
    processingTimeMs: number;
    departmentCount: number;
  } | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!file) {
      setError("Please choose a CSV file to upload.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Upload failed");
      }
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!result?.downloadLink) return;
    const url = new URL(result.downloadLink);
    const filename = url.pathname.split("/").pop();
    if (!filename) return;
    // trigger proxy download from our Next route
    window.location.href = `/api/download?filename=${encodeURIComponent(
      filename
    )}`;
  };

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            CSV Processor
          </h1>
          <p className="text-white/60 mt-2">
            Vercel-inspired interface to upload and process CSV files.
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
                <Input
                  id="file"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={loading}
                />
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={loading}>
                  <Upload className="h-4 w-4 mr-2" />
                  {loading ? "Uploading..." : "Upload"}
                </Button>
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
            </form>

            {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}

            {result && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-md border border-white/10 p-3">
                  <div className="text-xs text-white/60">
                    Unique Departments
                  </div>
                  <div className="text-lg font-semibold">
                    {result.departmentCount}
                  </div>
                </div>
                <div className="rounded-md border border-white/10 p-3">
                  <div className="text-xs text-white/60">Processing Time</div>
                  <div className="text-lg font-semibold">
                    {result.processingTimeMs} ms
                  </div>
                </div>
                <div className="rounded-md border border-white/10 p-3">
                  <div className="text-xs text-white/60">Status</div>
                  <div className="text-lg font-semibold">Ready</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
