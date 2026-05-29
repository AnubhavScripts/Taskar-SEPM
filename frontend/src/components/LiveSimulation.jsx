import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const API = 'http://localhost:8001/api'

// Compute all tasks that are transitively downstream of a set of taskIds
function getTransitiveDownstream(tasks, sourceIds) {
  const visited = new Set(sourceIds)
  let frontier = [...sourceIds]
  while (frontier.length > 0) {
    const next = []
    for (const t of tasks) {
      if (!visited.has(t.taskId) && t.dependencies.some(d => visited.has(d))) {
        visited.add(t.taskId)
        next.push(t.taskId)
      }
    }
    frontier = next
  }
  return visited
}

// Compute column layout for DAG
function layoutNodes(tasks) {
  const colOf = {}
  const colRows = {}
  const sorted = [...tasks].sort((a, b) => a.dependencies.length - b.dependencies.length)
  for (const t of sorted) {
    const col = t.dependencies.length === 0 ? 0
      : Math.max(...t.dependencies.map(d => (colOf[d] ?? 0))) + 1
    colOf[t.taskId] = col
    colRows[col] = (colRows[col] || 0)
  }
  const posMap = {}
  const rowCounters = {}
  for (const t of sorted) {
    const col = colOf[t.taskId]
    const row = rowCounters[col] || 0
    rowCounters[col] = row + 1
    posMap[t.taskId] = { x: 90 + col * 170, y: 60 + row * 100 }
  }
  return posMap
}

// Local forward pass for real-time projected dates
function computeLiveSimulation(tasks, delays) {
  const finish = {}
  const sorted = [...tasks].sort((a, b) => {
    // Basic topological sort for the forward pass
    const getDeps = (t) => t.dependencies.length
    return getDeps(a) - getDeps(b)
  })

  // Better topological sort: nodes with no dependencies first, then propagate
  const order = []
  const visited = new Set()
  const tasksCopy = [...tasks]
  while(order.length < tasks.length) {
    const nextNode = tasksCopy.find(t => !visited.has(t.taskId) && t.dependencies.every(d => visited.has(d)))
    if (!nextNode) {
      // Handle potential cycle fallback or missing deps
      const remaining = tasksCopy.find(t => !visited.has(t.taskId))
      if (!remaining) break
      order.push(remaining.taskId)
      visited.add(remaining.taskId)
    } else {
      order.push(nextNode.taskId)
      visited.add(nextNode.taskId)
    }
  }

  const results = {}
  for (const id of order) {
    const t = tasks.find(x => x.taskId === id)
    const delay = delays[id] || 0
    const dur = t.duration + delay
    const start = t.dependencies.length === 0 ? 0 : Math.max(...t.dependencies.map(d => results[d]?.end || 0))
    results[id] = { start, end: start + dur, delta: 0 }
  }

  // Calculate delta against baseline (delays = 0)
  const baseline = {}
  for (const id of order) {
    const t = tasks.find(x => x.taskId === id)
    const start = t.dependencies.length === 0 ? 0 : Math.max(...t.dependencies.map(d => baseline[d] || 0))
    baseline[id] = start + t.duration
    results[id].delta = results[id].end - baseline[id]
    results[id].baselineStart = start
    results[id].baselineEnd = baseline[id]
  }

  return results
}

export default function LiveSimulation({ data, onResults, onBack }) {
  const { tasks, totalDuration, projectId } = data
  const [selectedId, setSelectedId] = useState(tasks[0]?.taskId ?? 1)
  const [delays, setDelays] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [animatingIds, setAnimatingIds] = useState(new Set())
  const [viewMode, setViewMode] = useState('graph') // 'graph' | 'timeline'
  const animTimerRef = useRef(null)

  const selectedTask = tasks.find(t => t.taskId === selectedId) || tasks[0]
  const delay = delays[selectedId] ?? 0

  // Recalculate animated nodes whenever delays change
  useEffect(() => {
    const delayedIds = Object.entries(delays).filter(([, v]) => v > 0).map(([id]) => Number(id))
    if (delayedIds.length === 0) { setAnimatingIds(new Set()); return }
    const allAffected = getTransitiveDownstream(tasks, delayedIds)
    // Animate wave: first direct, then propagate
    setAnimatingIds(new Set(delayedIds))
    if (animTimerRef.current) clearTimeout(animTimerRef.current)
    animTimerRef.current = setTimeout(() => setAnimatingIds(allAffected), 600)
    return () => clearTimeout(animTimerRef.current)
  }, [delays, tasks])

  const setDelay = (id, val) =>
    setDelays(prev => ({ ...prev, [id]: Math.max(0, Math.min(30, Number(val))) }))

  const downstream = tasks.filter(t => t.dependencies.includes(selectedId))
  const posMap = layoutNodes(tasks)

  const svgW = Math.max(600, Math.max(...Object.values(posMap).map(p => p.x)) + 120)
  const svgH = Math.max(320, Math.max(...Object.values(posMap).map(p => p.y)) + 80)

  const delayedIds = new Set(Object.entries(delays).filter(([, v]) => v > 0).map(([id]) => Number(id)))
  const allAffected = getTransitiveDownstream(tasks, [...delayedIds])

  const handleCommit = async () => {
    const list = Object.entries(delays)
      .filter(([, v]) => Number(v) > 0)
      .map(([id, days]) => ({ taskId: Number(id), delayDays: Number(days) }))
    if (!list.length) { setError('Set at least one delay to commit.'); return }
    setError(''); setLoading(true)
    try {
      const res = await axios.post(`${API}/simulate/${projectId}`, { delays: list })
      onResults(res.data.data)
    } catch (e) {
      setError(e.response?.data?.error || 'Simulation failed.')
    } finally { setLoading(false) }
  }

  const liveResults = computeLiveSimulation(tasks, delays)
  const maxProjectedDay = Math.max(1, ...Object.values(liveResults).map(r => Math.max(r.end, r.baselineEnd)))

  return (
    <div className="flex h-full overflow-hidden" style={{ minHeight: 0 }}>

      {/* CENTER — Scrollable node graph */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#111111]" style={{ minWidth: 0 }}>
        {/* Canvas header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-tertiary/10 border border-tertiary/30 text-tertiary px-3 py-1 rounded-full font-label-sm text-[9px] tracking-widest font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
              LIVE SIMULATION
            </div>
            <span className="text-white/25 font-label-sm text-[9px] tracking-widest">SCENARIO: BASELINE Q3_24</span>
            {delayedIds.size > 0 && (
              <span className="text-primary-container font-label-sm text-[9px] tracking-widest animate-pulse">
                ⚡ RIPPLE PROPAGATING…
              </span>
            )}
          </div>
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-[#1e1e1e] border border-white/10 rounded-lg p-1">
            <button onClick={() => setViewMode('graph')}
              className={`px-3 py-1.5 rounded-md font-label-sm text-[9px] tracking-widest font-bold transition-all ${viewMode === 'graph' ? 'bg-[#333] text-white' : 'text-white/30 hover:text-white/60'}`}>
              NODE GRAPH
            </button>
            <button onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-md font-label-sm text-[9px] tracking-widest font-bold transition-all flex items-center gap-1.5 ${viewMode === 'timeline' ? 'bg-[#333] text-white' : 'text-white/30 hover:text-white/60'}`}>
              TIMELINE
              <span className="px-1.5 py-0.5 rounded bg-primary-container/20 text-primary-container text-[7px] border border-primary-container/30">NEW</span>
            </button>
          </div>
        </div>

        {/* Main View Area */}
        <div className="flex-1 overflow-auto p-4" style={{ overflowX: 'auto', overflowY: 'auto' }}>
          {viewMode === 'graph' ? (
            <svg width={svgW} height={svgH} style={{ minWidth: svgW, minHeight: svgH }}>
              <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="rgba(255,255,255,0.15)" />
                </marker>
                <marker id="arrowhead-hot" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#ff7a00" />
                </marker>
              </defs>

              {/* Edges */}
              {tasks.map(t => t.dependencies.map(depId => {
                const from = posMap[depId]
                const to = posMap[t.taskId]
                if (!from || !to) return null
                const isHot = delayedIds.has(depId) || animatingIds.has(depId)
                const isSelectedPath = t.taskId === selectedId || (selectedId && t.taskId === selectedId)
                // Highlight if this edge leads to the selected node or is part of the active ripple
                const isCausal = isHot || (t.taskId === selectedId)
                
                return (
                  <line key={`${depId}-${t.taskId}`}
                    x1={from.x + 52} y1={from.y + 22}
                    x2={to.x - 52}   y2={to.y + 22}
                    stroke={isHot ? '#ff7a00' : isCausal ? '#4f4f8f' : 'rgba(255,255,255,0.08)'}
                    strokeWidth={isHot || isCausal ? 2 : 1}
                    strokeDasharray={isHot ? '6 3' : isCausal ? '4 2' : '0'}
                    style={isHot ? { animation: 'edgeFlow 0.5s linear infinite' } : isCausal ? { opacity: 0.8 } : {}}
                    markerEnd={isHot ? 'url(#arrowhead-hot)' : 'url(#arrowhead)'}
                  />
                )
              }))}

              {/* Nodes */}
              {tasks.map(t => {
                const pos = posMap[t.taskId]
                if (!pos) return null
                const isSelected = t.taskId === selectedId
                const isDelayed  = delayedIds.has(t.taskId)
                const isRipple   = animatingIds.has(t.taskId) && !isDelayed
                const isDown     = downstream.some(d => d.taskId === t.taskId)
                const glowColor  = isDelayed ? '#ff7a00' : isRipple ? '#ff9a3c' : 'none'

                const res = liveResults[t.taskId] || { baselineEnd: 0, end: 0, delta: 0 }

                return (
                  <g key={t.taskId} onClick={() => setSelectedId(t.taskId)} style={{ cursor: 'pointer' }}>
                    {/* Pulse ring for animated nodes */}
                    {(isDelayed || isRipple) && (
                      <rect x={pos.x - 56} y={pos.y - 4} width={108} height={52} rx={10}
                        fill="none"
                        stroke={glowColor}
                        strokeWidth="2"
                        opacity="0.5"
                        style={{ animation: 'nodeRipple 1.2s ease-in-out infinite' }}
                      />
                    )}
                    {/* Main box */}
                    <rect
                      x={pos.x - 50} y={pos.y} width={100} height={44} rx={8}
                      fill={isDelayed ? '#2a1500' : isRipple ? '#1f1800' : isSelected ? '#1e1e2e' : '#1e1e1e'}
                      stroke={isDelayed ? '#ff7a00' : isRipple ? '#ff9a3c80' : isSelected ? '#4f4f8f' : 'rgba(255,255,255,0.08)'}
                      strokeWidth={isDelayed || isSelected ? 1.5 : 1}
                      style={isDelayed ? { filter: 'drop-shadow(0 0 8px rgba(255,122,0,0.5))' } : isRipple ? { filter: 'drop-shadow(0 0 4px rgba(255,154,60,0.3))' } : {}}
                    />
                    {/* Task name */}
                    <text x={pos.x} y={pos.y + 17} textAnchor="middle"
                      fill={isDelayed ? '#ffb68b' : isRipple ? '#ffd0a0' : isSelected ? '#c0c0ff' : 'rgba(255,255,255,0.7)'}
                      fontSize="10" fontFamily="Inter" fontWeight="600">
                      {t.name.length > 13 ? t.name.slice(0, 13) + '…' : t.name}
                    </text>
                    {/* Sub-label: Day Shift */}
                    <text x={pos.x} y={pos.y + 33} textAnchor="middle"
                      fill={isDelayed ? '#ff7a00' : isRipple ? '#ff9a3c' : 'rgba(255,255,255,0.2)'}
                      fontSize="9" fontFamily="Inter" fontWeight={isDelayed || isRipple ? '700' : '400'}>
                      {res.delta > 0 ? `D${res.baselineEnd} → D${res.end}` : `Day ${res.end}`}
                    </text>
                    {/* DELAYED badge */}
                    {isDelayed && (
                      <>
                        <rect x={pos.x + 16} y={pos.y - 12} width={50} height={14} rx={4} fill="#ff7a00" />
                        <text x={pos.x + 41} y={pos.y - 2} textAnchor="middle"
                          fill="#fff" fontSize="8" fontFamily="Inter" fontWeight="700">DELAYED</text>
                      </>
                    )}
                    {isRipple && (
                      <>
                        <rect x={pos.x + 14} y={pos.y - 12} width={54} height={14} rx={4} fill="rgba(255,154,60,0.3)"
                          stroke="#ff9a3c" strokeWidth="0.5" />
                        <text x={pos.x + 41} y={pos.y - 2} textAnchor="middle"
                          fill="#ff9a3c" fontSize="8" fontFamily="Inter" fontWeight="700">RIPPLED</text>
                      </>
                    )}
                  </g>
                )
              })}
            </svg>
          ) : (
            <div className="min-w-[800px] pb-10 p-4">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-white/15" />
                    <span className="font-label-sm text-[9px] text-white/40 tracking-widest uppercase">Baseline Schedule</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-[#ff7a00]" />
                    <span className="font-label-sm text-[9px] text-white/40 tracking-widest uppercase">Direct Delay</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-[#ff9a3c]" />
                    <span className="font-label-sm text-[9px] text-white/40 tracking-widest uppercase">Ripple Effect</span>
                  </div>
                </div>
                <div className="font-body-md text-white/40 text-xs italic">Drag the slider on the right to see the waterfall effect</div>
              </div>
              
              <div className="space-y-3 relative">
                {/* Vertical grid lines */}
                <div className="absolute inset-y-0 left-[208px] right-[80px] pointer-events-none flex justify-between z-0">
                  {[0, 0.25, 0.5, 0.75, 1].map(pct => (
                    <div key={pct} className="w-px h-full bg-white/5" />
                  ))}
                </div>

                {tasks.map(t => {
                  const res = liveResults[t.taskId] || { baselineStart: 0, baselineEnd: 0, start: 0, end: 0, delta: 0 }
                  const isSelected = t.taskId === selectedId
                  const isDelayed = delayedIds.has(t.taskId)
                  const isRipple = res.delta > 0 && !isDelayed
                  
                  return (
                    <div key={t.taskId} 
                      onClick={() => setSelectedId(t.taskId)}
                      className={`flex items-center gap-4 p-2 rounded-lg cursor-pointer border transition-colors relative z-10 ${isSelected ? 'bg-white/5 border-white/10' : 'border-transparent hover:bg-white/5'}`}>
                      
                      <div className="w-48 shrink-0 flex items-center justify-between">
                        <div className={`font-body-md text-sm truncate pr-2 ${isSelected ? 'text-primary-container' : 'text-white/80'}`}>{t.name}</div>
                        {res.delta > 0 && (
                          <span className="font-label-sm text-[9px] text-[#ff9a3c] font-bold shrink-0">+{res.delta}D</span>
                        )}
                      </div>
                      
                      <div className="flex-1 relative h-8 bg-[#161616] rounded border border-white/5 overflow-hidden">
                        {/* Baseline Bar (Ghost) */}
                        <div className="absolute top-1 bottom-1 bg-white/15 rounded transition-all"
                          style={{
                            left: `${(res.baselineStart / maxProjectedDay) * 100}%`,
                            width: `${((res.baselineEnd - res.baselineStart) / maxProjectedDay) * 100}%`
                          }} 
                        />
                        
                        {/* Projected Bar */}
                        <div className={`absolute top-1 bottom-1 rounded transition-all duration-300 ${isDelayed ? 'bg-[#ff7a00]' : isRipple ? 'bg-[#ff9a3c]' : 'bg-[#4f4f8f]'}`}
                          style={{
                            left: `${(res.start / maxProjectedDay) * 100}%`,
                            width: `${((res.end - res.start) / maxProjectedDay) * 100}%`,
                            opacity: res.delta > 0 ? 1 : 0.6,
                            boxShadow: res.delta > 0 ? '0 0 10px rgba(255,122,0,0.3)' : 'none'
                          }} 
                        />
                      </div>
                      
                      <div className="w-16 shrink-0 font-label-sm text-[10px] text-white/30 text-right">
                        Day {res.end}
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Timeline X-Axis */}
              <div className="flex ml-[208px] mr-[80px] mt-2 relative h-6 pt-2">
                {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                  const day = Math.round(pct * maxProjectedDay)
                  return (
                    <div key={pct} className="absolute -translate-x-1/2 flex flex-col items-center gap-1" style={{ left: `${pct * 100}%` }}>
                      <div className="w-px h-2 bg-white/20" />
                      <span className="font-label-sm text-[8px] text-white/40 tracking-widest">D{day}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 px-6 py-3 flex items-center gap-8 shrink-0 bg-[#111]">
          <div>
            <div className="font-label-sm text-[9px] text-white/30 tracking-widest uppercase mb-1">Confidence Score</div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-white/8 rounded-full overflow-hidden">
                <div className="h-full bg-primary-container rounded-full" style={{ width: '94%' }} />
              </div>
              <span className="font-headline-md text-primary-container text-lg">94%</span>
            </div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <div className="font-label-sm text-[9px] text-white/30 tracking-widest uppercase mb-1">Global Float</div>
            <div className={`font-headline-md text-lg ${[...delayedIds].length > 0 ? 'text-error' : 'text-white/40'}`}>
              {[...delayedIds].length > 0
                ? `-${Object.values(delays).reduce((a, b) => a + b, 0)} days`
                : '0 days'}
            </div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              {tasks.slice(0, 3).map((t, i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <span className="font-label-sm text-[8px] text-white/50">{t.name[0]}</span>
                </div>
              ))}
            </div>
            {tasks.length > 3 && <span className="font-label-sm text-[9px] text-white/30">+{tasks.length - 3}</span>}
          </div>
        </div>
      </div>

      {/* RIGHT — Causal Control Panel */}
      <div className="w-[280px] shrink-0 border-l border-white/5 bg-[#161616] flex flex-col overflow-y-auto">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
          <span className="font-label-sm text-[10px] text-white/60 tracking-widest uppercase font-bold">Causal Control</span>
          <button className="w-6 h-6 flex items-center justify-center text-white/30 hover:text-white/60">
            <span className="material-symbols-outlined text-base">info</span>
          </button>
        </div>

        <div className="p-5 space-y-5 flex-1">
          {/* Task selector */}
          <div>
            <div className="font-label-sm text-[9px] text-white/30 tracking-widest uppercase mb-2">Selected Task</div>
            <div className="relative">
              <select value={selectedId} onChange={e => setSelectedId(Number(e.target.value))}
                className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-2.5 text-white/80 text-xs font-medium outline-none appearance-none cursor-pointer hover:border-white/25 transition-colors">
                {tasks.map(t => (
                  <option key={t.taskId} value={t.taskId}>{t.name} (#{t.taskId})</option>
                ))}
              </select>
              <span className="material-symbols-outlined text-white/30 text-base absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
            </div>
          </div>

          {/* Delay slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="font-label-sm text-[9px] text-white/30 tracking-widest uppercase">Input Delay (Days)</div>
              <span className="font-headline-md text-primary-container text-xl font-bold"
                style={{ textShadow: delay > 0 ? '0 0 20px rgba(255,122,0,0.6)' : 'none' }}>
                {String(delay).padStart(2, '0')}
              </span>
            </div>
            <input type="range" min="0" max="30" value={delay}
              onChange={e => setDelay(selectedId, e.target.value)}
              className="w-full accent-primary-container cursor-pointer" />
            <div className="flex justify-between font-label-sm text-[8px] text-white/20 mt-1">
              <span>0 DAYS</span><span>15 DAYS</span><span>30 DAYS</span>
            </div>
          </div>

          {/* Live impact preview */}
          {delay > 0 && (
            <div className="bg-[#1e1e1e] border border-primary-container/20 rounded-xl p-4">
              <div className="font-label-sm text-[9px] text-primary-container tracking-widest uppercase mb-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" />
                Estimated Impact
              </div>
              <div className="space-y-3">
                {downstream.slice(0, 2).map((d, i) => (
                  <div key={d.taskId} className="flex gap-2">
                    <div className="w-0.5 bg-primary-container/60 rounded-full shrink-0" />
                    <div>
                      <div className="font-body-md text-white/70 text-xs font-semibold mb-0.5">
                        {i === 0 ? 'Secondary Delay: ' : 'Critical Path Failure: '}{d.name}
                      </div>
                      <div className="text-white/30 text-[10px] leading-snug">
                        {i === 0 ? 'Downstream nodes pushed past deadline.' : `Buffer zone exceeded by ${delay * 8} hours.`}
                      </div>
                    </div>
                  </div>
                ))}
                {downstream.length === 0 && (
                  <p className="text-white/25 text-[10px]">No direct downstream tasks — isolated node.</p>
                )}
              </div>
            </div>
          )}

          {/* Downstream nodes */}
          <div>
            <div className="font-label-sm text-[9px] text-white/30 tracking-widest uppercase mb-3 flex items-center justify-between">
              <span>Downstream Impact</span>
              {downstream.length > 0 && <span className="text-primary-container">{downstream.length} NODES</span>}
            </div>
            <div className="space-y-2">
              {downstream.length === 0
                ? <p className="text-white/20 text-[10px] font-label-sm italic">No downstream dependencies for this node</p>
                : downstream.map(d => {
                    const res = liveResults[d.taskId] || { delta: 0, end: 0 }
                    return (
                      <div key={d.taskId}
                        className={`flex flex-col border rounded-lg px-3 py-2 transition-all duration-500
                          ${animatingIds.has(d.taskId)
                            ? 'bg-primary-container/8 border-primary-container/30'
                            : 'bg-[#1e1e1e] border-white/5'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`material-symbols-outlined text-sm ${res.delta > 0 ? 'text-primary-container' : 'text-white/20'}`}>
                              {res.delta > 0 ? 'move_down' : 'radio_button_unchecked'}
                            </span>
                            <span className="font-body-md text-white/80 text-xs truncate max-w-[140px] font-semibold">{d.name}</span>
                          </div>
                          <span className={`font-label-sm text-[10px] font-bold transition-colors duration-500 ${res.delta > 0 ? 'text-primary-container' : 'text-white/20'}`}>
                            {res.delta > 0 ? `+${res.delta}d` : '0d'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] font-label-sm tracking-widest text-white/30">
                          <span>CAUSAL SHIFT</span>
                          <span className={res.delta > 0 ? 'text-white/50' : ''}>PUSHED TO DAY {res.end}</span>
                        </div>
                      </div>
                    )
                  })}
              {/* Other non-downstream tasks (dimmed) */}
              {tasks.filter(t => !downstream.find(d => d.taskId === t.taskId) && t.taskId !== selectedId).length > 0 && (
                <div className="pt-2 border-t border-white/5 opacity-40">
                   <div className="font-label-sm text-[8px] text-white/20 tracking-widest uppercase mb-2">Unaffected Tasks</div>
                   {tasks.filter(t => !downstream.find(d => d.taskId === t.taskId) && t.taskId !== selectedId).slice(0, 2).map(t => (
                      <div key={t.taskId} className="flex items-center justify-between bg-[#111] border border-white/3 rounded-lg px-3 py-1.5 mb-1.5">
                        <span className="text-white/30 text-[10px] truncate max-w-[110px]">{t.name}</span>
                        <span className="text-white/20 text-[9px]">STABLE</span>
                      </div>
                   ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-5 space-y-3 border-t border-white/5 shrink-0">
          {error && <div className="text-error font-label-sm text-[9px] tracking-widest text-center">{error}</div>}
          <button onClick={handleCommit} disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary-container text-white py-3 rounded-lg font-label-sm text-[10px] tracking-widest font-bold glow-button hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50">
            <span className="material-symbols-outlined text-sm">rocket_launch</span>
            {loading ? 'COMMITTING…' : 'COMMIT CHANGES'}
          </button>
          <button onClick={onBack}
            className="w-full py-2.5 rounded-lg border border-white/10 text-white/40 hover:border-white/25 hover:text-white/60 font-label-sm text-[10px] tracking-widest transition-all">
            RESET SIMULATION
          </button>
        </div>
      </div>
    </div>
  )
}
