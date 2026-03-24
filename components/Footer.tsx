"use client";

import { FaGithub, FaLinkedin } from "react-icons/fa";
import { FiExternalLink } from "react-icons/fi";

const profileName = process.env.NEXT_PUBLIC_PROFILE_NAME || "Desenvolvedor";
const githubUrl = process.env.NEXT_PUBLIC_PROFILE_GITHUB || "";
const projectUrl = process.env.NEXT_PUBLIC_PROFILE_PROJECT || "";
const linkedinUrl = process.env.NEXT_PUBLIC_PROFILE_LINKEDIN || "";

export default function Footer() {
  return (
    <footer className="mt-auto bg-[var(--color-surface)] text-[var(--color-text-secondary)] text-sm py-4 px-4 border-t border-[var(--color-border)] select-none">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <span>
          © {new Date().getFullYear()} {profileName}
        </span>

        <div className="flex items-center gap-5">
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--color-text-primary)] transition-colors"
              title="GitHub"
            >
              <FaGithub size={18} />
            </a>
          )}

          {linkedinUrl && (
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--color-text-primary)] transition-colors"
              title="LinkedIn"
            >
              <FaLinkedin size={18} />
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
