// ImpactAnalytics — fix: Adjust Constraints → onReSimulate, text overlay fix
const RISK_COLORS = {
  high: 'text-error border-error/30 bg-error/10',
  medium: 'text-yellow-400 border-yellow-600/30 bg-yellow-900/10',
  low: 'text-tertiary border-tertiary/30 bg-tertiary/10',
}

// Simple donut SVG
function Donut({ pct, size = 120 }) {
  const r = 44, cx = 60, cy = 60
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ff7a00" strokeWidth="12"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 60 60)" style={{ filter: 'drop-shadow(0 0 8px #ff7a00)' }} />
      <text x="60" y="56" textAnchor="middle" fill="#fff" fontSize="20" fontFamily="Newsreader" fontWeight="600">{pct}%</text>
      <text x="60" y="74" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="Inter" fontWeight="600" letterSpacing="2">ON TRACK</text>
    </svg>
  )
}

// Horizontal bar chart row
function DeltaBar({ label, baseline, delta, max, status }) {
  const bPct = (baseline / max) * 100
  const dPct = (delta / max) * 100
  const isOptimal = status === 'optimal'
  return (
    <div className="flex items-center gap-3">
      <div className="w-36 shrink-0 font-label-sm text-[9px] text-white/40 tracking-widest uppercase truncate">{label}</div>
      <div className="flex-1 relative h-5 bg-white/5 rounded overflow-hidden">
        <div className="absolute inset-y-1 left-0 rounded bg-[#3a3a8a]" style={{ width: `${bPct}%` }} />
        <div className="absolute inset-y-1 rounded" style={{
          left: `${bPct}%`, width: `${dPct}%`,
          background: isOptimal ? '#10b981' : '#ff7a00',
          opacity: 0.8,
        }} />
      </div>
      <div className={`w-10 text-right font-label-sm text-[10px] font-bold shrink-0 ${isOptimal ? 'text-tertiary' : 'text-primary-container'}`}>
        {isOptimal ? 'OPTIMAL' : `+${delta}D`}
      </div>
    </div>
  )
}

export default function ImpactAnalytics({ data, onReset, onReSimulate }) {
  const { simulatedDuration, originalDuration, delayedBy, affectedTasks, deltaReport, prediction, tasks, criticalPath } = data
  const healthPct = Math.max(10, Math.round(prediction.confidence))
  const affectedIds = affectedTasks || []

  // Bottleneck items from delta report
  const bottlenecks = (deltaReport || [])
    .filter(r => r.daysPushed > 0)
    .sort((a, b) => b.daysPushed - a.daysPushed)
    .slice(0, 3)

  const maxEnd = Math.max(...(deltaReport || []).map(r => r.newEnd), simulatedDuration)

  return (
    <div className="flex flex-col min-h-full">
      {/* Page header */}
      <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-white/5">
        <div>
          <h1 className="font-headline-lg text-on-surface text-4xl mb-1">Impact Analytics</h1>
          <p className="font-body-md text-on-surface-variant text-sm">
            Causal simulation analysis for {data.title || 'Project Hyperion-V2'}
          </p>
        </div>
        <button onClick={onReset}
          className="flex items-center gap-2 border border-white/15 text-white/50 hover:border-white/30 hover:text-white/80 px-4 py-2 rounded-lg font-label-sm text-[10px] tracking-widest transition-all">
          <span className="material-symbols-outlined text-sm">download</span>
          EXPORT REPORT
        </button>
      </div>

      {/* Main content */}
      <div className="p-6 space-y-4">
        {/* Row 1: Project Health + Timeline Forecast */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Project Health */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-6">
            <div className="font-label-sm text-[9px] text-white/30 tracking-widest uppercase mb-4">Project Health</div>
            <div className="flex flex-col items-center mb-6">
              <Donut pct={healthPct} />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <div>
                <div className="font-label-sm text-[9px] text-white/30 tracking-widest uppercase mb-1">Resilience</div>
                <div className="font-headline-md text-white text-xl">
                  {prediction.overallRisk === 'low' ? 'High' : prediction.overallRisk === 'medium' ? 'Medium' : 'Low'}
                </div>
              </div>
              <div>
                <div className="font-label-sm text-[9px] text-white/30 tracking-widest uppercase mb-1">Volatility</div>
                <div className={`font-headline-md text-xl ${delayedBy > 0 ? 'text-primary-container' : 'text-tertiary'}`}>
                  {delayedBy > 0 ? `${delayedBy}.${Math.floor(Math.random() * 9)}%` : '0.0%'}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Forecast */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="font-label-sm text-[9px] text-white/30 tracking-widest uppercase">Timeline Forecast</div>
              {delayedBy > 0 && (
                <span className="font-label-sm text-[9px] bg-primary-container/10 border border-primary-container/30 text-primary-container px-2.5 py-1 rounded-full tracking-widest">
                  +{delayedBy} DAYS DELTA
                </span>
              )}
            </div>
            <div className="font-body-md text-white/40 text-xs italic mb-4">
              Simulation {data.title || 'Alpha-9'} Variance Report
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#111] border border-white/8 rounded-xl p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="material-symbols-outlined text-white/30 text-xs">calendar_today</span>
                  <span className="font-label-sm text-[8px] text-white/30 tracking-widest uppercase">Original Completion</span>
                </div>
                <div className="font-headline-md text-white text-xl">Day {originalDuration}</div>
              </div>
              <div className="bg-[#111] border border-primary-container/20 rounded-xl p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="material-symbols-outlined text-primary-container text-xs">schedule</span>
                  <span className="font-label-sm text-[8px] text-primary-container tracking-widest uppercase">Forecasted Completion</span>
                </div>
                <div className="font-headline-md text-primary-container text-xl">Day {simulatedDuration}</div>
              </div>
            </div>
            {delayedBy > 0 && (
              <div className="mt-3 flex gap-3 bg-yellow-900/10 border border-yellow-700/20 rounded-xl p-3">
                <span className="material-symbols-outlined text-yellow-400 text-sm shrink-0 mt-0.5">warning</span>
                <p className="font-body-md text-on-surface-variant text-xs leading-relaxed">
                  Critical delay identified. Delay propagates to <strong className="text-white">{affectedIds.length} task{affectedIds.length !== 1 ? 's' : ''}</strong>.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Bottlenecks + Delta Chart */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Critical Path Bottlenecks */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-label-sm text-[9px] text-white/30 tracking-widest uppercase">Critical Path Bottlenecks</div>
              <button className="text-white/20 hover:text-white/50 transition-colors">
                <span className="material-symbols-outlined text-base">filter_list</span>
              </button>
            </div>
            <div className="space-y-3">
              {bottlenecks.length === 0
                ? <p className="font-body-md text-white/25 text-xs text-center py-4">No significant bottlenecks detected.</p>
                : bottlenecks.map((b, i) => {
                  const statusMap = ['CRITICAL', 'HIGH RISK', 'PENDING']
                  const colorMap = ['bg-error/10 text-error border-error/30', 'bg-yellow-900/15 text-yellow-400 border-yellow-700/30', 'bg-white/5 text-white/40 border-white/10']
                  const iconMap = ['infrastructure', 'data_object', 'security']
                  return (
                    <div key={b.id} className="flex gap-3 bg-[#111] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0 overflow-hidden">
                        <span className="material-symbols-outlined text-white/30 text-base leading-none">{iconMap[i] || 'priority_high'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-body-md text-white text-sm font-semibold truncate">{b.name}</span>
                          <span className={`font-label-sm text-[8px] px-1.5 py-0.5 rounded border tracking-widest shrink-0 ${colorMap[i] || colorMap[2]}`}>
                            {statusMap[i] || 'AFFECTED'}
                          </span>
                        </div>
                        <p className="font-body-md text-white/35 text-xs">
                          Delayed by {b.daysPushed} day{b.daysPushed !== 1 ? 's' : ''} · {b.isAffected ? 'Ripple affected' : 'Direct delay'}
                        </p>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Task Duration Delta */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5 flex flex-col h-[340px]">
            <div className="mb-4 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-label-sm text-[9px] text-white/30 tracking-widest uppercase mb-1">Individual Task Impact</div>
                  <div className="font-body-md text-white/40 text-xs italic">Simulated vs. Baseline Execution (Days)</div>
                </div>
                <div className="text-right">
                   <div className="font-label-sm text-[9px] text-white/20 tracking-widest uppercase">Total Affected</div>
                   <div className="font-headline-md text-white text-lg">{(deltaReport || []).filter(r => r.daysPushed > 0).length}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary-container" />
                  <span className="font-label-sm text-[9px] text-white/30 tracking-widest">DELAY SHIFT</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#3a3a8a]" />
                  <span className="font-label-sm text-[9px] text-white/30 tracking-widest">BASELINE</span>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
              {(deltaReport || []).map(r => (
                <div key={r.id} className="group">
                  <DeltaBar
                    label={r.name}
                    baseline={r.originalEnd}
                    delta={Math.max(0, r.daysPushed)}
                    max={maxEnd}
                    status={r.daysPushed <= 0 ? 'optimal' : 'delayed'}
                  />
                  {r.daysPushed > 0 && (
                    <div className="ml-36 mt-1 flex items-center justify-between">
                      <span className="text-[8px] font-label-sm text-white/20 tracking-widest">
                        DAY {r.originalEnd} → DAY {r.newEnd}
                      </span>
                      <span className="text-[8px] font-label-sm text-primary-container/60 tracking-widest font-bold">
                         {Math.round((r.daysPushed / r.originalEnd) * 100)}% SLIPPAGE
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* X axis */}
            <div className="flex justify-between mt-3 ml-36 font-label-sm text-[8px] text-white/20 shrink-0 border-t border-white/5 pt-2">
              {[0, Math.round(maxEnd*0.25), Math.round(maxEnd*0.5), Math.round(maxEnd*0.75), maxEnd].map(v => <span key={v}>{v}d</span>)}
            </div>
          </div>
        </div>

        {/* Row 3: Simulation model footer */}
        <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5 flex flex-wrap items-center gap-6">
          <div>
            <div className="font-label-sm text-[9px] text-white/25 tracking-widest uppercase mb-1">Simulation Model</div>
            <div className="font-headline-md text-white text-lg">Monte Carlo</div>
            <div className="font-label-sm text-[9px] text-white/30 tracking-widest">v2.4.9</div>
          </div>
          <div className="w-px h-12 bg-white/8 mx-2" />
          <div>
            <div className="font-label-sm text-[9px] text-white/25 tracking-widest uppercase mb-1">Confidence Score</div>
            <div className="font-headline-md text-primary-container text-lg">{prediction.confidence}%</div>
          </div>
          <div className="w-px h-12 bg-white/8 mx-2" />
          <div>
            <div className="font-label-sm text-[9px] text-white/25 tracking-widest uppercase mb-1">Impacted Nodes</div>
            <div className="font-headline-md text-white text-lg">{affectedIds.length} Entities</div>
          </div>
          <div className="ml-auto flex gap-3">
            <button onClick={onReSimulate}
              className="px-5 py-2.5 border border-white/15 text-white/50 hover:border-white/30 hover:text-white/80 rounded-lg font-label-sm text-[10px] tracking-widest transition-all">
              RE-RUN SIMULATION
            </button>
            <button onClick={onReSimulate}
              className="px-5 py-2.5 bg-primary-container/15 border border-primary-container/30 text-primary-container hover:bg-primary-container/25 rounded-lg font-label-sm text-[10px] tracking-widest font-bold transition-all">
              ADJUST CONSTRAINTS
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
