"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { loginAction } from "./actions";
import Link from "next/link";
import { useTranslations } from "next-intl";

type Props = {
    locale: string;
};

export default function LoginForm({ locale }: Props) {
    const t = useTranslations("FinanceLogin");
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        let userId = "";

        try {
            // 1. Check Admin Bypass
            if (email === "admin@gmail.com" && password === "admin") {
                await loginAction("admin@gmail.com", locale);
                return;
            }

            // 2. Firebase Auth
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                userId = userCredential.user.uid;
            } catch (firebaseError: any) {
                console.error("Firebase Login Error", firebaseError);
                if (firebaseError.code === 'auth/invalid-credential' || firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password') {
                    setError(t("errors.invalid"));
                } else {
                    setError(t("errors.general"));
                }
                setLoading(false);
                return; // Stop if firebase login fails
            }

        } catch (e) {
            console.error("Login unexpected error", e);
            setError(t("errors.general"));
            setLoading(false);
            return;
        }

        // 3. Server Action (outside try/catch to allow redirect)
        if (userId) {
            await loginAction(userId, locale);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {error && (
                <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg border border-red-100">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("emailUserLabel")}
                </label>
                <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: seu@email.com"
                    required
                    autoFocus
                    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-gray-900"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("passwordLabel")}
                </label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-gray-900"
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition shadow-lg shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {loading ? t("loading") : t("submitButton")}
            </button>

            <div className="text-center mt-4">
                <p className="text-sm text-gray-500">
                    {t("noAccount")}{" "}
                    <Link href={`/${locale}/tools/finance/register`} className="text-blue-600 font-bold hover:underline">
                        {t("registerLink")}
                    </Link>
                </p>
            </div>
        </form>
    );
}
