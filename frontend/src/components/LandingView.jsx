export default function LandingView({ onStart }) {
  return (
    <div className="font-body-md bg-background text-on-surface">

      {/* ── TOP NAV — clean, minimal ─────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/8">
        <div className="flex items-center justify-between px-10 py-4 max-w-screen-xl mx-auto">
          {/* Brand */}
          <div className="text-xl font-bold tracking-tight text-primary-container font-serif">Taskar</div>

          {/* Center links */}
          <div className="hidden md:flex items-center gap-10">
            <button onClick={onStart} className="text-white/50 hover:text-white text-sm transition-colors tracking-wide">Simulation</button>
            <a href="#features"  className="text-white/50 hover:text-white text-sm transition-colors tracking-wide">Intelligence</a>
            <a href="#preview"   className="text-white/50 hover:text-white text-sm transition-colors tracking-wide">Preview</a>
          </div>

          {/* Right CTA */}
          <button onClick={onStart}
            className="bg-primary-container text-white text-sm px-5 py-2 rounded-full font-semibold glow-button hover:bg-orange-600 transition-all active:scale-95">
            Start Project
          </button>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(255,122,0,0.07),transparent_70%)]" />
        </div>

        <div className="relative z-10 max-w-5xl">
          <span className="text-primary-container font-label-sm uppercase tracking-widest mb-6 block text-xs">
            The First Causal Impact Engine
          </span>
          <h1 className="font-headline-xl text-on-surface mb-8" style={{ fontSize: 'clamp(40px,8vw,84px)', lineHeight: 1.1, letterSpacing: '-0.04em', fontWeight: 600 }}>
            Predict the Unseen.<br />Master the Ripple.
          </h1>
          <p className="font-body-lg text-on-surface-variant max-w-xl mx-auto mb-12 text-lg leading-relaxed">
            Transform unstructured project notes into structured task graphs. Simulate delays,
            identify bottlenecks, and protect your deadlines.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={onStart}
              className="bg-primary-container text-white px-10 py-4 rounded-lg text-base font-semibold glow-button hover:scale-105 transition-transform active:scale-95">
              Launch Simulator
            </button>
            <a href="#features"
              className="glass-panel text-on-surface px-10 py-4 rounded-lg text-base font-semibold hover:bg-white/5 transition-all cursor-pointer">
              View Intelligence
            </a>
          </div>
        </div>

        {/* Hero image — blended */}
        <div className="mt-20 relative w-full max-w-5xl mx-auto rounded-2xl overflow-hidden"
          style={{ aspectRatio: '16/9' }}>
          <img
            className="w-full h-full object-cover"
            style={{ opacity: 0.55, mixBlendMode: 'lighten' }}
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKinzlH8KuA3vlYDJZZEXeQR0CPl9uuNIgWay-bjavdSUDXynS5vzBiU-oNiCBsTVD86v5DBkTnXCUWvFlNBalcBTiaQpd6SkQmd1XmluSYClzN7KOVxUVGup6xMl3keV_3qLGCxgZQnLYEmRBkjdLiaSGHFXCpzBX1eR41_CoMAwyCKLiYLkktu5GT24lSlWKeEaSz5McmnyPmgMnDbZZMJDP5XGSQGE_QrCfrADXvOtbckjvDsTDxXQm4BpY9lh94oP_eJ85Otxx"
            alt="Neural network visualization"
          />
          {/* Edge fades into #131313 */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `
              radial-gradient(ellipse 100% 30% at 50% 0%,   #131313 0%, transparent 100%),
              radial-gradient(ellipse 100% 40% at 50% 100%, #131313 0%, transparent 100%),
              radial-gradient(ellipse 20% 100% at 0%   50%, #131313 0%, transparent 100%),
              radial-gradient(ellipse 20% 100% at 100% 50%, #131313 0%, transparent 100%)
            `}} />
          <div className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
            style={{ background: 'linear-gradient(to top, #131313 0%, transparent 100%)' }} />
          <div className="absolute inset-x-0 top-0 h-1/3 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, #131313 0%, transparent 100%)' }} />
          {/* Badge */}
          <div className="absolute bottom-6 left-6 flex items-center gap-3 z-10">
            <span className="material-symbols-outlined text-primary-container p-2 glass-panel rounded-full text-xl">hub</span>
            <div className="text-left">
              <p className="font-label-sm text-white/35 uppercase text-[9px] tracking-widest">Active Graph</p>
              <p className="text-white font-semibold text-sm">Project Phoenix Structure</p>
            </div>
          </div>
          <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ border: '1px solid rgba(255,255,255,0.06)' }} />
        </div>
      </section>

      {/* ── FEATURES BENTO ─────────────────────────────────────────── */}
      <section id="features" className="py-28 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-headline-lg text-on-surface" style={{ fontSize: '40px' }}>Precision in Every Node</h2>
          <div className="ripple-line mt-4 max-w-xs mx-auto opacity-25" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7 glass-panel p-8 rounded-2xl flex flex-col justify-between group">
            <div className="flex justify-between items-start">
              <div>
                <span className="material-symbols-outlined text-3xl text-primary-container mb-5 block">psychology</span>
                <h3 className="text-white text-2xl font-semibold font-serif mb-3">Intelligent Extraction</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed max-w-sm">
                  Our NLP engine parses raw text, meeting notes, and emails to autonomously
                  map task hierarchies and hidden dependencies.
                </p>
              </div>
              <div className="hidden md:flex w-28 h-28 border border-white/5 rounded-full items-center justify-center group-hover:border-primary-container transition-colors shrink-0">
                <span className="material-symbols-outlined text-white/15 text-4xl group-hover:text-primary-container transition-colors">auto_awesome</span>
              </div>
            </div>
            <div className="mt-10 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-primary-container w-2/3 rounded-full" style={{ boxShadow: '0 0 10px #ff7a00' }} />
            </div>
          </div>

          <div className="md:col-span-5 glass-panel p-8 rounded-2xl">
            <span className="material-symbols-outlined text-3xl text-primary-container mb-5 block">query_stats</span>
            <h3 className="text-white text-2xl font-semibold font-serif mb-3">Causal Simulation</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Simulate real-world delay propagation. See how a 2-day setback triggers a
              2-week collapse in deployment.
            </p>
            <div className="mt-8 flex gap-2 items-end h-12">
              {[40, 60, 100].map((h, i) => (
                <div key={i} className="w-2 bg-white/5 rounded-full flex items-end" style={{ height: '100%' }}>
                  <div className="w-full bg-primary-container rounded-full" style={{ height: `${h}%` }} />
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-12 glass-panel p-8 rounded-2xl flex flex-col md:flex-row gap-10 items-center">
            <div className="flex-1">
              <span className="material-symbols-outlined text-3xl text-primary-container mb-5 block">security</span>
              <h3 className="text-white text-2xl font-semibold font-serif mb-3">Resilience Analytics</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed max-w-lg">
                Quantitative risk scoring identifies the Critical Path — the fragile sequence where any
                failure leads to a missed deadline.
              </p>
            </div>
            <div className="flex-1 w-full grid grid-cols-3 gap-4">
              {[{ v: '98%', l: 'Confidence' }, { v: '1.2x', l: 'Efficiency' }, { v: '-40%', l: 'Risk' }].map(({ v, l }) => (
                <div key={l} className="bg-white/4 p-5 rounded-xl border border-white/8 text-center">
                  <p className="text-primary-container text-2xl font-semibold font-serif mb-1">{v}</p>
                  <p className="font-label-sm text-white/35 text-[10px] tracking-widest uppercase">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SIMULATION PREVIEW ──────────────────────────────────────── */}
      <section id="preview" className="py-28 bg-surface-container-lowest">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-headline-lg text-on-surface mb-6" style={{ fontSize: '36px' }}>
                Before vs After:<br />The Delay Impact
              </h2>
              <p className="text-on-surface-variant text-base leading-relaxed mb-10">
                Without Taskar, delays are invisible until they are catastrophic. Our simulator
                visualizes the Shadow Delay — the cumulative impact of small friction points.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-error-container/10 border border-error/15">
                  <span className="material-symbols-outlined text-error text-lg">warning</span>
                  <span className="text-error text-sm">Unmonitored delay detected in 'Backend Architecture' phase.</span>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-tertiary-container/10 border border-tertiary/15">
                  <span className="material-symbols-outlined text-tertiary text-lg">check_circle</span>
                  <span className="text-tertiary text-sm">Ripple Mitigation: 12 days recovered via path optimization.</span>
                </div>
              </div>
              <button onClick={onStart}
                className="mt-8 bg-primary-container text-white px-8 py-3.5 rounded-lg text-sm font-semibold glow-button hover:bg-orange-600 transition-all active:scale-95">
                Try It Now →
              </button>
            </div>

            <div className="glass-panel p-4 rounded-2xl relative">
              <div className="absolute -top-8 -right-8 w-28 h-28 bg-orange-500/8 rounded-full blur-3xl pointer-events-none" />
              <div className="space-y-3">
                <div className="bg-[#0a0a0a] p-5 rounded-xl border border-white/5">
                  <div className="flex justify-between mb-3">
                    <span className="font-label-sm text-[9px] text-white/30 uppercase tracking-widest">Traditional View</span>
                    <span className="text-error font-label-sm text-[9px] tracking-widest">Linear Falloff</span>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-error w-1/4 rounded-full" />
                  </div>
                </div>
                <div className="bg-[#0a0a0a] p-5 rounded-xl border border-primary-container/25">
                  <div className="flex justify-between mb-3">
                    <span className="font-label-sm text-[9px] text-white/30 uppercase tracking-widest">Taskar Analysis</span>
                    <span className="text-primary-container font-label-sm text-[9px] tracking-widest">Impact Resolved</span>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-container w-3/4 rounded-full" style={{ boxShadow: '0 0 12px #ff7a00' }} />
                  </div>
                </div>
                <img
                  className="w-full h-40 object-cover rounded-xl opacity-40 grayscale hover:grayscale-0 hover:opacity-70 transition-all duration-500"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGbcfwf00Dfy4wKa_z5TUFyo5okJmRqJIY3tEpFz4g0lO1EMbTY5S8MAIDq1vgwTDHjBy3V3-i1ftnoufhAr3Rs2JfnGNHiIQJHWuVw5wKm5SK07bag3p-_7-9EG_Ps5YYXOIQqvcJfSVgghwSJ_UQYr9u5OFHicd_k4LjjmGS7hzIYsUL38F_dYQRcKgsEA0l5qzMNvZuWdJatwQIQ1VibdoTUcocBtrBNmt6aZtyer1FZAkOTSLJjiECvTTJ__isyYF_axuTURVc"
                  alt="Dashboard timeline analysis"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="w-full py-16 border-t border-white/5 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-white/15 font-serif font-black text-base">Taskar</div>
          <div className="flex flex-wrap justify-center gap-8">
            {['Privacy Policy', 'Terms of Service', 'API Docs', 'System Status'].map(l => (
              <a key={l} href="#"
                className="text-white/30 hover:text-primary-container font-label-sm text-[9px] uppercase tracking-widest transition-colors">
                {l}
              </a>
            ))}
          </div>
          <div className="text-white/25 font-label-sm text-[9px] uppercase tracking-widest">
            © {new Date().getFullYear()} Taskar. Precision in Motion.
          </div>
        </div>
      </footer>
    </div>
  )
}
