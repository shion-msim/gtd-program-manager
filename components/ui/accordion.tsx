"use client";

import * as React from "react";
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("flex w-full flex-col gap-1", className)}
      {...props}
    />
  );
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-border rounded-lg border", className)}
      {...props}
    />
  );
}

function AccordionHeader({ className, ...props }: AccordionPrimitive.Header.Props) {
  return (
    <AccordionPrimitive.Header
      data-slot="accordion-header"
      className={cn("m-0", className)}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Trigger
      data-slot="accordion-trigger"
      className={cn(
        "group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-medium outline-none transition-colors",
        "hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      {...props}
    >
      <ChevronDownIcon className="text-muted-foreground size-4 shrink-0 transition-transform duration-200 group-data-[panel-open]:rotate-180" />
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </AccordionPrimitive.Trigger>
  );
}

function AccordionPanel({
  className,
  ...props
}: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-panel"
      className={cn(
        "data-open:animate-in data-open:fade-in-0 overflow-hidden px-2 pb-2 text-sm data-closed:hidden",
        className,
      )}
      keepMounted={false}
      {...props}
    />
  );
}

export { Accordion, AccordionItem, AccordionHeader, AccordionTrigger, AccordionPanel };
