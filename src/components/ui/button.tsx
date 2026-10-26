import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";

type Shared = {
  variant?: Variant;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = Shared &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type ButtonAsLink = Shared &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button({ variant = "primary", className, children, ...props }: ButtonProps) {
  const classes = cn("ui-btn", `ui-btn--${variant}`, className);

  if ("href" in props && props.href) {
    const { href, ...rest } = props;
    const external =
      /^(https?:|mailto:|tel:)/i.test(href) || href.startsWith("//");
    if (external) {
      return (
        <a href={href} className={classes} {...rest}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  const buttonProps = props as ButtonAsButton;
  return (
    <button type={buttonProps.type ?? "button"} className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
