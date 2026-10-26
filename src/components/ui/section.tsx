import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";

type SectionProps = HTMLAttributes<HTMLElement> & {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  narrow?: boolean;
  flush?: boolean;
};

export function Section({
  className,
  eyebrow,
  title,
  subtitle,
  action,
  narrow,
  flush,
  children,
  ...props
}: SectionProps) {
  const hasHead = Boolean(eyebrow || title || subtitle || action);

  return (
    <section className={cn("ui-section", flush && "ui-section--flush", className)} {...props}>
      <Container narrow={narrow}>
        {hasHead ? (
          <div className="ui-section-head">
            <div className="ui-section-copy">
              {eyebrow ? <p className="ui-eyebrow">{eyebrow}</p> : null}
              {title ? <h2 className="ui-title">{title}</h2> : null}
              {subtitle ? <p className="ui-subtitle">{subtitle}</p> : null}
            </div>
            {action ? <div className="ui-section-action">{action}</div> : null}
          </div>
        ) : null}
        {children}
      </Container>
    </section>
  );
}
