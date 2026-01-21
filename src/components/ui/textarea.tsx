import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[100px] w-full rounded-lg border border-input bg-background px-4 py-3 text-base shadow-sm transition-all duration-200",
        "placeholder:text-muted-foreground/60",
        "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "hover:border-primary/50",
        "resize-none md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
