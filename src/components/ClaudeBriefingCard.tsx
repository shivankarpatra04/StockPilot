// filepath: src/components/ClaudeBriefingCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, RefreshCw, Volume2, VolumeX, Play, Pause, Square, CheckCircle2, Circle, ListTodo } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { modeFromSimple, t } from "@/lib/lang";

interface BulletPoint {
  label: string;
  text: string;
}

interface ChecklistItem {
  id: string;
  text: string;
}

interface BriefingData {
  mode: "simple" | "expert";
  title: string;
  summary: string;
  bulletPoints: BulletPoint[];
  checklist: ChecklistItem[];
}

export default function ClaudeBriefingCard() {
  const { isSimpleMode, analysisDays } = useAppStore();
  const [data, setData] = useState<BriefingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Audio state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const fetchBriefing = useCallback(async () => {
    setIsLoading(true);
    // Cancel any ongoing speech when fetching new briefing
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
    try {
      const res = await fetch(
        `/api/claude/briefing?mode=${isSimpleMode ? "simple" : "expert"}&days=${analysisDays}`
      );
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
      // Reset checklist states for the new timeframe / mode briefing
      setCheckedItems({});
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [isSimpleMode, analysisDays]);

  useEffect(() => {
    fetchBriefing();
  }, [fetchBriefing]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Text to Speech logic
  const handleToggleSpeech = () => {
    if (!data) return;

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Your browser does not support text-to-speech features.");
      return;
    }

    const synth = window.speechSynthesis;

    if (isSpeaking) {
      if (isPaused) {
        synth.resume();
        setIsPaused(false);
      } else {
        synth.pause();
        setIsPaused(true);
      }
    } else {
      synth.cancel();

      const textParts = [
        data.title,
        data.summary,
        ...data.bulletPoints.map(b => `${b.label}. ${b.text}`),
        "Daily Checklist tasks:",
        ...data.checklist.map(c => c.text)
      ];

      const utterance = new SpeechSynthesisUtterance(textParts.join(" "));
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };

      setIsSpeaking(true);
      setIsPaused(false);
      synth.speak(utterance);
    }
  };

  const handleStopSpeech = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Calculate Progress Metrics
  const totalChecks = data?.checklist?.length || 0;
  const completedChecks = data?.checklist?.filter(c => checkedItems[c.id]).length || 0;
  const progressPercent = totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0;

  return (
    <Card className="border border-border/80 hover:border-primary/20 transition-all duration-300 bg-surface/40 backdrop-blur-sm shadow-xl relative overflow-hidden group">
      {/* Decorative top ambient glow line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center relative flex-shrink-0">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm font-extrabold text-text-primary leading-snug">Briefing Overview & Focus Tasks</CardTitle>
              <p className="text-[10px] text-text-muted mt-0.5 truncate">
                {t(modeFromSimple(isSimpleMode), "briefingMode")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {/* Audio Reader Controls */}
            {data && (
              <div className="flex items-center gap-1.5 bg-card/60 border border-border/60 rounded-lg p-1">
                <button
                  onClick={handleToggleSpeech}
                  className={`p-1 rounded text-xs flex items-center gap-1 font-bold transition-all ${
                    isSpeaking
                      ? "text-primary bg-primary/10 hover:bg-primary/20"
                      : "text-text-muted hover:text-text-primary hover:bg-white/5"
                  }`}
                  title={isSpeaking ? (isPaused ? "Resume Speech" : "Pause Speech") : "Read Aloud"}
                  aria-label={isSpeaking ? (isPaused ? "Resume Speech" : "Pause Speech") : "Read Aloud"}
                >
                  {isSpeaking && !isPaused ? (
                    <>
                      <Pause className="w-3.5 h-3.5 animate-pulse" />
                      <span className="text-[9px] hidden sm:inline">Pause</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span className="text-[9px] hidden sm:inline">Listen</span>
                    </>
                  )}
                </button>
                {isSpeaking && (
                  <button
                    onClick={handleStopSpeech}
                    className="p-1 rounded text-red-400 hover:bg-red-500/10 transition-all"
                    title="Stop Reading"
                    aria-label="Stop Reading"
                  >
                    <Square className="w-3.5 h-3.5 fill-red-400/20" />
                  </button>
                )}
              </div>
            )}

            <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary font-extrabold uppercase tracking-wider">
              System
            </span>

            <button
              onClick={fetchBriefing}
              disabled={isLoading}
              className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
              aria-label="Refresh briefing"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {isLoading ? (
          <div className="space-y-3 py-4">
            <div className="h-4 bg-border/40 rounded animate-pulse w-full" />
            <div className="h-4 bg-border/40 rounded animate-pulse w-5/6" />
            <div className="h-4 bg-border/40 rounded animate-pulse w-4/5" />
          </div>
        ) : data ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Title & Summary */}
            <div className="space-y-2">
              <h3 className="text-base font-black text-text-primary leading-tight">
                {data.title}
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                {data.summary}
              </p>
            </div>

            {/* Bullet Points Grid */}
            {data.bulletPoints.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.bulletPoints.map((bullet, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 rounded-xl border border-border/50 bg-card/20 hover:bg-primary/5 hover:border-primary/20 transition-all duration-200 cursor-default"
                  >
                    <span className="text-xs font-black text-text-primary uppercase tracking-wide flex items-center gap-1.5">
                      {bullet.label}
                    </span>
                    <p className="text-[10px] text-text-muted mt-1.5 leading-relaxed">
                      {bullet.text}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Interactive Checklist section */}
            {data.checklist.length > 0 && (
              <div className="border-t border-border/40 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                    <ListTodo className="w-3.5 h-3.5 text-primary" /> Today's Focus Action Checklist
                  </span>
                  <span className="text-[10px] text-text-muted font-semibold bg-white/5 px-2 py-0.5 border border-white/10 rounded">
                    {completedChecks}/{totalChecks} Completed
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="bg-border/40 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-300 rounded-full shadow-glow" 
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Checklist Rows */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                  {data.checklist.map(item => {
                    const isChecked = !!checkedItems[item.id];
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleCheck(item.id)}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                          isChecked 
                            ? "bg-primary/5 border-primary/20 opacity-70" 
                            : "bg-card/30 border-border/40 hover:border-border/80 hover:bg-card/50"
                        }`}
                      >
                        <button className="mt-0.5 flex-shrink-0 transition-colors">
                          {isChecked ? (
                            <CheckCircle2 className="w-4 h-4 text-primary fill-primary/10" />
                          ) : (
                            <Circle className="w-4 h-4 text-text-muted" />
                          )}
                        </button>
                        <span className={`text-[10px] font-medium leading-normal text-text-primary ${isChecked ? "line-through text-text-muted" : ""}`}>
                          {item.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Last Updated */}
            {lastUpdated && (
              <div className="text-[9px] text-text-muted/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-t border-border/20 pt-2.5">
                <span>Updated today at {lastUpdated.toLocaleTimeString()}</span>
                <span>Deterministic Analysis Engine</span>
              </div>
            )}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-text-muted">
            Briefing data not loaded.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
