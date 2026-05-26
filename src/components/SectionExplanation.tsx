"use client";

import { useState } from "react";
import { Info, ChevronDown, ChevronUp } from "lucide-react";

interface SectionExplanationProps {
  title: string;
  children: React.ReactNode;
}

export function SectionExplanation({ title, children }: SectionExplanationProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-primary/10 transition-colors text-left"
      >
        <div className="flex items-center gap-2 text-primary font-medium">
          <Info className="w-5 h-5 shrink-0" />
          <span>{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-primary shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-primary shrink-0" />
        )}
      </button>
      
      {isOpen && (
        <div className="p-4 pt-0 text-sm text-text-muted leading-relaxed border-t border-primary/10">
          {children}
        </div>
      )}
    </div>
  );
}
