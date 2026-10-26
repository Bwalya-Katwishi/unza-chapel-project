import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  narrow?: boolean;
};

export function Container({ className, narrow, ...props }: ContainerProps) {
  return (
    <div
      className={cn("ui-container", narrow && "ui-container--narrow", className)}
      {...props}
    />
  );
}
