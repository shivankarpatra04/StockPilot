// filepath: src/components/DashboardSectionHeader.tsx
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardSectionHeaderProps {
  number: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
  badge?: ReactNode;
}

export default function DashboardSectionHeader({
  number,
  title,
  subtitle,
  icon,
  action,
  className,
  badge
}: DashboardSectionHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40 group", className)}>
      <div className="flex items-start gap-4">
        {/* Decorative Number and Glowing Icon Container */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-3xl font-black text-primary/10 select-none tracking-tighter transition-colors duration-300 group-hover:text-primary/25 leading-none">
            {number}
          </span>
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-surface border border-border/80 flex items-center justify-center text-primary shadow-inner group-hover:border-primary/40 group-hover:bg-primary/5 transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                {icon}
              </div>
            </div>
          )}
        </div>

        {/* Title, Badge and Subtitle */}
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg md:text-xl font-extrabold text-text-primary tracking-tight transition-colors duration-300 group-hover:text-white">
              {title}
            </h2>
            {badge && (
              <div className="animate-in fade-in duration-300">
                {badge}
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-text-muted font-medium transition-colors duration-300 group-hover:text-text-muted/90">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Action Area (e.g., filter buttons, navigation links) */}
      {action && (
        <div className="flex items-center self-end sm:self-center animate-in fade-in duration-300">
          {action}
        </div>
      )}
    </div>
  );
}
