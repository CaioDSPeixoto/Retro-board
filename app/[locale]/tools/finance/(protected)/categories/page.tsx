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
    const customCategories = categories.filter((c) => !builtinSet.has(c));
    const builtinCategories = categories.filter((c) => builtinSet.has(c));

    return (
        <div className="max-w-2xl mx-auto px-6 pb-24 pt-6 space-y-6 animate-fadeIn">

            {/* HEADER — mesmo padrão do FinanceBoardsClient */}
            <div className="flex items-center gap-3">
                <Link
                    href={boardId ? `/${locale}/tools/finance?boardId=${boardId}` : `/${locale}/tools/finance`}
                    className="p-2 -ml-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] rounded-lg transition-all"
                    aria-label={t("backToBoard")}
                >
                    <FiArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-3xl font-extrabold heading-gradient">
                        {t("categoriesTitle")}
                    </h1>
                    <p className="text-[var(--color-text-secondary)] mt-0.5 text-sm">
                        {t("description")}
                    </p>
                </div>
            </div>

            {/* CATEGORIAS CUSTOMIZADAS */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                        {t("customCategoriesLabel")}
                    </h2>
                    <span className="text-xs font-semibold text-[var(--color-text-muted)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-2.5 py-0.5 rounded-full">
                        {customCategories.length}
                    </span>
                </div>

                <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
                    <div className="p-3 border-b border-[var(--color-border-subtle)]">
                        <AddCategoryForm locale={locale} boardId={boardId} />
                    </div>

                    {customCategories.length === 0 ? (
                        <div className="py-10 text-center">
                            <p className="text-[var(--color-text-muted)] text-sm">{t("noCustomCategories")}</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-[var(--color-border-subtle)]">
                            {customCategories.map((category) => (
                                <CategoryItem key={category} category={category} locale={locale} boardId={boardId} />
                            ))}
                        </ul>
                    )}
                </div>
            </section>

            {/* CATEGORIAS PADRÃO */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                        {t("builtinCategoriesLabel")}
                    </h2>
                    <span className="text-xs font-semibold text-[var(--color-text-muted)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-2.5 py-0.5 rounded-full">
                        {builtinCategories.length}
                    </span>
                </div>
                <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
                    <ul className="divide-y divide-[var(--color-border-subtle)]">
                        {builtinCategories.map((category) => (
                            <li key={category} className="px-5 py-3.5 flex items-center justify-between">
                                <span className="text-[var(--color-text-primary)] font-medium text-sm">{category}</span>
                                <span className="text-[10px] font-semibold text-[var(--color-text-muted)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-2 py-0.5 rounded-full uppercase tracking-wide">
                                    {t("builtinLabel")}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </div>
    );
}
