import { useState } from 'react'
import './index.css'
import LandingView from './components/LandingView'
import AppShell from './components/AppShell'
import InputHub from './components/InputHub'
import ExtractionReview from './components/ExtractionReview'
import LiveSimulation from './components/LiveSimulation'
import ImpactAnalytics from './components/ImpactAnalytics'

const PAGE_TO_NAV = {
  input: 'dashboard',
  review: 'simulations',
  simulate: 'simulations',
  results: 'simulations',
  history: 'history',
}

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function App() {
  const [view, setView] = useState('landing')
  const [extractedData, setExtractedData] = useState(null)
  const [simulationData, setSimulationData] = useState(null)
  const [history, setHistory] = useState([])

  const pushHistory = (extracted, simResult) => {
    const entry = {
      id: Date.now(),
      title: extracted?.title || 'Untitled Project',
      date: new Date().toISOString(),
      tasks: extracted?.tasks?.length ?? 0,
      criticalPath: extracted?.criticalPath?.length ?? 0,
      originalDuration: simResult.originalDuration,
      simulatedDuration: simResult.simulatedDuration,
      delayedBy: simResult.delayedBy,
      affectedCount: simResult.affectedTasks?.length ?? 0,
      risk: simResult.prediction?.overallRisk ?? 'unknown',
      confidence: simResult.prediction?.confidence ?? 0,
      extractedData: extracted,
      simulationData: simResult,
    }
    setHistory(prev => [entry, ...prev].slice(0, 20))
  }

  const reset = () => { setView('landing'); setExtractedData(null); setSimulationData(null) }
  const goInput = () => setView('input')
  const goHome  = () => setView('landing')

  if (view === 'landing') return <LandingView onStart={goInput} />

  return (
    <AppShell
      activePage={PAGE_TO_NAV[view] || 'dashboard'}
      onNav={(id) => {
        if (id === 'dashboard') setView('input')
        else if (id === 'history') setView('history')
        else if (id === 'simulations') setView(extractedData ? 'simulate' : 'input')
      }}
      onNewNode={goInput}
      onRunSimulation={() => setView(extractedData ? 'simulate' : 'input')}
      onHome={goHome}
      sessionName={extractedData?.title || 'Alpha-9'}
    >
      {/* ── Input Hub ─────────────────────────────── */}
      {view === 'input' && (
        <InputHub onExtract={(d) => { setExtractedData(d); setView('review') }} />
      )}

      {/* ── Extraction & Review ───────────────────── */}
      {view === 'review' && extractedData && (
        <ExtractionReview
          data={extractedData}
          onSimulate={() => setView('simulate')}
          onBack={() => setView('input')}
        />
      )}

      {/* ── Live Simulation ───────────────────────── */}
      {view === 'simulate' && extractedData && (
        <LiveSimulation
          data={extractedData}
          onResults={(d) => {
            setSimulationData(d)
            pushHistory(extractedData, d)
            setView('results')
          }}
          onBack={() => setView('review')}
        />
      )}

      {/* ── Impact Analytics ──────────────────────── */}
      {view === 'results' && simulationData && (
        <ImpactAnalytics
          data={{ ...simulationData, title: extractedData?.title }}
          onReset={reset}
          onReSimulate={() => setView('simulate')}
        />
      )}

      {/* ── History ───────────────────────────────── */}
      {view === 'history' && (
        <HistoryView
          history={history}
          onOpen={(item) => {
            setExtractedData(item.extractedData)
            setSimulationData(item.simulationData)
            setView('results')
          }}
          onNew={goInput}
          onClear={() => setHistory([])}
        />
      )}
    </AppShell>
  )
}

/* ── History View ─────────────────────────────────────────────── */
const RISK_PILL = {
  high:   'bg-red-900/20 text-red-400 border border-red-700/30',
  medium: 'bg-yellow-900/20 text-yellow-400 border border-yellow-700/30',
  low:    'bg-teal-900/20 text-teal-400 border border-teal-700/30',
  unknown:'bg-white/5 text-white/30 border border-white/10',
}

function HistoryView({ history, onOpen, onNew, onClear }) {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] text-center p-8">
        <span className="material-symbols-outlined text-[72px] mb-4" style={{ color: 'rgba(255,255,255,0.06)' }}>history</span>
        <h2 className="font-headline-md text-white/20 text-2xl mb-2">No Simulation History</h2>
        <p className="text-white/20 text-sm max-w-sm font-body-md leading-relaxed">
          Completed simulations are saved here automatically. Run a project to get started.
        </p>
        <button onClick={onNew}
          className="mt-6 bg-primary-container text-white px-6 py-2.5 rounded-lg font-label-sm text-[10px] tracking-widest font-bold glow-button hover:bg-orange-600 transition-all">
          START NEW SIMULATION
        </button>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-headline-lg text-on-surface text-4xl mb-1">History</h1>
          <p className="text-on-surface-variant text-sm">{history.length} simulation{history.length !== 1 ? 's' : ''} on record</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onNew}
            className="px-5 py-2 bg-primary-container text-white rounded-lg font-label-sm text-[10px] tracking-widest font-bold glow-button hover:bg-orange-600 transition-all">
            NEW SIMULATION
          </button>
          <button onClick={onClear}
            className="px-5 py-2 border border-white/10 text-white/30 hover:border-red-700/40 hover:text-red-400 rounded-lg font-label-sm text-[10px] tracking-widest transition-all">
            CLEAR ALL
          </button>
        </div>
      </div>

      {/* Sessions grid */}
      <div className="space-y-3">
        {history.map((item) => (
          <button key={item.id} onClick={() => onOpen(item)}
            className="w-full text-left bg-[#1a1a1a] border border-white/8 hover:border-primary-container/40 rounded-xl p-5 transition-all group">
            <div className="flex flex-wrap items-start justify-between gap-4">
              {/* Left info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-container/15 border border-primary-container/30 flex items-center justify-center shrink-0 group-hover:bg-primary-container/25 transition-colors">
                    <span className="material-symbols-outlined text-primary-container text-sm">analytics</span>
                  </div>
                  <div>
                    <div className="font-body-md text-white font-semibold text-sm">{item.title}</div>
                    <div className="font-label-sm text-[9px] text-white/25 tracking-widest uppercase">{timeAgo(item.date)}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="font-label-sm text-[9px] bg-white/5 border border-white/8 text-white/40 px-2.5 py-1 rounded-full tracking-widest">
                    {item.tasks} NODES
                  </span>
                  <span className="font-label-sm text-[9px] bg-white/5 border border-white/8 text-white/40 px-2.5 py-1 rounded-full tracking-widest">
                    CP: {item.criticalPath} TASKS
                  </span>
                  <span className="font-label-sm text-[9px] bg-white/5 border border-white/8 text-white/40 px-2.5 py-1 rounded-full tracking-widest">
                    {item.affectedCount} AFFECTED
                  </span>
                </div>
              </div>

              {/* Right stats */}
              <div className="flex items-center gap-6 shrink-0">
                <div className="text-center">
                  <div className="font-label-sm text-[8px] text-white/25 uppercase tracking-widest mb-1">Original</div>
                  <div className="font-headline-md text-white/50 text-lg">{item.originalDuration}d</div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="material-symbols-outlined text-primary-container text-base">arrow_forward</span>
                  {item.delayedBy > 0 && (
                    <span className="font-label-sm text-[8px] text-primary-container tracking-widest">+{item.delayedBy}d</span>
                  )}
                </div>
                <div className="text-center">
                  <div className="font-label-sm text-[8px] text-white/25 uppercase tracking-widest mb-1">Simulated</div>
                  <div className={`font-headline-md text-lg ${item.delayedBy > 0 ? 'text-primary-container' : 'text-tertiary'}`}>
                    {item.simulatedDuration}d
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-label-sm text-[8px] text-white/25 uppercase tracking-widest mb-1">Risk</div>
                  <span className={`font-label-sm text-[9px] px-2 py-1 rounded-full ${RISK_PILL[item.risk]}`}>
                    {item.risk.toUpperCase()}
                  </span>
                </div>
                <div className="text-center">
                  <div className="font-label-sm text-[8px] text-white/25 uppercase tracking-widest mb-1">Confidence</div>
                  <div className="font-headline-md text-tertiary text-lg">{item.confidence}%</div>
                </div>
                <div className="text-white/20 group-hover:text-primary-container transition-colors">
                  <span className="material-symbols-outlined text-xl">chevron_right</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
