import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title?: string;
  children?: ReactNode;
  className?: string;
};

export function EmptyState({ title = "Nothing listed yet", children, className }: EmptyStateProps) {
  return (
    <div className={cn("ui-empty", className)} role="status">
      <p className="ui-empty-title">{title}</p>
      {children ? <div className="ui-empty-body">{children}</div> : null}
    </div>
  );
}
