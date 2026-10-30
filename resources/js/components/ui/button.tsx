import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:ring-4 focus-visible:ring-[#FF6B35]/20 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-[0_4px_14px_rgba(255,107,53,0.35)] hover:from-[#E55A25] hover:to-[#FF6B35]",
        primary:
          "bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-[0_4px_14px_rgba(255,107,53,0.35)] hover:from-[#E55A25] hover:to-[#FF6B35]",
        secondary:
          "bg-gradient-to-r from-[#4ECDC4] to-[#6EE7E2] text-white shadow-[0_4px_12px_rgba(78,205,196,0.3)] hover:from-[#3DBDB4] hover:to-[#4ECDC4]",
        success:
          "bg-gradient-to-r from-[#10B981] to-[#34D399] text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:from-[#059669] hover:to-[#10B981]",
        warning:
          "bg-gradient-to-r from-[#F59E0B] to-[#FCD34D] text-white shadow-[0_4px_12px_rgba(245,158,11,0.3)] hover:from-[#B45309] hover:to-[#F59E0B]",
        info:
          "bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] text-white shadow-[0_4px_12px_rgba(59,130,246,0.3)] hover:from-[#1D4ED8] hover:to-[#3B82F6]",
        danger:
          "bg-gradient-to-r from-[#EF4444] to-[#F87171] text-white shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:from-[#DC2626] hover:to-[#EF4444]",
        destructive:
          "bg-gradient-to-r from-[#EF4444] to-[#F87171] text-white shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:from-[#DC2626] hover:to-[#EF4444]",
        outline:
          "border-2 border-[#FF6B35] bg-transparent text-[#FF6B35] hover:bg-[#FFF0EB] dark:border-[#FF6B35] dark:text-[#FF8C5A] dark:hover:bg-[#2A1724]",
        ghost:
          "border-2 border-[#E8E8E8] bg-transparent text-[#4B5563] hover:bg-[#F5F5F5] dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800",
        link: "text-[#FF6B35] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-lg px-3 text-xs has-[>svg]:px-2.5",
        lg: "h-11 rounded-xl px-6 text-base has-[>svg]:px-4",
        icon: "size-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
