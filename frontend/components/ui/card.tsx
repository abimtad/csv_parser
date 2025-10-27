import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // Theme-aware surface: subtle panel in light, glassy tint in dark
      "rounded-lg border surface shadow-sm",
      "border-black/10 dark:border-white/10",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
);

const CardTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <h3
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
);

const CardDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <p
    className={cn("text-sm text-neutral-600 dark:text-white/70", className)}
    {...props}
  />
);

const CardContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-6 pt-0", className)} {...props} />
);

const CardFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
);

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
