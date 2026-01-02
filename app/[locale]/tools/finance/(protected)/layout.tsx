import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function FinanceLayout({
  children,
  params
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
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
