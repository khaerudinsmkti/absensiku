import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3.5 gap-1 [&>svg]:pointer-events-none transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-white",
        outline:
          "border-[#E8E8E8] text-foreground dark:border-neutral-700",
        brand:
          "border-[#FF6B35]/30 bg-[#FFF0EB] text-[#FF6B35] dark:bg-[#331C1A] dark:text-[#FF8C5A]",
        hadir:
          "border-[#10B981]/30 bg-[#DCFCE7] text-[#059669] dark:bg-[#064E3B] dark:text-[#34D399]",
        sakit:
          "border-[#3B82F6]/30 bg-[#DBEAFE] text-[#1D4ED8] dark:bg-[#1E3A8A] dark:text-[#60A5FA]",
        izin:
          "border-[#F59E0B]/30 bg-[#FEF3C7] text-[#B45309] dark:bg-[#78350F] dark:text-[#FCD34D]",
        alpha:
          "border-[#EF4444]/30 bg-[#FEE2E2] text-[#DC2626] dark:bg-[#7F1D1D] dark:text-[#F87171]",
        terlambat:
          "border-[#7C3AED]/30 bg-[#EDE9FE] text-[#6D28D9] dark:bg-[#4C1D95] dark:text-[#C4B5FD]",
        khusus:
          "border-[#0D9488]/30 bg-[#CCFBF1] text-[#0F766E] dark:bg-[#134E4A] dark:text-[#5EEAD4]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
