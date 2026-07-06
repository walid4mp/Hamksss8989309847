import Header from "@/components/header";
import SiteFooter from "@/components/site-footer";

import { contactLinks } from "@/lib/site-content";

const contactItems = [
  {
    title: "WhatsApp",
    href: contactLinks.whatsapp,
    label: "wa.me/213779109990",
    description: "Fast direct support for product questions and quick follow-up.",
  },
  {
    title: "Instagram",
    href: contactLinks.instagram,
    label: "instagram.com/wh.s.8",
    description: "Share updates, product visuals, and community messages.",
  },
  {
    title: "Facebook",
    href: contactLinks.facebook,
    label: "facebook.com/profile.php?id=61570663858487",
    description: "Use Facebook as an additional social support and brand channel.",
  },
  {
    title: "Email",
    href: contactLinks.email,
    label: contactLinks.emailLabel,
    description: "For detailed requests, collaboration, and technical follow-up.",
  },
] as const;

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#f5f7fb] text-gray-900">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-12">
        <section className="rounded-[32px] border border-white/80 bg-white p-8 shadow-sm md:p-10">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-blue-600">
            Contact us
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-gray-900 md:text-5xl">
            WarHex support channels
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-gray-600">
            A dedicated contact page has been added to the product so users can
            quickly reach support through WhatsApp, Instagram, Facebook, or
            email.
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          {contactItems.map((item) => (
            <a
              key={item.title}
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              className="rounded-3xl border border-white/80 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">
                {item.title}
              </p>
              <p className="mt-3 text-xl font-semibold text-gray-900">{item.label}</p>
              <p className="mt-3 text-sm leading-7 text-gray-600">{item.description}</p>
            </a>
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
