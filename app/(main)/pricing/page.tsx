import Header from "@/components/header";
import SiteFooter from "@/components/site-footer";
import {
  CreditCard,
  ShieldCheck,
  Ticket,
  Wallet,
} from "lucide-react";

import { paymentMethods, subscriptionPlans } from "@/lib/site-content";

function paymentIcon(id: string) {
  switch (id) {
    case "paypal":
      return Wallet;
    case "visa":
      return CreditCard;
    case "redotpay":
      return ShieldCheck;
    default:
      return Ticket;
  }
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#f5f7fb] text-gray-900">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-12">
        <section className="rounded-[32px] border border-white/80 bg-white p-8 shadow-sm md:p-10">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-blue-600">
            Pricing
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-gray-900 md:text-5xl">
            Free, Pro, and Professional plans
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-gray-600">
            The project now includes a free daily balance, two Pro billing
            cadences, and two Professional billing cadences so users can choose
            monthly or yearly access with clearer pricing.
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-3 xl:grid-cols-5">
          {subscriptionPlans.map((plan) => (
            <article
              key={plan.id}
              className="rounded-3xl border border-white/80 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-gray-900">{plan.name}</p>
                  <p className="mt-1 text-sm text-gray-500">{plan.cadence}</p>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                  {plan.badge}
                </span>
              </div>
              <p className="mt-5 text-3xl font-semibold text-gray-900">
                {plan.price}
              </p>
              <p className="mt-2 text-sm font-medium text-blue-700">{plan.points}</p>
              <p className="mt-4 text-sm leading-6 text-gray-600">{plan.description}</p>
              <ul className="mt-5 space-y-2 text-sm text-gray-600">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-3xl border border-white/80 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-blue-600">
              Checkout options
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-gray-900">
              Payment methods added to the product
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-600">
              The codebase now includes dedicated payment method messaging for
              PayPal, Visa, RedotPay, and prepaid code redemption. This gives a
              clear foundation for future real gateway integrations.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {paymentMethods.map((method) => {
              const Icon = paymentIcon(method.id);
              return (
                <article
                  key={method.id}
                  className="rounded-3xl border border-white/80 bg-white p-6 shadow-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">
                    {method.name}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {method.summary}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
