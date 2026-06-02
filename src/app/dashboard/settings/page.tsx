import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SettingsDashboard from "@/components/SettingsDashboard";
import { Settings as SettingsIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true, plan: true, createdAt: true },
  });

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <SettingsIcon className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">
              Account
            </span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
          <p className="text-text-muted text-sm mt-1">
            Manage your profile, security, and how StockPilot works for you.
          </p>
        </div>
      </div>

      <SettingsDashboard
        email={user.email}
        name={user.name ?? ""}
        plan={user.plan}
        memberSince={user.createdAt.toISOString()}
      />
    </div>
  );
}
