export default function GanttChart({ tasks, totalDuration, affectedIds = [] }) {
  if (!tasks || tasks.length === 0 || totalDuration === 0) return null
  const scale = (n) => `${Math.max(0, (n / totalDuration) * 100)}%`

  return (
    <div className="mt-4 space-y-2.5 overflow-x-auto pb-2">
      {tasks.map(t => {
        const id = t.taskId ?? t.id
        const dur = t.duration ?? (t.endDay - t.startDay)
        const isAffected = affectedIds.includes(id)
        const isCP = t.isCriticalPath
        return (
          <div key={id} className="flex items-center gap-3 min-w-[560px]">
            <div className="w-36 text-right font-body-md text-on-surface-variant text-xs truncate shrink-0">{t.name}</div>
            <div className="flex-1 relative h-7 bg-white/5 rounded-lg overflow-hidden border border-white/5">
              <div
                className="absolute top-1 bottom-1 rounded-md transition-all duration-700"
                style={{
                  left: scale(t.startDay),
                  width: scale(dur),
                  background: isAffected
                    ? '#ff7a00'
                    : isCP
                      ? 'linear-gradient(90deg,#ff7a00,#ff9a3c)'
                      : 'rgba(255,255,255,0.15)',
                  boxShadow: isAffected || isCP ? '0 0 8px rgba(255,122,0,0.5)' : 'none',
                }}
              />
            </div>
            <div className="w-14 font-label-sm text-white/30 shrink-0">Day {t.endDay}</div>
          </div>
        )
      })}

      {/* Axis */}
      <div className="flex ml-[156px] mr-[56px] relative h-5 mt-1 min-w-[280px]">
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <span key={i} className="absolute font-label-sm text-white/20 -translate-x-1/2"
            style={{ left: `${p * 100}%` }}>
            {Math.round(p * totalDuration)}d
          </span>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-5 mt-2 ml-[156px]">
        <div className="flex items-center gap-1.5 font-label-sm text-white/30">
          <div className="w-3 h-2 rounded" style={{ background: 'linear-gradient(90deg,#ff7a00,#ff9a3c)' }} />
          Critical Path
        </div>
        <div className="flex items-center gap-1.5 font-label-sm text-white/30">
          <div className="w-3 h-2 rounded bg-white/15" />
          Normal
        </div>
        <div className="flex items-center gap-1.5 font-label-sm text-white/30">
          <div className="w-3 h-2 rounded bg-primary-container" />
          Ripple Affected
        </div>
      </div>
    </div>
  )
}
