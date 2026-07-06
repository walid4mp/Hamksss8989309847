import Link from "next/link";

import { contactLinks } from "@/lib/site-content";

export default function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 text-sm text-gray-600 md:flex-row md:justify-between">
        <div className="max-w-xl space-y-3">
          <p className="text-lg font-semibold text-gray-900">WarHex AI Studio</p>
          <p>
            Generate apps, manage plans, redeem codes, and keep your developer
            team aligned from one polished workspace.
          </p>
          <p className="text-xs text-gray-500">
            Demo developer passwords should be rotated before production use.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div className="space-y-3">
            <p className="font-semibold text-gray-900">Quick links</p>
            <div className="flex flex-col gap-2">
              <Link href="/" className="hover:text-gray-900">
                Home
              </Link>
              <Link href="/pricing" className="hover:text-gray-900">
                Pricing
              </Link>
              <Link href="/developers" className="hover:text-gray-900">
                Developer accounts
              </Link>
              <Link href="/contact" className="hover:text-gray-900">
                Contact us
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <p className="font-semibold text-gray-900">Contact channels</p>
            <div className="flex flex-col gap-2 break-all">
              <a href={contactLinks.whatsapp} target="_blank" className="hover:text-gray-900">
                WhatsApp
              </a>
              <a href={contactLinks.instagram} target="_blank" className="hover:text-gray-900">
                Instagram
              </a>
              <a href={contactLinks.facebook} target="_blank" className="hover:text-gray-900">
                Facebook
              </a>
              <a href={contactLinks.email} className="hover:text-gray-900">
                {contactLinks.emailLabel}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
