import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "gold" | "navy" | "success" | "warn" | "danger";
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return <span className={cn("ui-badge", `ui-badge--${tone}`, className)} {...props} />;
}

export function Pill({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("ui-pill", className)} {...props} />;
}
