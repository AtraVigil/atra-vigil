"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function EntryPage() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const splashId = window.setTimeout(() => setShowSplash(false), 850);
    return () => window.clearTimeout(splashId);
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[#030407] text-white">
      {showSplash ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="relative w-[min(82vw,760px)]">
            <div className="absolute -inset-10 rounded-full bg-blue-500/10 blur-3xl" />
            <img
              src="/logo.png"
              alt="Atra Vigil"
              className="relative w-full object-contain opacity-95 animate-[atraSplash_850ms_ease-out_forwards]"
            />
            <div className="mx-auto mt-8 h-px w-64 overflow-hidden bg-white/10">
              <div className="h-full w-full animate-[atraLoad_850ms_ease-out_forwards] bg-blue-400" />
            </div>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(37,99,235,0.18),transparent_34%)]" />

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-5 py-10 sm:px-8">
        <div className="mb-8 border-b border-white/10 pb-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-blue-300">
            Atra Vigil
          </div>
          <div className="mt-1 text-xs uppercase tracking-[0.22em] text-zinc-600">
            Market systems interface
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.7rem] border border-blue-400/15 bg-zinc-950/65 shadow-2xl shadow-blue-950/20 backdrop-blur">
          <div className="relative h-36 sm:h-44 md:h-52">
            <img
              src="/header-final.png"
              alt="Atra Vigil Header"
              className="absolute inset-0 h-full w-full object-cover opacity-95"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-black/0 to-black/35" />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#030407] to-transparent" />
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2 sm:p-8">
            <Link
              href="/public"
              className="rounded-2xl border border-white/10 bg-black/30 p-6 transition hover:border-blue-400/40 hover:bg-blue-500/[0.06]"
            >
              <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-600">Access</div>
              <div className="mt-2 text-2xl font-semibold text-zinc-100">Public</div>
              <div className="mt-3 text-sm leading-6 text-zinc-500">
                Public Atra Vigil landing page.
              </div>
              <div className="mt-6 text-sm font-medium text-blue-300">Continue →</div>
            </Link>

            <Link
              href="/private"
              className="rounded-2xl border border-white/10 bg-black/30 p-6 transition hover:border-violet-400/40 hover:bg-violet-500/[0.06]"
            >
              <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-600">Access</div>
              <div className="mt-2 text-2xl font-semibold text-zinc-100">Private</div>
              <div className="mt-3 text-sm leading-6 text-zinc-500">
                Protected Atra Vigil research and market systems.
              </div>
              <div className="mt-6 text-sm font-medium text-violet-300">Continue →</div>
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes atraSplash {
          0% { opacity: 0; transform: scale(0.975); filter: brightness(0.7); }
          45% { opacity: 1; filter: brightness(1.05); }
          100% { opacity: 0; transform: scale(1.015); filter: brightness(0.95); }
        }
        @keyframes atraLoad {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(0%); }
        }
      `}</style>
    </main>
  );
}
