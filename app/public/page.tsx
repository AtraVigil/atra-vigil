import Link from "next/link";

export default function PublicLandingPage() {
  return (
    <main className="min-h-screen bg-[#030407] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(37,99,235,0.16),transparent_34%)]" />

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-5 py-10 sm:px-8">
        <div className="mb-8 border-b border-white/10 pb-4">
          <Link href="/" className="text-[11px] uppercase tracking-[0.22em] text-blue-300">
            ← Atra Vigil
          </Link>
        </div>

        <div className="overflow-hidden rounded-[1.7rem] border border-blue-400/15 bg-zinc-950/65 shadow-2xl shadow-blue-950/20 backdrop-blur">
          <div className="relative h-36 sm:h-44 md:h-52">
            <img
              src="/header-final.png"
              alt="Atra Vigil Header"
              className="absolute inset-0 h-full w-full object-cover opacity-95"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
