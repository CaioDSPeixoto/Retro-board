"use client";

import { FaGithub, FaLinkedin } from "react-icons/fa";
import { FiExternalLink } from "react-icons/fi";

const profileName = process.env.NEXT_PUBLIC_PROFILE_NAME || "Desenvolvedor";
const githubUrl = process.env.NEXT_PUBLIC_PROFILE_GITHUB || "";
const projectUrl = process.env.NEXT_PUBLIC_PROFILE_PROJECT || "";
const linkedinUrl = process.env.NEXT_PUBLIC_PROFILE_LINKEDIN || "";

export default function Footer() {
  return (
    <footer className="bg-white text-gray-600 text-sm py-4 px-4 border-t border-gray-200">
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
              className="hover:text-gray-900 transition-colors"
              title="GitHub"
            >
              <FaGithub size={18} />
            </a>
          )}

          {projectUrl && (
            <a
              href={projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 transition-colors"
              title="Projeto - Contribuir"
            >
              <FiExternalLink size={18} />
            </a>
          )}

          {linkedinUrl && (
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 transition-colors"
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
