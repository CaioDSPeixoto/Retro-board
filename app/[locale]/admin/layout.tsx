export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getUserProfile } from "@/lib/auth/user-profile";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const userId = await getSession();

  if (!userId) {
    redirect(`/${locale}/tools/finance/login`);
  }

  const profile = await getUserProfile(userId);

  if (!profile || profile.role !== "admin") {
    redirect(`/${locale}`);
  }

  return <div className="min-h-screen">{children}</div>;
}
