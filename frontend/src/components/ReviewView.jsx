import StepBar from './StepBar'
import GanttChart from './GanttChart'

const riskPill = (l) => ({
  high: 'bg-error-container/20 text-error border border-error/30',
  medium: 'bg-yellow-900/20 text-yellow-400 border border-yellow-700/30',
  low: 'bg-tertiary-container/20 text-tertiary border border-tertiary/30',
}[l] || '')

const sevIcon = (s) => s === 'high' ? '🔴' : s === 'medium' ? '🟡' : '🟢'

export default function ReviewView({ data, onSimulate, onBack }) {
  const { tasks, totalDuration, criticalPath, bottlenecks, prediction, title } = data

  return (
    <div className="min-h-screen pt-28 pb-24 px-6 bg-background">
      <div className="max-w-5xl mx-auto space-y-6">
        <StepBar current={1} />

        <div className="text-center mb-8">
          <span className="text-primary-container font-label-sm uppercase tracking-widest mb-3 block">Extraction Complete</span>
          <h2 className="font-headline-lg text-on-surface mb-2">{title || 'Extracted Task Graph'}</h2>
          <p className="font-body-lg text-on-surface-variant">Review the structured dependency graph. Critical path and risk levels are computed.</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { v: tasks.length, l: 'Tasks Found', c: 'text-on-surface' },
            { v: `${totalDuration}d`, l: 'Total Duration', c: 'text-primary-container' },
            { v: criticalPath.length, l: 'Critical Path', c: 'text-primary-container' },
            { v: `${prediction.confidence}%`, l: 'Confidence', c: 'text-tertiary' },
          ].map(({ v, l, c }) => (
            <div key={l} className="glass-panel rounded-xl p-5 text-center">
              <div className={`font-headline-md mb-1 ${c}`} style={c === 'text-primary-container' ? { textShadow: '0 0 20px rgba(255,122,0,0.4)' } : {}}>
                {v}
              </div>
              <div className="font-label-sm text-white/30 uppercase tracking-widest">{l}</div>
            </div>
          ))}
        </div>

        {/* Gantt */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="font-headline-md text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-2xl">timeline</span> Project Timeline
          </h3>
          <GanttChart tasks={tasks} totalDuration={totalDuration} />
        </div>

        {/* Task table */}
        <div className="glass-panel rounded-2xl p-6 overflow-x-auto">
          <h3 className="font-headline-md text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-2xl">account_tree</span> Task Structure
          </h3>
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-left font-label-sm text-white/30 uppercase tracking-widest border-b border-white/5">
                <th className="pb-3 pr-4">#</th>
                <th className="pb-3 pr-4">Task</th>
                <th className="pb-3 pr-4">Duration</th>
                <th className="pb-3 pr-4">Depends On</th>
                <th className="pb-3 pr-4">Start</th>
                <th className="pb-3 pr-4">End</th>
                <th className="pb-3 pr-4">Risk</th>
                <th className="pb-3">Path</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tasks.map(t => (
                <tr key={t.taskId} className={`${t.isCriticalPath ? 'bg-primary-container/5' : ''} hover:bg-white/3 transition-colors`}>
                  <td className="py-3 pr-4 text-white/30 font-label-sm">{t.taskId}</td>
                  <td className="py-3 pr-4 text-on-surface font-body-md font-medium">{t.name}</td>
                  <td className="py-3 pr-4 text-on-surface-variant font-body-md">{t.duration}d</td>
                  <td className="py-3 pr-4">
                    {t.dependencies.length === 0
                      ? <span className="text-white/20 font-label-sm">None</span>
                      : t.dependencies.map(d => (
                        <span key={d} className="inline-block bg-primary-container/10 text-primary-container font-label-sm px-2 py-0.5 rounded-full mr-1 border border-primary-container/20">
                          #{d}
                        </span>
                      ))}
                  </td>
                  <td className="py-3 pr-4 text-on-surface-variant font-body-md">Day {t.startDay}</td>
                  <td className="py-3 pr-4 text-on-surface-variant font-body-md">Day {t.endDay}</td>
                  <td className="py-3 pr-4">
                    <span className={`font-label-sm px-2.5 py-1 rounded-full ${riskPill(t.riskLevel)}`}>{t.riskLevel}</span>
                  </td>
                  <td className="py-3">
                    {t.isCriticalPath
                      ? <span className="font-label-sm bg-primary-container/15 text-primary-container border border-primary-container/30 px-2 py-0.5 rounded-full">⚡ CP</span>
                      : <span className="text-white/20">—</span>}
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
              <span className="material-symbols-outlined text-primary-container text-2xl">tips_and_updates</span> Recommendations
            </h3>
            <div className="space-y-3">
              {prediction.recommendations.map((r, i) => (
                <div key={i} className={`flex gap-3 p-4 rounded-xl font-body-md
                  ${r.severity === 'high' ? 'bg-error-container/10 border border-error/20'
                    : r.severity === 'medium' ? 'bg-yellow-900/10 border border-yellow-700/20'
                    : 'bg-tertiary-container/10 border border-tertiary/20'}`}>
                  <span className="shrink-0">{sevIcon(r.severity)}</span>
                  <p className="text-on-surface-variant leading-relaxed">{r.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-2">
          <button onClick={onBack}
            className="flex-1 md:flex-none px-8 py-3 border border-white/10 text-on-surface-variant rounded-lg hover:border-white/30 transition-all font-body-md font-semibold">
            ← Back
          </button>
          <button onClick={onSimulate} id="btn-go-simulate"
            className="flex-1 md:flex-none px-8 py-3 bg-primary-container text-white font-body-md font-bold rounded-lg glow-button hover:bg-orange-600 hover:scale-[1.01] transition-all active:scale-[0.99]">
            Run Simulation →
          </button>
        </div>
      </div>
    </div>
  )
}
