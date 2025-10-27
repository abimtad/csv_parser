"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      richColors
      position="top-right"
      theme="dark"
      toastOptions={{
        style: { borderRadius: 8, background: "#111", color: "#fff" },
      }}
    />
  );
}
