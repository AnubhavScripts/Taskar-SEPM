import { useState } from 'react'
import axios from 'axios'
import StepBar from './StepBar'
import GanttChart from './GanttChart'

const API = 'http://localhost:8001/api'

export default function SimulateView({ data, onResults, onBack }) {
  const { tasks, totalDuration, projectId } = data
  const [delays, setDelays] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const setDelay = (id, val) =>
    setDelays(prev => ({ ...prev, [id]: Math.max(0, Number(val)) }))

  const handleSim = async () => {
    const list = Object.entries(delays)
      .filter(([, v]) => Number(v) > 0)
      .map(([id, days]) => ({ taskId: Number(id), delayDays: Number(days) }))
    if (!list.length) { setError('Add at least one delay to run the simulation.'); return }
    setError(''); setLoading(true)
    try {
      const res = await axios.post(`${API}/simulate/${projectId}`, { delays: list })
      onResults(res.data.data)
    } catch (e) {
      setError(e.response?.data?.error || 'Simulation failed. Please try again.')
    } finally { setLoading(false) }
  }

  const anyDelay = Object.values(delays).some(v => v > 0)

  return (
    <div className="min-h-screen pt-28 pb-24 px-6 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <StepBar current={2} />

        <div className="text-center mb-8">
          <span className="text-primary-container font-label-sm uppercase tracking-widest mb-3 block">Step 3</span>
          <h2 className="font-headline-lg text-on-surface mb-2">Configure Delays</h2>
          <p className="font-body-lg text-on-surface-variant">Set delay days per task. The ripple propagates to all dependents automatically.</p>
        </div>

        {/* Gantt */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="font-headline-md text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-2xl">timeline</span> Current Timeline
          </h3>
          <GanttChart tasks={tasks} totalDuration={totalDuration} />
        </div>

        {/* Delay controls */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="font-headline-md text-on-surface mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-2xl">schedule</span> Apply Delays
          </h3>
          <p className="font-body-md text-on-surface-variant mb-5">
            Tasks marked ⚡ are on the critical path — delays here impact the entire project.
          </p>

          <div className="space-y-3">
            {tasks.map(t => {
              const delay = delays[t.taskId] ?? 0
              return (
                <div key={t.taskId}
                  className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-200
                    ${delay > 0
                      ? 'border-primary-container/40 bg-primary-container/5'
                      : t.isCriticalPath
                        ? 'border-white/15 bg-white/3'
                        : 'border-white/5 bg-white/2'}`}>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 font-body-md font-semibold text-on-surface">
                      {t.isCriticalPath && <span className="text-primary-container" title="Critical path">⚡</span>}
                      <span className="truncate">{t.name}</span>
                    </div>
                    <div className="font-label-sm text-white/30 mt-0.5">
                      {t.duration}d · Ends Day {t.endDay}
                      {t.dependencies.length > 0 && ` · Needs: ${t.dependencies.map(d => `#${d}`).join(', ')}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setDelay(t.taskId, delay - 1)}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-on-surface hover:border-primary-container hover:text-primary-container transition flex items-center justify-center font-bold text-lg">
                      −
                    </button>
                    <input type="number" min="0" max="90"
                      value={delay}
                      onChange={e => setDelay(t.taskId, e.target.value)}
                      className="w-16 text-center bg-white/5 border border-white/10 rounded-lg py-1.5 text-on-surface font-semibold text-sm focus:outline-none focus:border-primary-container transition" />
                    <button onClick={() => setDelay(t.taskId, delay + 1)}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-on-surface hover:border-primary-container hover:text-primary-container transition flex items-center justify-center font-bold text-lg">
                      +
                    </button>
                    <span className="text-white/30 font-label-sm w-8">days</span>
                  </div>

                  {delay > 0 && (
                    <div className="w-full font-label-sm text-primary-container flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">waves</span>
                      This task delayed by {delay} day{delay > 1 ? 's' : ''} — ripple will propagate
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {error && (
            <div className="mt-4 flex gap-2 bg-error-container/10 border border-error/20 text-error rounded-lg p-4 font-body-md">
              <span className="material-symbols-outlined text-sm shrink-0">warning</span>{error}
            </div>
          )}
        </div>

        {/* Delay summary banner */}
        {anyDelay && (
          <div className="glass-panel rounded-xl p-5 border-primary-container/30" style={{ borderColor: 'rgba(255,122,0,0.3)' }}>
            <p className="font-label-sm text-primary-container uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">waves</span> Scheduled Delays
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(delays).filter(([, v]) => v > 0).map(([id, d]) => {
                const t = tasks.find(t => t.taskId === Number(id))
                return (
                  <span key={id} className="font-label-sm bg-primary-container/10 border border-primary-container/30 text-primary-container px-3 py-1 rounded-full">
                    {t?.name}: +{d}d
                  </span>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-2">
          <button onClick={onBack}
            className="flex-1 md:flex-none px-8 py-3 border border-white/10 text-on-surface-variant rounded-lg hover:border-white/30 transition-all font-body-md font-semibold">
            ← Back
          </button>
          <button onClick={handleSim} disabled={loading} id="btn-run-sim"
            className="flex-1 md:flex-none px-8 py-3 bg-primary-container text-white font-body-md font-bold rounded-lg glow-button hover:bg-orange-600 hover:scale-[1.01] transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading ? <><span className="spinner" />Simulating…</> : <><span className="material-symbols-outlined text-sm">waves</span> Run Ripple Simulation</>}
          </button>
        </div>
      </div>
    </div>
  )
}
