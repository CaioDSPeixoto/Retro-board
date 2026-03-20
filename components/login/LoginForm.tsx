"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { loginAction } from "@/app/[locale]/tools/finance/login/actions";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Spinner from "@/components/ui/Spinner";

type Props = {
  locale: string;
};

export default function LoginForm({ locale }: Props) {
  const t = useTranslations("FinanceLogin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    // 1) Firebase login (aqui sim é onde pode ser "email/senha inválidos")
    let idToken = "";
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      idToken = await userCredential.user.getIdToken(true);
    } catch (firebaseError: any) {
      const code = firebaseError?.code;
      if (
        code === "auth/invalid-credential" ||
        code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-email"
      ) {
        setError(t("errors.invalid"));
      } else {
        setError(t("errors.general"));
      }

      setLoading(false);
      return;
    }

    if (!idToken) {
      setError(t("errors.general"));
      setLoading(false);
      return;
    }

    await loginAction(idToken, locale);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="text-red-500 text-sm p-3 rounded-lg border border-red-300/40" style={{ background: "var(--color-surface-raised)" }}>
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
          {t("emailUserLabel")}
        </label>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("emailPlaceholder")}
          required
          autoFocus
          className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          style={{
            background: "var(--color-surface-raised)",
            borderColor: "var(--color-border)",
            color: "var(--color-text-primary)",
          }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
          {t("passwordLabel")}
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("passwordPlaceholder")}
          required
          className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          style={{
            background: "var(--color-surface-raised)",
            borderColor: "var(--color-border)",
            color: "var(--color-text-primary)",
          }}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && <Spinner size="md" color="white" />}
        {loading ? t("loading") : t("submitButton")}
      </button>

      <div className="text-center mt-4">
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          {t("noAccount")}{" "}
          <Link
            href={`/${locale}/tools/finance/register`}
            className="text-blue-500 font-bold hover:underline"
          >
            {t("registerLink")}
          </Link>
        </p>
      </div>
    </form>
  );
}