
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 touch-target active:scale-98",
  {
    variants: {
      variant: {
        default: "btn-primary text-primary-foreground shadow-card hover:shadow-hover",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-card hover:shadow-hover",
        outline:
          "border border-border bg-background hover:bg-muted/50 hover:text-foreground shadow-card hover:shadow-hover",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-card hover:shadow-hover",
        ghost: "hover:bg-muted/50 hover:text-foreground rounded-xl",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: "gradient-primary text-white hover:gradient-hover shadow-card hover:shadow-hover",
        success: "bg-green-600 text-white hover:bg-green-700 shadow-card hover:shadow-hover",
        premium: "gradient-primary text-white shadow-lg hover:shadow-hover border border-primary/20",
      },
      size: {
        default: "h-11 px-6 py-2.5 rounded-xl",
        sm: "h-9 px-4 py-2 rounded-lg text-xs",
        lg: "h-12 px-8 py-3 rounded-xl text-base",
        icon: "h-11 w-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
