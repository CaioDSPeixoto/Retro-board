"use client";

import Link from "next/link";
import { FiHome ,FiInfo } from "react-icons/fi";

const appVersion = process.env.APP_VERSION || "v0.0.0";

export default function Navbar() {
  return (
    <nav className="px-4 py-3 text-base text-gray-700 border-b border-gray-200 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:text-gray-900">
          <FiHome size={18} />
          <span className="font-medium">Início</span>
        </Link>

        <div className="flex items-center gap-1 text-gray-400 text-sm">
          <Link 
          href="/releases"
          className="flex items-center gap-1 text-gray-400 text-sm hover:text-gray-900 transition-colors"
          title={`Versão: v${appVersion}`}>
            <FiInfo size={16} title={`Versão: v${appVersion}`} className="cursor-help" />
          </Link>
          <span>v{appVersion}</span>
        </div>
      </div>
    </nav>
  );
}