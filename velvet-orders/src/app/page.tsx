export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-rose-50 via-white to-slate-50 px-6 py-20">
      <div className="absolute inset-0 -z-10 opacity-70">
        <div className="absolute left-10 top-10 h-56 w-56 rounded-full bg-rose-200/50 blur-3xl" />
        <div className="absolute bottom-14 right-10 h-64 w-64 rounded-full bg-violet-200/40 blur-3xl" />
      </div>

      <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 rounded-3xl border border-white/70 bg-white/70 px-8 py-14 text-center shadow-xl shadow-slate-200/50 backdrop-blur-sm">
        <p className="rounded-full border border-rose-100 bg-rose-50 px-4 py-1 text-xs font-medium uppercase tracking-[0.18em] text-rose-500">
          Velvet Orders
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          A calm start for modern order flows.
        </h1>
        <p className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
          Your fresh Next.js foundation is ready. TypeScript, Tailwind CSS, App
          Router, and a `src`-based structure are all configured and running.
        </p>
        <div className="mt-3 rounded-2xl border border-slate-100 bg-white px-5 py-3 text-sm text-slate-500 shadow-sm">
          Home screen is live. Next step: build your ordering experience.
        </div>
      </section>
    </main>
  );
}
