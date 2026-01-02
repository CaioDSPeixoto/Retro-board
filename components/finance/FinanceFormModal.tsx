// components/finance/FinanceFormModal.tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { FiX } from "react-icons/fi";
import {
  addFinanceItem,
  createCategory,
} from "@/app/[locale]/tools/finance/(protected)/actions";
import { useRouter } from "next/navigation";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
  initialCategories: string[];
};

export default function FinanceFormModal({
  isOpen,
  onClose,
  locale,
  initialCategories,
}: Props) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [category, setCategory] = useState<string>(
    initialCategories[0] || "Contas Fixas",
  );
  const [newCategory, setNewCategory] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (!initialCategories || initialCategories.length === 0) return;
    setCategories(initialCategories);

    if (!initialCategories.includes(category)) {
      setCategory(initialCategories[0]);
    }
  }, [initialCategories]);

  if (!isOpen) return null;

  const handleAddCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;

    setAddingCategory(true);
    setError(null);

    const res = await createCategory(name, locale);

    setAddingCategory(false);

    if (res && "error" in res && res.error) {
      setError(res.error as string);
      return;
    }

    setCategories((prev) =>
      prev.includes(name) ? prev : [...prev, name],
    );
    setCategory(name);
    setNewCategory("");

    startTransition(() => {
      router.refresh();
    });
  };

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError(null);

    formData.append("locale", locale);
    formData.append("category", category);

    const res = await addFinanceItem(formData);

    setLoading(false);

    if (res && "error" in res && res.error) {
      setError(res.error as string);
      return;
    }

    startTransition(() => {
      router.refresh();
    });

    onClose();
  };

  const showFixedOption =
    type === "expense" && category === "Contas Fixas";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      {/* ... resto igual ao que você já tinha (inputs, checkbox, botão, etc.) */}
      {/* garanta que o <form> está com action={handleSubmit} */}
    </div>
  );
}
