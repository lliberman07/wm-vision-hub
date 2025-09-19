import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-12 items-center justify-center rounded-xl bg-white/90 backdrop-blur-sm p-1 text-muted-foreground shadow-lg border border-sky-100/50",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const value = props.value;
  let activeClass = "";
  
  if (value === "items") {
    activeClass = "data-[state=active]:bg-sky-100 data-[state=active]:text-sky-800 data-[state=active]:shadow-lg data-[state=active]:shadow-sky-200/50";
  } else if (value === "financing") {
    activeClass = "data-[state=active]:bg-sky-200 data-[state=active]:text-sky-800 data-[state=active]:shadow-lg data-[state=active]:shadow-sky-300/50";
  } else if (value === "results") {
    activeClass = "data-[state=active]:bg-sky-300 data-[state=active]:text-sky-900 data-[state=active]:shadow-lg data-[state=active]:shadow-sky-400/50";
  }

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 py-2.5 text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-slate-600 hover:text-sky-700 hover:bg-sky-50/80",
        activeClass,
        className
      )}
      {...props}
    />
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
