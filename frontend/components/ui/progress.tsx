import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number; // 0 - 100
}

export function Progress({ value = 0, className, ...props }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-md bg-white/10",
        className
      )}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-white/70 transition-all duration-200"
        style={{ transform: `translateX(${clamped - 100}%)` }}
      />
    </div>
  );
}
