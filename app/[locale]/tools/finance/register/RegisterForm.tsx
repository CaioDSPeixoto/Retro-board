"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { loginAction } from "../login/actions";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function RegisterForm({ locale }: { locale: string }) {
    const t = useTranslations("FinanceRegister");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (password !== confirmPassword) {
            setError(t("errors.match"));
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError(t("errors.length"));
            setLoading(false);
            return;
        }

        let userId = "";

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            userId = userCredential.user.uid;

        } catch (firebaseError: any) {
            console.error("Firebase Register Error", firebaseError);
            if (firebaseError.code === 'auth/email-already-in-use') {
                setError(t("errors.inUse"));
            } else if (firebaseError.code === 'auth/invalid-email') {
                setError(t("errors.invalid"));
            } else {
                setError(t("errors.general"));
            }
            setLoading(false);
            return;
        }

        // Auto login after register (outside try/catch)
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
                    {t("emailLabel")}
                </label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
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

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("confirmPasswordLabel")}
                </label>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                    {t("hasAccount")}{" "}
                    <Link href={`/${locale}/tools/finance/login`} className="text-blue-600 font-bold hover:underline">
                        {t("loginLink")}
                    </Link>
                </p>
            </div>
        </form>
    );
}
