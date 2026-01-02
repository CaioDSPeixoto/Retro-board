"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { loginAction } from "../login/actions"; // Reusing the login action to set cookie
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function RegisterPage({ params }: { params: { locale: string } }) {
    // NOTE: Simple unwrapping of params for client component is okay here if passed from server parent, 
    // but if this is a Page component, it receives params as promise in Next 15.
    // Wait, this is a Page file. Let's fix the signature below.
    return <RegisterForm locale={params.locale} />;
}
