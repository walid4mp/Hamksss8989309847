import Header from "@/components/header";
import SiteFooter from "@/components/site-footer";

import { developerAccounts } from "@/lib/site-content";

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-[#f5f7fb] text-gray-900">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-12">
        <section className="rounded-[32px] border border-white/80 bg-white p-8 shadow-sm md:p-10">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-blue-600">
            Developer access
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-gray-900 md:text-5xl">
            10 developer accounts with full permissions
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-gray-600">
            Each developer account in this setup is marked with full feature
            access, complete code package access, and custom code creation
            permission. These are demo seed credentials and should be rotated
            before production deployment.
          </p>
        </section>

        <section className="overflow-hidden rounded-3xl border border-white/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-5 py-4 font-medium">Developer</th>
                  <th className="px-5 py-4 font-medium">Email</th>
                  <th className="px-5 py-4 font-medium">Role</th>
                  <th className="px-5 py-4 font-medium">Temporary password</th>
                  <th className="px-5 py-4 font-medium">Access code</th>
                  <th className="px-5 py-4 font-medium">Code creation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {developerAccounts.map((account) => (
                  <tr key={account.email}>
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {account.name}
                    </td>
                    <td className="px-5 py-4 text-gray-600">{account.email}</td>
                    <td className="px-5 py-4 text-gray-600">{account.role}</td>
                    <td className="px-5 py-4 font-mono text-xs text-gray-700">
                      {account.tempPassword}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-blue-700">
                      {account.accessCode}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {account.canCreateCodes ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <article className="rounded-3xl border border-white/80 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Included access</h2>
            <p className="mt-3 text-sm leading-7 text-gray-600">
              All 10 accounts are prepared with premium feature access, advanced
              generation privileges, and complete code package visibility.
            </p>
          </article>
          <article className="rounded-3xl border border-white/80 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Code management</h2>
            <p className="mt-3 text-sm leading-7 text-gray-600">
              Every listed developer can create, issue, and manage redeemable
              codes for subscriptions, credits, or developer-only activations.
            </p>
          </article>
          <article className="rounded-3xl border border-white/80 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Security note</h2>
            <p className="mt-3 text-sm leading-7 text-gray-600">
              Use the seeded credentials only for staging or demos. Replace them
              with secure identities and proper authentication before launch.
            </p>
          </article>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
