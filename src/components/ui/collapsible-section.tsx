"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleSection({ title, children, defaultOpen = true }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="space-y-4">
      <div 
        className="flex items-center space-x-2 cursor-pointer group w-fit"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full p-0 hover:bg-muted">
          {isOpen ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          )}
        </Button>
        <h2 className="text-2xl font-semibold select-none group-hover:text-foreground transition-colors">{title}</h2>
      </div>
      
      <div className={isOpen ? "block animate-in fade-in slide-in-from-top-2 duration-200" : "hidden"}>
        {children}
      </div>
    </div>
  );
}
