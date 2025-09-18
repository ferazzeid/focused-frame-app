import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const mobileButtonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors duration-normal focus:outline-none focus:ring-2 focus:ring-border-accent focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-background-card text-foreground border border-border hover:border-border-focus",
        primary: "bg-accent-green text-background hover:bg-accent-green/90",
        destructive: "bg-accent-red text-background hover:bg-accent-red/90",
        outline: "border border-input-border bg-transparent text-foreground hover:border-border-focus",
        ghost: "text-foreground-muted hover:text-foreground hover:bg-background-subtle",
        minimal: "text-foreground-subtle hover:text-foreground transition-colors duration-fast",
      },
      size: {
        default: "h-10 py-sm px-md",
        sm: "h-8 px-sm text-xs",
        lg: "h-12 px-lg",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface MobileButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof mobileButtonVariants> {}

const MobileButton = React.forwardRef<HTMLButtonElement, MobileButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(mobileButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
MobileButton.displayName = "MobileButton";

export { MobileButton, mobileButtonVariants };