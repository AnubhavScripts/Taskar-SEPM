import StepBar from './StepBar'
import GanttChart from './GanttChart'

const riskPill = (l) => ({
  high: 'bg-error-container/20 text-error border border-error/30',
  medium: 'bg-yellow-900/20 text-yellow-400 border border-yellow-700/30',
  low: 'bg-tertiary-container/20 text-tertiary border border-tertiary/30',
}[l] || '')

const sevIcon = (s) => s === 'high' ? '🔴' : s === 'medium' ? '🟡' : '🟢'

export default function ResultsView({ data, onReset, onReSimulate }) {
  const {
    simulatedDuration, originalDuration, delayedBy,
    affectedTasks, deltaReport, prediction, tasks, criticalPath,
  } = data
  const affectedIds = affectedTasks || []

  return (
    <div className="min-h-screen pt-28 pb-24 px-6 bg-background">
      <div className="max-w-5xl mx-auto space-y-6">
        <StepBar current={4} />

        <div className="text-center mb-8">
          <span className="text-primary-container font-label-sm uppercase tracking-widest mb-3 block">Simulation Complete</span>
          <h2 className="font-headline-lg text-on-surface mb-2">Ripple Impact Report</h2>
          <p className="font-body-lg text-on-surface-variant">Here is how your delays cascade across the full dependency graph.</p>
        </div>

        {/* Duration impact banner */}
        <div className="glass-panel rounded-2xl p-8">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            <div className="text-center">
              <div className="font-label-sm text-white/30 uppercase tracking-widest mb-2">Original Duration</div>
              <div className="font-headline-lg text-on-surface-variant">{originalDuration}d</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-white/20">
                <div className="h-px w-8 bg-white/10" />
                <span className="material-symbols-outlined text-primary-container">arrow_forward</span>
                <div className="h-px w-8 bg-white/10" />
              </div>
              <div className={`font-label-sm px-4 py-1.5 rounded-full border font-semibold
                ${delayedBy > 0
                  ? 'bg-primary-container/10 border-primary-container/40 text-primary-container'
                  : 'bg-tertiary-container/20 border-tertiary/40 text-tertiary'}`}
                style={delayedBy > 0 ? { boxShadow: '0 0 16px rgba(255,122,0,0.2)' } : {}}>
                {delayedBy > 0 ? `+${delayedBy} days delayed` : '✓ No net delay'}
              </div>
            </div>
            <div className="text-center">
              <div className="font-label-sm text-white/30 uppercase tracking-widest mb-2">New Duration</div>
              <div className="font-headline-lg text-primary-container"
                style={{ textShadow: '0 0 30px rgba(255,122,0,0.4)' }}>
                {simulatedDuration}d
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { v: affectedIds.length, l: 'Tasks Affected', c: 'text-primary-container' },
            { v: prediction.overallRisk.toUpperCase(), l: 'Project Risk', pill: riskPill(prediction.overallRisk) },
            { v: `${prediction.confidence}%`, l: 'Confidence', c: 'text-tertiary' },
            { v: criticalPath.length, l: 'Critical Path', c: 'text-primary-container' },
          ].map(({ v, l, c, pill }) => (
            <div key={l} className="glass-panel rounded-xl p-5 text-center">
              {pill
                ? <div className={`font-label-sm px-3 py-1.5 rounded-full inline-block mb-1 ${pill}`}>{v}</div>
                : <div className={`font-headline-md mb-1 ${c}`}>{v}</div>}
              <div className="font-label-sm text-white/30 uppercase tracking-widest">{l}</div>
            </div>
          ))}
        </div>

        {/* Updated Gantt */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="font-headline-md text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-2xl">bar_chart</span>
            Updated Timeline (Post-Simulation)
          </h3>
          <GanttChart tasks={tasks} totalDuration={simulatedDuration} affectedIds={affectedIds} />
        </div>

        {/* Impact table */}
        <div className="glass-panel rounded-2xl p-6 overflow-x-auto">
          <h3 className="font-headline-md text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-2xl">waves</span>
            Ripple Delta Report
          </h3>
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="text-left font-label-sm text-white/30 uppercase tracking-widest border-b border-white/5">
                <th className="pb-3 pr-4">Task</th>
                <th className="pb-3 pr-4">Orig. End</th>
                <th className="pb-3 pr-4">New End</th>
                <th className="pb-3 pr-4">Pushed</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(deltaReport || []).map(r => (
                <tr key={r.id}
                  className={`${r.isAffected ? 'bg-primary-container/5' : ''} hover:bg-white/3 transition-colors`}>
                  <td className="py-3 pr-4 text-on-surface font-body-md font-medium">
                    {r.name}
                    {r.isCriticalPath && (
                      <span className="ml-2 font-label-sm bg-primary-container/15 text-primary-container border border-primary-container/30 px-1.5 py-0.5 rounded-full">⚡</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-on-surface-variant font-body-md">Day {r.originalEnd}</td>
                  <td className={`py-3 pr-4 font-semibold font-body-md ${r.daysPushed > 0 ? 'text-primary-container' : 'text-on-surface-variant'}`}>
                    Day {r.newEnd}
                  </td>
                  <td className={`py-3 pr-4 font-bold font-body-md ${r.daysPushed > 0 ? 'text-primary-container' : 'text-white/20'}`}
                    style={r.daysPushed > 0 ? { textShadow: '0 0 10px rgba(255,122,0,0.4)' } : {}}>
                    {r.daysPushed > 0 ? `+${r.daysPushed}d` : r.daysPushed < 0 ? `${r.daysPushed}d` : '—'}
                  </td>
                  <td className="py-3 pr-4">
                    {r.delayAdded > 0
                      ? <span className="font-label-sm bg-primary-container/15 text-primary-container border border-primary-container/30 px-2.5 py-1 rounded-full">⚠ Direct +{r.delayAdded}d</span>
                      : r.isAffected
                        ? <span className="font-label-sm bg-yellow-900/20 text-yellow-400 border border-yellow-700/30 px-2.5 py-1 rounded-full">🌊 Rippled</span>
                        : <span className="font-label-sm bg-tertiary-container/20 text-tertiary border border-tertiary/30 px-2.5 py-1 rounded-full">✓ On Track</span>}
                  </td>
                  <td className="py-3">
                    <span className={`font-label-sm px-2.5 py-1 rounded-full ${riskPill(r.riskLevel)}`}>{r.riskLevel}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recommendations */}
        {prediction.recommendations.length > 0 && (
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="font-headline-md text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container text-2xl">tips_and_updates</span>
              Post-Simulation Recommendations
            </h3>
            <div className="space-y-3">
              {prediction.recommendations.map((r, i) => (
                <div key={i} className={`flex gap-3 p-4 rounded-xl font-body-md
                  ${r.severity === 'high' ? 'bg-error-container/10 border border-error/20'
                    : r.severity === 'medium' ? 'bg-yellow-900/10 border border-yellow-700/20'
                    : 'bg-tertiary-container/10 border border-tertiary/20'}`}>
                  <span className="shrink-0 text-base">{sevIcon(r.severity)}</span>
                  <p className="text-on-surface-variant leading-relaxed">{r.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 pt-2">
          <button onClick={onReSimulate}
            className="flex-1 md:flex-none px-8 py-3 border border-white/10 text-on-surface-variant rounded-lg hover:border-white/30 transition-all font-body-md font-semibold">
            ← Re-Simulate
          </button>
          <button onClick={onReset} id="btn-new-project"
            className="flex-1 md:flex-none px-8 py-3 bg-primary-container text-white font-body-md font-bold rounded-lg glow-button hover:bg-orange-600 hover:scale-[1.01] transition-all active:scale-[0.99]">
            Start New Project
          </button>
        </div>
      </div>
    </div>
  )
}
