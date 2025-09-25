import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scrum Retrospectiva",
  description: "Quadro de retrospectiva colaborativo em tempo real",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
