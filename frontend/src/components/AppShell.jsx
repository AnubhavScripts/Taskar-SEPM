const NAV = [
  { id: 'dashboard', icon: 'grid_view', label: 'DASHBOARD' },
  { id: 'simulations', icon: 'analytics', label: 'SIMULATIONS' },
  { id: 'history', icon: 'history', label: 'HISTORY' },
]

export default function AppShell({ activePage, onNav, onNewNode, onRunSimulation, onHome, children, sessionName = 'Alpha-9' }) {
  return (
    <div className="flex h-screen bg-[#111111] text-on-surface" style={{ overflow: 'hidden' }}>

      {/* ── LEFT SIDEBAR ─────────────────────────────────────────────── */}
      <aside className="w-[190px] shrink-0 flex flex-col bg-[#161616] border-r border-white/5 z-10">
        {/* Engine badge — click to go home */}
        <button onClick={onHome}
          className="flex items-center gap-3 px-5 py-5 border-b border-white/5 w-full text-left hover:bg-white/3 transition-colors group">
          <div className="w-8 h-8 rounded-lg bg-primary-container/20 border border-primary-container/40 flex items-center justify-center shrink-0 group-hover:bg-primary-container/30 transition-colors">
            <span className="material-symbols-outlined text-primary-container text-base">settings_suggest</span>
          </div>
          <div>
            <div className="font-label-sm text-white text-[11px] font-bold tracking-widest uppercase">Simulation Engine</div>
            <div className="font-label-sm text-white/30 text-[9px] tracking-widest uppercase">Session: {sessionName}</div>
          </div>
        </button>

        {/* Nav items */}
        <nav className="flex-1 py-4">
          {NAV.map(n => (
            <button key={n.id} onClick={() => onNav(n.id)}
              className={`w-full flex items-center gap-3 px-5 py-3 transition-all text-left group
                ${activePage === n.id
                  ? 'bg-primary-container/15 border-r-2 border-primary-container text-primary-container'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/3'}`}>
              <span className={`material-symbols-outlined text-lg ${activePage === n.id ? 'text-primary-container' : 'text-white/30 group-hover:text-white/50'}`}>
                {n.icon}
              </span>
              <span className="font-label-sm text-[10px] tracking-widest font-bold">{n.label}</span>
            </button>
          ))}
        </nav>

        {/* New Node */}
        <div className="px-4 pb-4">
          <button onClick={onNewNode}
            className="w-full flex items-center justify-center gap-2 border border-white/15 text-white/50 hover:border-primary-container hover:text-primary-container py-2.5 rounded-lg transition-all font-label-sm text-[10px] tracking-widest font-bold">
            <span className="material-symbols-outlined text-sm">add_circle</span>
            NEW NODE
          </button>
        </div>

        {/* Support / Docs */}
        <div className="border-t border-white/5 py-3">
          {[{ id: 'support', icon: 'help_outline' }, { id: 'documentation', icon: 'description' }].map(item => (
            <button key={item.id}
              className="w-full flex items-center gap-3 px-5 py-2.5 text-white/25 hover:text-white/50 transition-colors">
              <span className="material-symbols-outlined text-sm">{item.icon}</span>
              <span className="font-label-sm text-[10px] tracking-widest font-bold uppercase">{item.id}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* ── MAIN AREA ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0" style={{ overflow: 'hidden' }}>

        {/* Top navbar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#111111] shrink-0">
          <div className="flex items-center gap-6">
            {/* Brand — click to go home */}
            <button onClick={onHome}
              className="text-primary-container font-serif font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
              Taskar
            </button>
            <div className="flex gap-1">
              <button className="px-4 py-1.5 font-label-sm text-[11px] tracking-widest font-bold text-primary-container border-b border-primary-container">
                SCENARIOS
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 w-48">
              <span className="material-symbols-outlined text-white/30 text-sm">search</span>
              <input className="bg-transparent text-white/40 text-xs placeholder-white/25 outline-none w-full"
                placeholder="Search simulations..." />
            </div>
            <button className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors">
              <span className="material-symbols-outlined text-xl">notifications</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors">
              <span className="material-symbols-outlined text-xl">settings</span>
            </button>
            <button onClick={onRunSimulation}
              className="bg-primary-container text-white px-4 py-1.5 rounded-lg font-label-sm text-[11px] tracking-widest font-bold glow-button hover:bg-orange-600 transition-all active:scale-95">
              RUN SIMULATION
            </button>
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-white/50 text-base">person</span>
            </div>
          </div>
        </header>

        {/* Page content — scrollable */}
        <main className="flex-1 min-h-0" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
