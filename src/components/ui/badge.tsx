import * as React from "react";

import { cn } from "@/lib/utils";

function Badge({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border/70 px-2.5 py-1 text-xs font-medium text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
