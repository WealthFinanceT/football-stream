import * as React from "react";

import { cn } from "@/lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  as?: keyof React.JSX.IntrinsicElements;
}

export function Container({
  children,
  className,
  as: Component = "div",
  ...props
}: ContainerProps) {
  return React.createElement(
    Component,
    {
      className: cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className),
      ...props,
    },
    children,
  );
}
