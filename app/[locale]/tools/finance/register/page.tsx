import RegisterForm from "./RegisterForm";
import { getTranslations } from "next-intl/server";

export default async function RegisterPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations("FinanceRegister");

    return (
        <div className="flex-1 flex items-center justify-center p-4 py-12">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-blue-600 mb-2">
                        {t("title")}
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {t("description")}
                    </p>
                </div>

                <RegisterForm locale={locale} />
            </div>
        </div>
    );
}
