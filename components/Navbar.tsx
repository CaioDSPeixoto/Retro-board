"use client";

import Link from "next/link";
import { FiHome } from "react-icons/fi";

export default function Navbar() {
  return (
    <nav className="px-4 py-3 text-base text-gray-700 border-b border-gray-200 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center">
        <Link href="/" className="flex items-center gap-2 hover:text-gray-900">
          <FiHome size={18} />
          <span className="font-medium">Início</span>
        </Link>
      </div>
    </nav>
  );
}
