"use client";

import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface AIVerdictCardProps {
  verdict: string;
  action: "Long" | "Short" | "Wait";
  reasoningDetail?: string; // Kept in interface but not used in UI for now
}

export default function AIVerdictCard({ verdict, action }: AIVerdictCardProps) {
  return (
    <div className="animate-slide-up">
      <div className="relative p-[1px] rounded-2xl bg-gradient-to-r from-primary/50 via-purple-500/50 to-primary/50 overflow-hidden shadow-lg shadow-primary/5">
        <div className="relative bg-surface rounded-[15px] p-5 md:p-8">
          <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <div className="flex-1 space-y-4 w-full">
              <div>
                <h3 className="text-xl font-bold text-text-primary mb-3 flex flex-col sm:flex-row sm:items-center gap-2">
                  Trade Verdict
                  <Badge variant="outline" className="text-[10px] uppercase border-primary/20 text-primary bg-primary/5 w-fit">Final Assessment</Badge>
                </h3>
                <div className="bg-background/50 rounded-xl p-4 md:p-0 md:bg-transparent border border-border/50 md:border-0">
                  <p className="text-text-primary/90 text-base md:text-lg leading-relaxed font-medium italic">
                    &quot;{verdict}&quot;
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50 md:border-0 mt-4 md:mt-0">
                <span className="text-sm text-text-muted">Recommended Action:</span>
                <Badge 
                  variant={action === "Long" ? "success" : action === "Short" ? "destructive" : "secondary"}
                  className="text-sm px-3 py-1 font-bold uppercase"
                >
                  {action}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
