"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import {
  User,
  Lock,
  SlidersHorizontal,
  Crown,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Mail,
  Calendar,
} from "lucide-react";

interface SettingsDashboardProps {
  email: string;
  name: string;
  plan: "FREE" | "PRO";
  memberSince: string;
}

const TIMEFRAMES = [
  { days: 1, label: "1D" },
  { days: 7, label: "7D" },
  { days: 15, label: "15D" },
  { days: 30, label: "30D" },
  { days: 60, label: "60D" },
  { days: 90, label: "90D" },
];

type Status = { type: "success" | "error"; message: string } | null;

function StatusNote({ status }: { status: Status }) {
  if (!status) return null;
  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-xs font-medium",
        status.type === "success" ? "text-secondary" : "text-danger"
      )}
    >
      {status.type === "success" ? (
        <CheckCircle2 className="w-3.5 h-3.5" />
      ) : (
        <AlertTriangle className="w-3.5 h-3.5" />
      )}
      {status.message}
    </p>
  );
}

export default function SettingsDashboard({
  email,
  name: initialName,
  plan,
  memberSince,
}: SettingsDashboardProps) {
  const router = useRouter();
  const { analysisDays, setAnalysisDays, isSimpleMode, setSimpleMode } =
    useAppStore();

  // Profile
  const [name, setName] = useState(initialName);
  const [savingName, setSavingName] = useState(false);
  const [nameStatus, setNameStatus] = useState<Status>(null);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<Status>(null);

  // Delete account
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<Status>(null);

  const memberSinceLabel = new Date(memberSince).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleSaveName = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameStatus({ type: "error", message: "Name cannot be empty" });
      return;
    }
    setSavingName(true);
    setNameStatus(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update name");
      setNameStatus({ type: "success", message: "Display name updated" });
      router.refresh();
    } catch (err) {
      setNameStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      setPasswordStatus({
        type: "error",
        message: "New password must be at least 8 characters",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: "error", message: "New passwords do not match" });
      return;
    }
    setSavingPassword(true);
    setPasswordStatus(null);
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");
      setPasswordStatus({ type: "success", message: "Password updated" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    setDeleteStatus(null);
    try {
      const res = await fetch("/api/user", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete account");
      // Clear locally persisted preferences, then sign out.
      localStorage.removeItem("stockpilot-app-store");
      await signOut({ callbackUrl: "/" });
    } catch (err) {
      setDeleteStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Something went wrong",
      });
      setDeleting(false);
    }
  };

  return (
    <div className="grid gap-8 max-w-3xl">
      {/* Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <CardTitle>Profile</CardTitle>
          </div>
          <CardDescription>
            Your display name appears across the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Display Name
            </label>
            <Input
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Email
            </label>
            <div className="flex items-center gap-2 h-10 px-3 rounded-button border border-border bg-surface/50 text-sm text-text-muted">
              <Mail className="w-3.5 h-3.5" />
              {email}
              <span className="ml-auto text-[10px] uppercase tracking-wider">
                Read only
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button
              onClick={handleSaveName}
              disabled={savingName || name.trim() === initialName.trim()}
            >
              {savingName && <Loader2 className="w-4 h-4 animate-spin" />}
              Save changes
            </Button>
            <StatusNote status={nameStatus} />
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            <CardTitle>Preferences</CardTitle>
          </div>
          <CardDescription>
            Defaults for how analysis is shown. Saved on this device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Default analysis timeframe
            </label>
            <div className="flex flex-wrap gap-2">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.days}
                  onClick={() => setAnalysisDays(tf.days)}
                  className={cn(
                    "px-4 py-2 rounded-button text-sm font-bold border transition-all",
                    analysisDays === tf.days
                      ? "bg-primary text-white border-primary shadow-glow"
                      : "bg-surface text-text-muted border-border hover:text-text-primary hover:border-primary"
                  )}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Language &amp; how the app explains things
            </label>
            <div className="flex bg-background border border-border p-1 rounded-xl w-full max-w-xs">
              <button
                onClick={() => setSimpleMode(false)}
                className={cn(
                  "flex-1 px-3 py-2 text-xs font-bold rounded-lg transition-colors",
                  !isSimpleMode
                    ? "bg-primary text-white shadow-sm"
                    : "text-text-muted hover:text-text-primary"
                )}
              >
                English
              </button>
              <button
                onClick={() => setSimpleMode(true)}
                className={cn(
                  "flex-1 px-3 py-2 text-xs font-bold rounded-lg transition-colors",
                  isSimpleMode
                    ? "bg-primary text-white shadow-sm"
                    : "text-text-muted hover:text-text-primary"
                )}
              >
                Hinglish 🇮🇳
              </button>
            </div>
            <p className="text-xs text-text-muted">
              <span className="font-semibold text-text-primary">English</span> —
              simple, beginner-friendly English; tricky terms are explained right
              where they appear.{" "}
              <span className="font-semibold text-text-primary">Hinglish</span> —
              easy Hindi + English with emojis, so everything is simple to follow.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            <CardTitle>Security</CardTitle>
          </div>
          <CardDescription>
            Change your password. Use at least 8 characters.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Current password
            </label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
                New password
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Confirm new password
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <Button
              onClick={handleChangePassword}
              disabled={
                savingPassword ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
            >
              {savingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
              Update password
            </Button>
            <StatusNote status={passwordStatus} />
          </div>
        </CardContent>
      </Card>

      {/* Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-primary" />
            <CardTitle>Plan</CardTitle>
          </div>
          <CardDescription>Your current subscription tier.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge
                  className={cn(
                    plan === "PRO"
                      ? "bg-primary/20 text-primary border-primary/30"
                      : "bg-surface text-text-muted border-border"
                  )}
                >
                  {plan} PLAN
                </Badge>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-text-muted">
                <Calendar className="w-3.5 h-3.5" />
                Member since {memberSinceLabel}
              </p>
            </div>
            {plan === "FREE" && (
              <Button variant="secondary" disabled title="Coming soon">
                Upgrade to Pro
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-danger/40">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-danger" />
            <CardTitle className="text-danger">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Permanently delete your account, watchlists, and alerts. This cannot
            be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Type <span className="text-danger font-mono">DELETE</span> to
              confirm
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="max-w-xs"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={confirmText !== "DELETE" || deleting}
            >
              {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete my account
            </Button>
            <StatusNote status={deleteStatus} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
