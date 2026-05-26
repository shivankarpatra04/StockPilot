// filepath: src/app/page.tsx
import Link from "next/link";
import {
  Brain,
  BarChart2,
  Search,
  Activity,
  Sun,
  Shield,
  Zap,
  ArrowRight,
  Check,
  TrendingUp,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

// ─── Feature Cards ────────────────────────────────────────────────────────────
const features = [
  {
    icon: Brain,
    title: "Technical Health Score",
    description:
      "Proprietary multi-factor algorithm scores every stock 0-100 based on momentum, volume, moving averages, and valuation.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: BarChart2,
    title: "Smart Stock Comparison",
    description:
      "Compare up to 3 stocks side-by-side with live data, charts, and System-generated verdicts in seconds.",
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    icon: Search,
    title: "Hidden Opportunities",
    description:
      "Surface early breakouts and smart money entries before the crowd using momentum analysis.",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  {
    icon: Activity,
    title: "Market Mood Meter",
    description:
      "Real-time bullish/bearish sentiment derived from market breadth and top movers.",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  {
    icon: Sun,
    title: "Daily Briefing",
    description:
      "Start every day with a personalized 3-sentence market briefing powered by the system.",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  },
  {
    icon: Shield,
    title: "Risk Detector",
    description:
      "Flag high-risk stocks based on volatility patterns, volume anomalies, and technical breakdowns.",
    color: "text-danger",
    bg: "bg-danger/10",
  },
];

// ─── Pricing Plans ────────────────────────────────────────────────────────────
const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect to get started",
    features: [
      "5 stock searches/day",
      "Compare 2 stocks",
      "Basic technical score",
      "1 watchlist (5 stocks)",
      "Community support",
    ],
    cta: "Get Started Free",
    href: "/auth/signin",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For serious retail investors",
    features: [
      "Unlimited searches",
      "Compare 3 stocks + technical verdict",
      "Full Technical Health Score",
      "5 watchlists (50 stocks)",
      "Daily Briefing",
      "Price alerts",
      "Priority support",
    ],
    cta: "Start Pro Trial",
    href: "/auth/signin",
    highlighted: true,
  },
  {
    name: "Elite",
    price: "$49",
    period: "/month",
    description: "For power traders & advisors",
    features: [
      "Everything in Pro",
      "Unlimited watchlists",
      "Hidden opportunities feed",
      "Advanced risk detector",
      "API access",
      "White-label reports",
      "Dedicated support",
    ],
    cta: "Go Elite",
    href: "/auth/signin",
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-24 px-4">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-secondary/8 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Copy */}
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-primary text-sm font-medium mb-6">
                <Zap className="w-3.5 h-3.5" />
                <span>Powered by Anthropic System</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-tight mb-6">
                Your{" "}
                <span className="gradient-text">Data-Driven</span>
                <br />
                Stock Intelligence
                <br />
                Platform
              </h1>

              <p className="text-lg text-text-muted leading-relaxed mb-8 max-w-xl">
                Compare stocks, get data insights, and discover opportunities —
                built for modern retail investors who want data-driven decisions
                without the noise.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="gap-2 shadow-glow">
                  <Link href="/auth/signin">
                    Get Started Free
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/dashboard">See Demo</Link>
                </Button>
              </div>

              <div className="flex items-center gap-6 mt-10">
                {[
                  { value: "10K+", label: "Investors" },
                  { value: "50+", label: "Markets" },
                  { value: "98%", label: "Uptime" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl font-bold gradient-text">
                      {stat.value}
                    </p>
                    <p className="text-xs text-text-muted">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Glassmorphism mock widget */}
            <div className="relative animate-slide-up hidden lg:block">
              <div className="glass rounded-2xl p-6 shadow-card glow-primary">
                {/* Widget header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold text-text-primary">
                      Technical Score Dashboard
                    </span>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary/20 text-secondary border border-secondary/30">
                    Live
                  </span>
                </div>

                {/* Mock stocks */}
                {[
                  { sym: "RELIANCE:NSE", name: "Reliance Industries", score: 87, change: "+2.4%", positive: true },
                  { sym: "TCS:NSE", name: "Tata Consultancy Services", score: 91, change: "+4.8%", positive: true },
                  { sym: "HDFCBANK:NSE", name: "HDFC Bank", score: 74, change: "+1.1%", positive: true },
                  { sym: "INFY:NSE", name: "Infosys", score: 42, change: "-1.3%", positive: false },
                ].map((stock) => (
                  <div
                    key={stock.sym}
                    className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">
                          {stock.sym.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          {stock.sym}
                        </p>
                        <p className="text-xs text-text-muted">{stock.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm font-medium ${
                          stock.positive ? "text-secondary" : "text-danger"
                        }`}
                      >
                        {stock.change}
                      </span>
                      {/* Score pill */}
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full border ${
                          stock.score >= 80
                            ? "bg-secondary/20 text-secondary border-secondary/40"
                            : stock.score >= 50
                            ? "bg-yellow-400/20 text-yellow-400 border-yellow-400/40"
                            : "bg-danger/20 text-danger border-danger/40"
                        }`}
                      >
                        {stock.score}
                      </span>
                    </div>
                  </div>
                ))}

                {/* AI insight line */}
                <div className="mt-4 p-3 rounded-button bg-primary/10 border border-primary/20">
                  <div className="flex items-start gap-2">
                    <Brain className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-text-muted">
                      <span className="text-primary font-medium">Trade Verdict:</span>{" "}
                      TCS:NSE shows strongest momentum with high volume and both MAs
                      aligned positively.
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating decorative badge */}
              <div className="absolute -top-4 -right-4 glass rounded-xl px-3 py-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-secondary" />
                <span className="text-xs font-semibold text-secondary">
                  +18.4%
                </span>
              </div>
              <div className="absolute -bottom-4 -left-4 glass rounded-xl px-3 py-2 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-semibold text-text-primary">
                  Strong Buy
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              Everything you need to invest{" "}
              <span className="gradient-text">smarter</span>
            </h2>
            <p className="text-text-muted max-w-2xl mx-auto">
              Six powerful data-driven tools in one platform, designed to give
              retail investors the edge that was previously only available to
              institutions.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="group hover:border-primary/40 hover:shadow-glow hover:-translate-y-1 transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <div
                      className={`w-11 h-11 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}
                    >
                      <Icon className={`w-5 h-5 ${feature.color}`} />
                    </div>
                    <h3 className="font-semibold text-text-primary mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-text-muted leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-4 bg-surface/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              Simple, transparent{" "}
              <span className="gradient-text">pricing</span>
            </h2>
            <p className="text-text-muted">
              Start free. Upgrade when you need more power.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative flex flex-col transition-all duration-300 ${
                  plan.highlighted
                    ? "border-primary shadow-glow scale-105"
                    : "hover:border-border/80 hover:-translate-y-1"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-gradient-primary text-white text-xs font-bold shadow-glow">
                      Most Popular
                    </span>
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-4xl font-bold text-text-primary">
                      {plan.price}
                    </span>
                    <span className="text-text-muted text-sm">
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted">{plan.description}</p>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 flex-1 mb-6">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-text-muted">{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    variant={plan.highlighted ? "default" : "outline"}
                    className="w-full"
                  >
                    <Link href={plan.href}>{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold gradient-text">StockPilot</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-text-muted">
              <Link href="#" className="hover:text-text-primary transition-colors">
                Privacy
              </Link>
              <Link href="#" className="hover:text-text-primary transition-colors">
                Terms
              </Link>
              <Link href="#" className="hover:text-text-primary transition-colors">
                Contact
              </Link>
            </div>
            <p className="text-sm text-text-muted">
              Built for retail investors 🚀
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
