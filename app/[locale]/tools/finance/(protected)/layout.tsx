export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import PrivacyProvider from "@/components/finance/PrivacyProvider";

export default async function FinanceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();

  if (!session) {
    redirect(`/${locale}/tools/finance/login`);
  }

  return (
    <PrivacyProvider>
      <div className="min-h-screen">{children}</div>
    </PrivacyProvider>
  );
}
