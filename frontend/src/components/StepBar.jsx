const STEPS = ['Input', 'Extract', 'Review', 'Simulate', 'Results']

export default function StepBar({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10 overflow-x-auto pb-1">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 font-serif
              ${i === current
                ? 'bg-primary-container text-white glow-button scale-110'
                : i < current
                  ? 'bg-tertiary-container/30 text-tertiary border border-tertiary/40'
                  : 'bg-white/5 text-white/30 border border-white/10'}`}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className={`text-[10px] font-semibold tracking-widest uppercase whitespace-nowrap font-label-sm
              ${i === current ? 'text-primary-container' : i < current ? 'text-tertiary' : 'text-white/30'}`}>
              {s}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-px w-8 md:w-14 mx-1 mt-[-14px] transition-all duration-500
              ${i < current ? 'bg-tertiary/40' : 'bg-white/10'}`} />
          )}
        </div>
      ))}
    </div>
  )
}
