export const dynamic = "force-dynamic";

import { getTranslations } from "next-intl/server";
import { listAllUsers } from "@/lib/auth/user-profile";
import AdminClient from "@/components/admin/AdminClient";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Admin");
  const users = await listAllUsers();

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-extrabold mb-2 heading-gradient">
        {t("title")}
      </h1>
      <p className="mb-8" style={{ color: "var(--color-text-secondary)" }}>
        {t("description")}
      </p>
      <AdminClient initialUsers={users} locale={locale} />
    </div>
  );
}
