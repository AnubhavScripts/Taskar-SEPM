const EXAMPLES = [
  `Frontend design should be completed in 5 days. Backend API development depends on frontend and will take 7 days. Database setup takes 3 days. Testing depends on both frontend and backend, estimated 4 days. Deployment depends on testing and takes 2 days.`,
  `Sprint planning takes 1 day. UI development takes 6 days after sprint planning. API integration takes 5 days after sprint planning. QA testing depends on UI development and API integration, takes 3 days. Release depends on QA and takes 1 day.`,
  `Authentication module takes 4 days. Payment gateway integration depends on authentication and takes 6 days. User dashboard takes 5 days after authentication. Final testing depends on payment gateway and user dashboard, estimated 3 days.`,
]

import { useState } from 'react'
import axios from 'axios'
import StepBar from './StepBar'

const API = 'http://localhost:8001/api'

export default function InputView({ onExtract }) {
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleExtract = async () => {
    if (text.trim().length < 20) { setError('Please enter a more detailed description with task names and durations.'); return }
    setError(''); setLoading(true)
    try {
      const res = await axios.post(`${API}/projects/extract`, { rawInput: text, title: title || undefined })
      onExtract(res.data.data)
    } catch (e) {
      setError(e.response?.data?.error || 'Extraction failed. Check your input and try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 bg-background">
      <div className="max-w-3xl mx-auto">
        <StepBar current={0} />

        <div className="text-center mb-10">
          <span className="text-primary-container font-label-sm uppercase tracking-widest mb-4 block">Step 1</span>
          <h2 className="font-headline-lg text-on-surface mb-3">Describe your project</h2>
          <p className="font-body-lg text-on-surface-variant max-w-xl mx-auto">
            Paste meeting notes, task decisions, or any plain-text plan. Include task names and durations.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-8 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="proj-title" className="font-label-sm uppercase tracking-widest text-white/40 block">
              Project Title <span className="normal-case tracking-normal text-white/20">(optional)</span>
            </label>
            <input id="proj-title"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-on-surface placeholder-white/20 focus:outline-none focus:border-primary-container transition-colors font-body-md"
              placeholder="e.g. Q3 Sprint Plan"
              value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          {/* Textarea */}
          <div className="space-y-2">
            <label htmlFor="raw-input" className="font-label-sm uppercase tracking-widest text-white/40 block">
              Decision Text / Meeting Notes
            </label>
            <textarea id="raw-input" rows={10}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-on-surface placeholder-white/20 focus:outline-none focus:border-primary-container transition-colors resize-none leading-relaxed font-body-md"
              placeholder={`Example:\n"Frontend should be done in 5 days, backend depends on it and takes 7 days, testing after both takes 4 days..."`}
              value={text} onChange={e => { setText(e.target.value); setError('') }} />
            <div className="text-right font-label-sm text-white/20">{text.length} characters</div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex gap-3 bg-error-container/10 border border-error/20 text-error rounded-lg p-4 font-body-md">
              <span className="material-symbols-outlined text-base shrink-0">warning</span>{error}
            </div>
          )}

          {/* Submit */}
          <button onClick={handleExtract} disabled={loading} id="btn-extract"
            className="w-full flex items-center justify-center gap-2 bg-primary-container text-white font-headline-md py-4 rounded-lg glow-button hover:bg-orange-600 hover:scale-[1.01] transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <><span className="spinner" />Extracting Tasks…</> : <>Launch Extractor →</>}
          </button>

          {/* Examples */}
          <div className="pt-4 border-t border-white/5">
            <p className="font-label-sm uppercase tracking-widest text-white/30 mb-3">Quick Examples</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex, i) => (
                <button key={i} onClick={() => setText(ex)}
                  className="font-label-sm border border-white/10 text-white/40 hover:border-primary-container hover:text-primary-container px-4 py-2 rounded-full transition-all">
                  Example {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
