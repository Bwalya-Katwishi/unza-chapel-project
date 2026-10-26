import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "div" | "section";
  padded?: boolean;
  interactive?: boolean;
};

export function Card({
  as: Tag = "div",
  className,
  padded = true,
  interactive,
  ...props
}: CardProps) {
  return (
    <Tag
      className={cn(
        "ui-card",
        padded && "ui-card--padded",
        interactive && "ui-card--interactive",
        className,
      )}
      {...props}
    />
  );
}
