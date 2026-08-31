import Link from "next/link";

export default function ResearchPage() {
  return (
    <main className="min-h-screen bg-[#030407] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(37,99,235,0.16),transparent_34%),radial-gradient(circle_at_85%_72%,rgba(59,130,246,0.07),transparent_28%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />

      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
        <div className="mb-10 border-b border-white/10 pb-6">
          <Link
            href="/"
            className="text-[11px] uppercase tracking-[0.22em] text-blue-300 transition hover:text-blue-200"
          >
            ← Atra Vigil
          </Link>

          <div className="mt-8">
            <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-blue-400">
              Economic Research
            </div>
            <h1 className="mt-3 font-serif text-4xl tracking-[-0.035em] text-[#f2f4f7] sm:text-5xl">
              Economic Research
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#8290a3] sm:text-[15px]">
              Workbooks, trackers, and reference materials for following major U.S. economic reports.
            </p>
          </div>
        </div>

        <section>
          <div className="mb-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-blue-400">
              Free Resources
            </div>
            <h2 className="mt-2 font-serif text-2xl tracking-[-0.025em] text-[#eef2f6]">
              Available Downloads
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <article className="flex min-h-[250px] flex-col rounded-[14px] border border-[#203044] bg-[#050a10] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#65768a]">
                Workbook
              </div>

              <h3 className="mt-4 font-serif text-[24px] leading-[1.08] tracking-[-0.02em] text-[#f0f3f6]">
                Basic U.S. Economic Conditions Tracker
              </h3>

              <p className="mt-4 text-[13px] leading-6 text-[#8290a3]">
                A five-report guide for tracking GDP, Personal Income &amp; Outlays, Retail Sales,
                Consumer Price Index, and the Employment Situation.
              </p>

              <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-white/[0.07] pt-5">
                <a
                  href="/basic-us-economic-conditions-tracker-workbook.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-md border border-blue-400/30 bg-blue-500/[0.06] px-4 py-2.5 text-[12px] font-medium text-blue-200 transition hover:border-blue-300/50 hover:bg-blue-500/[0.10]"
                >
                  View Workbook
                </a>

                <a
                  href="/basic-us-economic-conditions-tracker-workbook.pdf"
                  download="Basic U.S. Economic Conditions Tracker - Workbook.pdf"
                  className="inline-flex items-center px-2 py-2.5 text-[12px] font-medium text-[#8fa2b6] transition hover:text-[#d6e2ee]"
                >
                  Download PDF
                </a>
              </div>
            </article>
          </div>
        </section>
      </section>
    </main>
  );
}
