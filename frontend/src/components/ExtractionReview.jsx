import { useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:8001/api'

const STATUS_ICONS = {
  validated: { icon: 'check_circle', color: 'text-tertiary' },
  warning: { icon: 'warning', color: 'text-yellow-400' },
  pending: { icon: 'radio_button_unchecked', color: 'text-white/30' },
}

export default function ExtractionReview({ data, onSimulate, onBack }) {
  const { tasks, totalDuration, criticalPath, prediction, rawInput, title } = data
  const [loading, setLoading] = useState(false)

  const getStatus = (t) => {
    if (t.isCriticalPath) return 'warning'
    if (t.riskLevel === 'low') return 'validated'
    return 'pending'
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-start justify-between px-8 pt-8 pb-5 border-b border-white/5 shrink-0">
        <div>
          <h1 className="font-headline-lg text-on-surface text-4xl mb-1">Extraction & Review</h1>
          <p className="font-body-md text-on-surface-variant text-sm max-w-xl">
            Refining causality nodes from raw project documentation. Review the identified entities and
            structural task dependencies before initiating the ripple analysis.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-tertiary/10 border border-tertiary/30 text-tertiary px-3 py-1.5 rounded-full font-label-sm text-[10px] tracking-widest font-bold shrink-0 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
          {prediction.confidence}% CONFIDENCE
        </div>
      </div>

      {/* Split content */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* LEFT — Raw source text */}
        <div className="w-[320px] shrink-0 border-r border-white/5 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container text-sm">electric_bolt</span>
              <span className="font-label-sm text-[9px] tracking-widest text-white/40 uppercase font-bold">Raw Source Text</span>
            </div>
            <span className="font-label-sm text-[9px] text-white/20 tracking-widest uppercase">
              {title || 'PROJECT_CHARTER_V2'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            <p className="font-body-md text-white/40 text-xs leading-relaxed">
              {/* Render raw input with task names highlighted */}
              {tasks.reduce((parts, t) => {
                const last = parts[parts.length - 1]
                if (typeof last !== 'string') return parts
                const idx = last.toLowerCase().indexOf(t.name.toLowerCase())
                if (idx === -1) return parts
                return [
                  ...parts.slice(0, -1),
                  last.slice(0, idx),
                  <span key={t.taskId} className="bg-primary-container/20 text-primary-container underline decoration-primary-container/40 cursor-pointer rounded px-0.5">
                    {last.slice(idx, idx + t.name.length)}
                  </span>,
                  last.slice(idx + t.name.length),
                ]
              }, [rawInput || 'Raw input text...'])}
            </p>
          </div>
        </div>

        {/* RIGHT — Extracted task nodes table */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container text-sm">hub</span>
              <span className="font-label-sm text-[9px] tracking-widest text-white/40 uppercase font-bold">Extracted Task Nodes</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-7 h-7 flex items-center justify-center text-white/30 hover:text-white/60">
                <span className="material-symbols-outlined text-base">filter_list</span>
              </button>
              <button className="w-7 h-7 flex items-center justify-center text-white/30 hover:text-white/60">
                <span className="material-symbols-outlined text-base">download</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[#161616] z-10">
                <tr className="font-label-sm text-[9px] tracking-widest text-white/30 uppercase border-b border-white/5">
                  <th className="text-left px-6 py-3 font-bold">Task Name</th>
                  <th className="text-left px-4 py-3 font-bold">Duration</th>
                  <th className="text-left px-4 py-3 font-bold">Dependencies</th>
                  <th className="text-right px-6 py-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/3">
                {tasks.map(t => {
                  const st = getStatus(t)
                  const { icon, color } = STATUS_ICONS[st]
                  return (
                    <tr key={t.taskId} className="hover:bg-white/2 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {t.isCriticalPath && <span className="w-1 h-8 rounded-full bg-primary-container shrink-0" />}
                          <span className="text-white/80 font-medium truncate max-w-[140px]">{t.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-white/30 text-xs">schedule</span>
                          <span className="text-on-surface-variant font-bold">{t.duration}</span>
                          <span className="text-white/25 uppercase tracking-widest text-[9px]">Days</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {t.dependencies.length === 0
                          ? <span className="font-label-sm text-[9px] text-white/20 tracking-widest uppercase">No Predecessors</span>
                          : <div className="flex flex-wrap gap-1">
                            {t.dependencies.map(d => {
                              const dep = tasks.find(tt => tt.taskId === d)
                              return (
                                <span key={d} className="font-label-sm text-[9px] bg-white/8 border border-white/10 text-white/50 px-2 py-0.5 rounded uppercase tracking-widest truncate max-w-[100px]">
                                  {dep?.name || `#${d}`}
                                </span>
                              )
                            })}
                          </div>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`material-symbols-outlined text-base ${color}`}>{icon}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Action footer */}
          <div className="border-t border-white/5 px-6 py-4 shrink-0 flex items-center justify-between bg-[#161616]">
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-tertiary" />
                <span className="font-label-sm text-[9px] text-white/40 tracking-widest uppercase">Validated Entities</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                <span className="font-label-sm text-[9px] text-white/40 tracking-widest uppercase">Potential Bottleneck</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={onBack}
                className="px-5 py-2 font-label-sm text-[10px] tracking-widest text-white/40 hover:text-white/70 border border-white/10 hover:border-white/25 rounded-lg transition-all">
                CANCEL
              </button>
              <button onClick={onSimulate} disabled={loading}
                className="flex items-center gap-2 bg-primary-container text-white px-6 py-2.5 rounded-lg font-label-sm text-[10px] tracking-widest font-bold glow-button hover:bg-orange-600 transition-all active:scale-95">
                CONFIRM & SIMULATE
                <span className="material-symbols-outlined text-sm">play_arrow</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom stats bar */}
      <div className="border-t border-white/5 px-8 py-4 bg-[#111] shrink-0 flex items-center gap-12">
        <div>
          <div className="font-label-sm text-[9px] text-white/30 tracking-widest uppercase mb-1">Total Tasks</div>
          <div className="font-headline-md text-white text-2xl">{tasks.length} Nodes</div>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div>
          <div className="font-label-sm text-[9px] text-white/30 tracking-widest uppercase mb-1">Critical Path</div>
          <div className="font-headline-md text-primary-container text-2xl">{totalDuration} Days</div>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="flex-1">
          <div className="font-label-sm text-[9px] text-white/30 tracking-widest uppercase mb-1">Simulation Readiness</div>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
              <div className="h-full bg-primary-container rounded-full transition-all duration-700"
                style={{ width: `${prediction.confidence}%`, boxShadow: '0 0 8px #ff7a00' }} />
            </div>
            <span className="font-headline-md text-primary-container text-xl shrink-0">{prediction.confidence}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
