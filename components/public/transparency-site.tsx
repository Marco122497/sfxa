import Image from "next/image";
import Link from "next/link";

import { formatDateTime } from "@/lib/auth/roles";
import { formatDate, formatMoney } from "@/lib/format";
import type {
  BudgetUtilizationRow,
  CollectionSummaryRow,
  MonthlyTotal,
  PublicAnnouncement,
  PublicProject,
} from "@/lib/public/transparency";
import { TransparencySiteHeader } from "@/components/public/site-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TransparencySiteProps = {
  dashboardHref: string | null;
  setupRequired: boolean;
  monthlyDonations: MonthlyTotal[];
  monthlyCollections: CollectionSummaryRow[];
  budgetUtilization: BudgetUtilizationRow[];
  projects: PublicProject[];
  announcements: PublicAnnouncement[];
};

const IMAGES = {
  hero:
    "https://images.unsplash.com/photo-1548625149-fc4a29cf7092?auto=format&fit=crop&w=2400&q=80",
  collections:
    "https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1600&q=80",
  community:
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1600&q=80",
  projects:
    "https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1600&q=80",
} as const;

export function TransparencySite({
  dashboardHref,
  setupRequired,
  monthlyDonations,
  monthlyCollections,
  budgetUtilization,
  projects,
  announcements,
}: TransparencySiteProps) {
  const collectionMonths = [
    ...new Set(monthlyCollections.map((row) => row.monthKey)),
  ].slice(0, 6);

  const latestCollections = monthlyCollections.filter((row) =>
    collectionMonths.includes(row.monthKey)
  );

  const latestCollectionTotal = latestCollections
    .filter((row) => row.monthKey === collectionMonths[0])
    .reduce((sum, row) => sum + row.total, 0);

  const budgetAllocated = budgetUtilization.reduce(
    (sum, row) => sum + row.allocated,
    0
  );
  const budgetUtilized = budgetUtilization.reduce(
    (sum, row) => sum + row.utilized,
    0
  );
  const budgetRemaining = budgetAllocated - budgetUtilized;
  const utilizationPct =
    budgetAllocated > 0
      ? Math.min(100, Math.round((budgetUtilized / budgetAllocated) * 100))
      : 0;

  const latestDonationTotal = monthlyDonations[0]?.total ?? 0;
  const latestDonationLabel = monthlyDonations[0]?.monthLabel ?? "This period";
  const latestCollectionLabel = collectionMonths[0]
    ? latestCollections.find((row) => row.monthKey === collectionMonths[0])
        ?.monthLabel ?? "This period"
    : "This period";

  return (
    <div className="min-h-full scroll-smooth bg-[#f7f4ef] text-[#1c2a20]">
      <TransparencySiteHeader dashboardHref={dashboardHref} />

      {/* Full-bleed photographic hero */}
      <section
        id="top"
        className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden"
      >
        <Image
          src={IMAGES.hero}
          alt="Parish church interior"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-105 animate-[hero-zoom_18s_ease-out_forwards]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,24,18,0.35)_0%,rgba(16,24,18,0.55)_45%,rgba(16,24,18,0.88)_100%)]"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#f7f4ef] to-transparent"
        />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-20 pt-28 md:px-6 md:pb-28 md:pt-36">
          <p className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-700 font-[family-name:var(--font-display)] text-5xl font-semibold tracking-tight text-white md:text-7xl lg:text-8xl">
            SFXA Finance
          </p>
          <h1 className="mt-5 max-w-xl animate-in fade-in slide-in-from-bottom-4 fill-mode-both text-xl font-medium text-white/90 duration-700 delay-150 md:text-2xl">
            Open books for the parish community
          </h1>
          <p className="mt-4 max-w-lg animate-in fade-in slide-in-from-bottom-4 fill-mode-both text-base leading-relaxed text-white/70 duration-700 delay-300 md:text-lg">
            Follow collections, donations, and parish projects with clarity —
            private donor and staff records stay protected.
          </p>
          <div className="mt-9 flex flex-wrap gap-3 animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-700 delay-500">
            <a
              href="#collections"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-[#f7f4ef] text-[#1c2a20] hover:bg-white"
              )}
            >
              Explore reports
            </a>
            <a
              href="#announcements"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "border-white/45 bg-transparent text-white hover:bg-white/10 hover:text-white"
              )}
            >
              Latest announcements
            </a>
          </div>
        </div>
      </section>

      {setupRequired && (
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
          <p className="border border-[#8a6a2a]/30 bg-[#efe4c4] px-4 py-3 text-sm text-[#4a3a18]">
            Public summaries need setup. Run{" "}
            <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs">
              sql/phase5-public.sql
            </code>{" "}
            in Supabase, then refresh.
          </p>
        </div>
      )}

      {/* Snapshot */}
      <section className="relative z-10 -mt-6 md:-mt-10">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="grid gap-px overflow-hidden bg-[#1c2a20]/10 shadow-[0_24px_60px_rgba(28,42,32,0.12)] sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Latest donations",
                value: formatMoney(latestDonationTotal),
                hint: latestDonationLabel,
              },
              {
                label: "Latest collections",
                value: formatMoney(latestCollectionTotal),
                hint: latestCollectionLabel,
              },
              {
                label: "Budget remaining",
                value: formatMoney(budgetRemaining),
                hint: `${utilizationPct}% utilized overall`,
              },
              {
                label: "Active projects",
                value: String(projects.length),
                hint: "Listed for the community",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-[#f7f4ef] px-5 py-7 transition-colors duration-300 hover:bg-white md:px-6 md:py-8"
              >
                <p className="text-xs tracking-[0.16em] text-[#1c2a20]/50 uppercase">
                  {item.label}
                </p>
                <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tabular-nums md:text-4xl">
                  {item.value}
                </p>
                <p className="mt-1 text-sm text-[#1c2a20]/55">{item.hint}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Collections */}
      <section id="collections" className="scroll-mt-24 py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 md:grid-cols-[0.9fr_1.1fr] md:items-start md:gap-16 md:px-6">
          <div className="relative aspect-[4/5] overflow-hidden md:sticky md:top-28">
            <Image
              src={IMAGES.collections}
              alt="Lit parish sanctuary"
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover transition-transform duration-700 hover:scale-105"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-[#1c2a20]/50 to-transparent"
            />
            <p className="absolute bottom-5 left-5 right-5 font-[family-name:var(--font-display)] text-2xl text-white md:text-3xl">
              Stewardship in the open
            </p>
          </div>

          <div>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-5xl">
              Monthly collections
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-[#1c2a20]/65 md:text-lg">
              Parish collection totals by type — including Sunday Mass
              collections. Separate from donations. Donor names are never shown.
            </p>

            {latestCollections.length === 0 ? (
              <p className="mt-10 text-[#1c2a20]/55">No collection data yet.</p>
            ) : (
              <div className="mt-10 border-t border-[#1c2a20]/12">
                {latestCollections.map((row) => (
                  <div
                    key={`${row.monthKey}-${row.categoryName}`}
                    className="grid grid-cols-[1fr_auto] items-baseline gap-4 border-b border-[#1c2a20]/10 py-5 transition-colors duration-300 hover:bg-[#1c2a20]/[0.03] sm:grid-cols-[7.5rem_1fr_auto]"
                  >
                    <p className="text-sm text-[#1c2a20]/50">{row.monthLabel}</p>
                    <p className="col-span-2 font-medium sm:col-span-1">
                      {row.categoryName}
                    </p>
                    <p className="text-right font-[family-name:var(--font-display)] text-lg tabular-nums sm:text-xl">
                      {formatMoney(row.total)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Donations */}
      <section
        id="donations"
        className="relative scroll-mt-24 overflow-hidden py-20 text-[#f7f4ef] md:py-28"
      >
        <Image
          src={IMAGES.community}
          alt="Parish community gathering"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[#132018]/88"
        />
        <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-6">
          <div className="max-w-2xl">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-5xl">
              Monthly donations
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#f7f4ef]/65 md:text-lg">
              Donation totals only — parish collections are listed separately.
              No personal donor details.
            </p>
          </div>

          {monthlyDonations.length === 0 ? (
            <p className="mt-10 text-[#f7f4ef]/55">No donation totals yet.</p>
          ) : (
            <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {monthlyDonations.slice(0, 6).map((row, index) => (
                <div
                  key={row.monthKey}
                  className="border-t border-[#f7f4ef]/20 pt-5 transition-transform duration-500 hover:-translate-y-1"
                  style={{ transitionDelay: `${index * 40}ms` }}
                >
                  <p className="text-sm text-[#f7f4ef]/55">{row.monthLabel}</p>
                  <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tabular-nums md:text-4xl">
                    {formatMoney(row.total)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Budget */}
      <section id="budget" className="scroll-mt-24 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="max-w-2xl">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-5xl">
              Budget utilization
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#1c2a20]/65 md:text-lg">
              How allocated funds support parish work. Expense receipts and line
              items stay private.
            </p>
          </div>

          <div className="mt-14 grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-[#1c2a20]/55">Utilized</p>
                  <p className="mt-1 font-[family-name:var(--font-display)] text-4xl font-semibold tabular-nums md:text-6xl">
                    {formatMoney(budgetUtilized)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#1c2a20]/55">of allocated</p>
                  <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums md:text-3xl">
                    {formatMoney(budgetAllocated)}
                  </p>
                </div>
              </div>
              <div className="mt-7 h-2.5 overflow-hidden bg-[#1c2a20]/10">
                <div
                  className="h-full bg-[#3f5d48] transition-all duration-1000 ease-out"
                  style={{ width: `${utilizationPct}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-[#1c2a20]/55">
                {utilizationPct}% used · {formatMoney(budgetRemaining)} remaining
              </p>
            </div>

            <div className="border-t border-[#1c2a20]/12">
              {budgetUtilization.length === 0 ? (
                <p className="pt-6 text-[#1c2a20]/55">No budget data yet.</p>
              ) : (
                budgetUtilization.slice(0, 6).map((row) => {
                  const pct =
                    row.allocated > 0
                      ? Math.min(
                          100,
                          Math.round((row.utilized / row.allocated) * 100)
                        )
                      : 0;
                  return (
                    <div
                      key={`${row.fiscalYear}-${row.categoryName}`}
                      className="border-b border-[#1c2a20]/10 py-4"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="font-medium">
                          {row.categoryName}{" "}
                          <span className="text-sm font-normal text-[#1c2a20]/45">
                            · {row.fiscalYear}
                          </span>
                        </p>
                        <p className="text-sm tabular-nums text-[#1c2a20]/65">
                          {pct}%
                        </p>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden bg-[#1c2a20]/10">
                        <div
                          className="h-full bg-[#5c6b3d] transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Projects */}
      <section
        id="projects"
        className="scroll-mt-24 border-y border-[#1c2a20]/10 bg-[#ebe6de] py-20 md:py-28"
      >
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="grid gap-10 md:grid-cols-[1fr_0.9fr] md:items-end">
            <div className="max-w-2xl">
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-5xl">
                Parish projects
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#1c2a20]/65 md:text-lg">
                Initiatives the parish is planning or building toward.
              </p>
            </div>
            <div className="relative hidden aspect-[16/10] overflow-hidden md:block">
              <Image
                src={IMAGES.projects}
                alt="Church exterior"
                fill
                sizes="40vw"
                className="object-cover"
              />
            </div>
          </div>

          {projects.length === 0 ? (
            <p className="mt-10 text-[#1c2a20]/55">No projects listed yet.</p>
          ) : (
            <div className="mt-14 grid gap-8 md:grid-cols-2">
              {projects.map((project) => (
                <article
                  key={project.project_id}
                  className="group relative overflow-hidden bg-[#f7f4ef] transition-transform duration-500 hover:-translate-y-1"
                >
                  <div className="absolute inset-y-0 left-0 w-1 bg-[#3f5d48] transition-all duration-500 group-hover:w-1.5" />
                  <div className="p-6 pl-7 md:p-8 md:pl-9">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
                        {project.project_name || "Untitled project"}
                      </h3>
                      {project.status && (
                        <span className="text-xs font-medium tracking-widest text-[#3f5d48] uppercase">
                          {project.status}
                        </span>
                      )}
                    </div>
                    {project.description && (
                      <p className="mt-3 text-sm leading-relaxed text-[#1c2a20]/65">
                        {project.description}
                      </p>
                    )}
                    <div className="mt-6 flex flex-wrap gap-8 text-sm">
                      <div>
                        <p className="text-[#1c2a20]/45">Budget</p>
                        <p className="mt-1 font-medium tabular-nums">
                          {formatMoney(project.budget)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#1c2a20]/45">Timeline</p>
                        <p className="mt-1 font-medium">
                          {formatDate(project.start_date)}
                          {project.end_date
                            ? ` – ${formatDate(project.end_date)}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Announcements */}
      <section id="announcements" className="scroll-mt-24 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="max-w-2xl">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-5xl">
              Church announcements
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#1c2a20]/65 md:text-lg">
              News and notices shared with the parish community.
            </p>
          </div>

          {announcements.length === 0 ? (
            <p className="mt-10 text-[#1c2a20]/55">
              No published announcements yet.
            </p>
          ) : (
            <div className="mt-14 space-y-0 border-t border-[#1c2a20]/12">
              {announcements.map((item) => (
                <article
                  key={item.announcement_id}
                  className="border-b border-[#1c2a20]/10 py-8 transition-colors duration-300 hover:bg-[#1c2a20]/[0.02] md:grid md:grid-cols-[12rem_1fr] md:gap-10"
                >
                  <time className="text-sm text-[#1c2a20]/45">
                    {formatDateTime(item.published_at || item.created_at)}
                  </time>
                  <div className="mt-2 md:mt-0">
                    <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold md:text-2xl">
                      {item.title}
                    </h3>
                    <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-[#1c2a20]/65 md:text-base">
                      {item.content}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="relative overflow-hidden bg-[#132018] text-[#f7f4ef]">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30 [background-image:radial-gradient(ellipse_at_20%_0%,rgba(255,255,255,0.12),transparent_50%)]"
        />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 py-14 md:flex-row md:items-end md:justify-between md:px-6 md:py-20">
          <div>
            <p className="font-[family-name:var(--font-display)] text-3xl font-semibold">
              SFXA Finance
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[#f7f4ef]/60">
              Built for community trust. Donor identities, expense details, and
              staff records are not published here.
            </p>
          </div>
          <div className="flex flex-wrap gap-5 text-sm">
            <a
              href="#top"
              className="text-[#f7f4ef]/70 transition-colors hover:text-[#f7f4ef]"
            >
              Back to top
            </a>
            {dashboardHref ? (
              <Link
                href={dashboardHref}
                className="text-[#f7f4ef]/70 transition-colors hover:text-[#f7f4ef]"
              >
                Staff dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-[#f7f4ef]/70 transition-colors hover:text-[#f7f4ef]"
              >
                Staff login
              </Link>
            )}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes hero-zoom {
          from { transform: scale(1.08); }
          to { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
