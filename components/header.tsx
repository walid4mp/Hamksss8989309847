import GithubIcon from "@/components/icons/github-icon";
import Link from "next/link";
import { memo } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/pricing", label: "Pricing" },
  { href: "/developers", label: "Developers" },
  { href: "/contact", label: "Contact" },
];

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <img
            src="/fullLogo.png"
            alt="WarHex AI Studio"
            className="h-9 w-auto object-contain"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">
              WarHex AI Studio
            </p>
            <p className="truncate text-xs text-gray-500">
              Code generation, plans, payments, and developer access
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-gray-600 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-gray-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/pricing"
            className="hidden rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 sm:inline-flex"
          >
            View plans
          </Link>
          <a
            href="https://github.com/nutlope/llamacoder"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
          >
            <GithubIcon className="h-4 w-4" />
            Source
          </a>
        </div>
      </div>
    </header>
  );
}

export default memo(Header);
