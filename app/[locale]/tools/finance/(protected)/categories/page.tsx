import { getCategoriesData } from "../data";
import { BUILTIN_CATEGORIES } from "@/lib/finance/constants";
import { FiArrowLeft } from "react-icons/fi";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CategoryItem } from "./CategoryItem";
import { AddCategoryForm } from "./AddCategoryForm";

export default async function CategoriesPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ boardId?: string }>;
}) {
    const { locale } = await params;
    const { boardId } = await searchParams;
    const categories = await getCategoriesData(boardId);
    const t = await getTranslations({ locale, namespace: "Finance" });

    const builtinSet = new Set(BUILTIN_CATEGORIES);

    return (
        <div className="max-w-2xl mx-auto px-6 pb-24 pt-8">
            <header className="mb-8 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href={boardId ? `/${locale}/tools/finance?boardId=${boardId}` : `/${locale}/tools/finance`}
                        className="p-2 -ml-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-all"
                        aria-label={t("backToBoard")}
                    >
                        <FiArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{t("categoriesTitle")}</h1>
                        <p className="text-gray-500 mt-1 text-sm">
                            {boardId ? t("customCategoriesLabel") : t("description")}
                        </p>
                    </div>
                </div>
            </header>

            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            {t("customCategoriesLabel")}
                        </h2>
                        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {categories.filter((c) => !builtinSet.has(c)).length}
                        </span>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-2 border-b border-gray-50 bg-gray-50/50">
                            <AddCategoryForm locale={locale} boardId={boardId} />
                        </div>

                        {categories.filter((c) => !builtinSet.has(c)).length === 0 ? (
                            <div className="p-8 text-center bg-white">
                                <p className="text-gray-400 text-sm mb-1">{t("noCustomCategories")}</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {categories
                                    .filter((c) => !builtinSet.has(c))
                                    .map((category) => (
                                        <CategoryItem key={category} category={category} locale={locale} boardId={boardId} />
                                    ))}
                            </ul>
                        )}
                    </div>
                </section>

                <section>
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">
                        {t("builtinCategoriesLabel")}
                    </h2>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <ul className="divide-y divide-gray-100">
                            {categories
                                .filter((c) => builtinSet.has(c))
                                .map((category) => (
                                    <li key={category} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className="text-gray-700 font-medium">{category}</span>
                                        </div>
                                        <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-full uppercase tracking-wide">
                                            {t("builtinLabel")}
                                        </span>
                                    </li>
                                ))}
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    );
}


