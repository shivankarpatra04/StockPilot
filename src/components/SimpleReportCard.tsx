import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, Bell, HelpCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface SimpleReportCardProps {
  symbol: string;
  action: "Long" | "Short" | "Wait";
  verdict: string;
  currentPrice?: number;
  stopLoss?: number;
  target?: number;
}

export default function SimpleReportCard({ 
  symbol, 
  action, 
  currentPrice,
  stopLoss,
  target 
}: SimpleReportCardProps) {
  
  // Simple English logic based on action
  let heading = "";
  let description = "";
  let badgeColor = "";
  let icon = null;

  if (action === "Long") {
    heading = "Good Time to Buy";
    description = `This stock is currently in a great price range. If you are thinking of buying, around ₹${currentPrice || "the current price"} is a good entry point. To protect yourself from big losses, set a stop-loss at ₹${stopLoss || "a lower price"} and aim for a target of ₹${target || "a higher price"}.`;
    badgeColor = "bg-success/20 text-success border-success/30";
    icon = "✅";
  } else if (action === "Short") {
    heading = "Consider Selling";
    description = `This stock is showing signs of weakness right now. If you already own it, it might be a good time to take your profits and sell. If you don't own it, it's best to avoid buying it right now.`;
    badgeColor = "bg-danger/20 text-danger border-danger/30";
    icon = "⚠️";
  } else {
    heading = "Wait and Watch";
    description = `The stock doesn't have a clear direction right now. It could go up or down. The smartest move right now is to just wait. Keep an eye on it and buy when a clearer opportunity appears.`;
    badgeColor = "bg-warning/20 text-warning border-warning/30";
    icon = "🤔";
  }

  return (
    <Card className="border-primary/40 bg-primary/5 shadow-lg shadow-primary/5 animate-slide-down relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl" aria-hidden="true">{icon}</span>
              <h2 className="text-2xl font-bold text-text-primary">What Should You Do?</h2>
              <Badge className={`ml-2 px-3 py-1 font-bold ${badgeColor}`} variant="outline">
                {heading}
              </Badge>
            </div>
            
            <div className="bg-background/60 rounded-xl p-5 border border-border/50 text-text-primary/90 text-lg leading-relaxed font-medium">
              {description}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border/50 flex flex-wrap items-center gap-3">
          {action === "Long" && (
            <Link href="/dashboard/opportunities">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Find similar stocks <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
          <Link href="/dashboard/alerts">
            <Button variant="outline" className="border-border hover:bg-card">
              <Bell className="w-4 h-4 mr-2" /> Set Alert for this Stock
            </Button>
          </Link>
          <Button variant="ghost" className="text-text-muted hover:text-text-primary">
            <HelpCircle className="w-4 h-4 mr-2" /> How did we decide this?
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
