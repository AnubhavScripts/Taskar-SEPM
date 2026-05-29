import { useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:8001/api'

const RECENT = [
  { title: 'Q3 Logistics Strategy', ago: '2H AGO', desc: 'Review of global supply chain bottlenecks and projected fuel costs for 2024 expansion.', tag: '+4 NODES EXTRACTED', color: 'text-primary-container' },
  { title: 'Project: Hyperion Risk', ago: 'YESTERDAY', desc: 'Contingency planning for server migration and potential data integrity risks.', tag: 'AT RISK', color: 'text-error', extra: '12 DECISIONS' },
]

export default function InputHub({ onExtract }) {
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleExtract = async () => {
    if (text.trim().length < 20) { setError('Input too short. Describe tasks with durations.'); return }
    setError(''); setLoading(true)
    try {
      const res = await axios.post(`${API}/projects/extract`, { rawInput: text, title: title || undefined })
      onExtract(res.data.data)
    } catch (e) {
      setError(e.response?.data?.error || 'Extraction failed.')
    } finally { setLoading(false) }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto pb-16">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-headline-lg text-on-surface mb-2">Input Hub</h1>
        <p className="font-body-md text-on-surface-variant max-w-lg">
          Transcribe the causal links of your enterprise strategy. Paste raw decision
          data to trigger the predictive extraction engine.
        </p>
      </div>

      {/* Main input card */}
      <div className="bg-[#1a1a1a] border border-white/8 rounded-xl mb-5 overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-sm">electric_bolt</span>
            <span className="font-label-sm text-[10px] tracking-widest text-white/50 uppercase font-bold">Content Feed</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              className="bg-transparent text-white/40 text-xs placeholder-white/25 outline-none w-40"
              placeholder="Project title (optional)"
              value={title} onChange={e => setTitle(e.target.value)} />
            <button className="w-7 h-7 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors">
              <span className="material-symbols-outlined text-base">attach_file</span>
            </button>
            <button className="w-7 h-7 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors">
              <span className="material-symbols-outlined text-base">share</span>
            </button>
          </div>
        </div>

        {/* Textarea */}
        <textarea
          rows={11}
          className="w-full bg-transparent px-5 py-4 text-white/60 placeholder-white/20 outline-none resize-none font-body-md text-sm leading-relaxed"
          placeholder="Paste your meeting notes or decision logs here to begin simulation..."
          value={text} onChange={e => { setText(e.target.value); setError('') }}
        />

        {/* Error */}
        {error && (
          <div className="mx-5 mb-4 flex gap-2 bg-error-container/10 border border-error/20 text-error rounded-lg p-3 font-label-sm text-xs">
            <span className="material-symbols-outlined text-sm shrink-0">warning</span>{error}
          </div>
        )}

        {/* Extract button */}
        <div className="flex justify-center pb-6 pt-2">
          <button onClick={handleExtract} disabled={loading}
            className="flex items-center gap-2 bg-primary-container text-white px-10 py-3.5 rounded-full font-label-sm text-[11px] tracking-widest font-bold glow-button hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50">
            {loading
              ? <><span className="spinner" />EXTRACTING…</>
              : <><span className="material-symbols-outlined text-sm">electric_bolt</span>EXTRACT TASKS</>}
          </button>
        </div>
      </div>

      {/* Status row */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5">
          <div className="font-label-sm text-[9px] tracking-widest text-primary-container uppercase font-bold mb-2">Engine Status</div>
          <div className="flex items-center justify-between">
            <span className="font-headline-md text-white text-xl">Operational</span>
            <div className="flex gap-0.5 items-end h-6">
              {[3,5,4,6,3,5,7,4].map((h,i) => (
                <div key={i} className="w-1 bg-primary-container rounded-full opacity-70" style={{ height: `${h * 3}px` }} />
              ))}
            </div>
          </div>
        </div>
        <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5">
          <div className="font-label-sm text-[9px] tracking-widest text-tertiary uppercase font-bold mb-2">Queue Load</div>
          <div className="flex items-center justify-between">
            <span className="font-headline-md text-white text-xl">Low Latency</span>
            <span className="font-label-sm text-[10px] text-tertiary font-bold tracking-wider">14ns</span>
          </div>
        </div>
      </div>

      {/* Recent sessions */}
      <div className="mb-6">
        <h2 className="font-headline-md text-white text-xl mb-5">Recent Sessions</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-4">
            {RECENT.map((s, i) => (
              <div key={i} className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5 hover:border-white/15 transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-body-md text-white font-semibold text-sm">{s.title}</span>
                  <span className="font-label-sm text-[9px] text-white/30 tracking-widest">{s.ago}</span>
                </div>
                <p className="font-body-md text-white/40 text-xs leading-relaxed mb-3">{s.desc}</p>
                <div className="flex items-center gap-3">
                  <span className={`font-label-sm text-[9px] tracking-widest border px-2 py-0.5 rounded ${s.color} border-current/30`}>{s.tag}</span>
                  {s.extra && <span className="font-label-sm text-[9px] text-white/30 tracking-widest">{s.extra}</span>}
                </div>
              </div>
            ))}
            <button className="w-full font-label-sm text-[10px] text-white/30 hover:text-white/60 tracking-widest py-2 transition-colors">
              VIEW ALL HISTORY
            </button>
          </div>

          {/* Predictive linkage card */}
          <div className="bg-[#1a1a1a] border border-primary-container/20 rounded-xl p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute bottom-0 right-0 opacity-10 pointer-events-none">
              <span className="material-symbols-outlined text-[120px] text-primary-container">hub</span>
            </div>
            <div>
              <h3 className="font-headline-md text-white text-2xl mb-3">Predictive Linkage</h3>
              <p className="font-body-md text-white/40 text-sm leading-relaxed">
                Unlock deep causality mapping. Our engine identifies second-order consequences
                in your decision logs before they happen.
              </p>
            </div>
            <button className="flex items-center gap-1 text-primary-container font-label-sm text-[11px] tracking-widest font-bold mt-6 hover:gap-2 transition-all">
              LEARN MORE <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="fixed bottom-0 left-[190px] right-0 bg-[#0e0e0e] border-t border-white/5 px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
          <span className="font-label-sm text-[9px] text-white/30 tracking-widest">SYSTEM READY</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-label-sm text-[9px] text-white/30 tracking-widest">TOKENS: 14,029 / 50K</span>
          <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-primary-container w-[28%] rounded-full" />
          </div>
        </div>
        <span className="font-label-sm text-[9px] text-white/20 tracking-widest">V2.4.9-STABLE</span>
      </div>
    </div>
  )
}
