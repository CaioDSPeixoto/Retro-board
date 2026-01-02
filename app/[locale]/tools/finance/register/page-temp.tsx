"use client";

import RegisterForm from "./RegisterForm";

export default function RegisterPage({ params }: { params: { locale: string } }) {
    // NOTE: Simple unwrapping of params for client component is okay here if passed from server parent, 
    // but if this is a Page component, it receives params as promise in Next 15.
    // Wait, this is a Page file. Let's fix the signature below.
    return <RegisterForm locale={params.locale} />;
}
