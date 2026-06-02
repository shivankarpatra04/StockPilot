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
  
  // Hinglish guidance based on the action (Simple mode is for users who are
  // more comfortable in Hindi + English than in pure English).
  let heading = "";
  let description = "";
  let badgeColor = "";
  let icon = null;

  if (action === "Long") {
    heading = "Khareedne ka accha time 👍";
    description = `Ye stock abhi acche daam par hai. Agar khareedna chahte ho, toh lagbhag ₹${currentPrice || "current price"} ke aaspaas khareedna theek rahega. Bade nuksan se bachne ke liye ₹${stopLoss || "thoda neeche"} par stop-loss laga do (yahan pe bech do agar daam gir jaaye), aur ₹${target || "thoda upar"} ko target rakho (yahan profit le lo). Par pehle apne advisor se zaroor poochho 🙏`;
    badgeColor = "bg-success/20 text-success border-success/30";
    icon = "✅";
  } else if (action === "Short") {
    heading = "Bechne ke baare me socho ⚠️";
    description = `Ye stock abhi thoda kamzor lag raha hai. Agar ye aapke paas hai, toh profit lekar bechna acchi idea ho sakti hai. Agar nahi hai, toh abhi khareedne se bacho. Koi bhi kadam apne advisor se poochh kar hi uthana 🙏`;
    badgeColor = "bg-danger/20 text-danger border-danger/30";
    icon = "⚠️";
  } else {
    heading = "Ruko aur dekho 🤔";
    description = `Is stock ki direction abhi saaf nahi hai — upar bhi ja sakta hai, neeche bhi. Sabse samajhdaari ki baat abhi intezaar karna hai. Ispar nazar rakho aur jab saaf mauka dikhe tabhi khareedo.`;
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
              <h2 className="text-2xl font-bold text-text-primary">Aapko kya karna chahiye? 🤷</h2>
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
                Aise hi aur stocks dhoondho <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
          <Link href="/dashboard/alerts">
            <Button variant="outline" className="border-border hover:bg-card">
              <Bell className="w-4 h-4 mr-2" /> Is stock ka alert lagao 🔔
            </Button>
          </Link>
          <Button variant="ghost" className="text-text-muted hover:text-text-primary">
            <HelpCircle className="w-4 h-4 mr-2" /> Humne ye kaise socha?
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
