import { useState } from 'react'

export default function Navbar({ onReset }) {
  const [scrolled, setScrolled] = useState(false)
  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#0a0a0a]/90' : 'bg-[#0a0a0a]/80'} backdrop-blur-xl border-b border-white/10 shadow-2xl`}>
      <div className="flex justify-between items-center px-8 py-4 max-w-screen-2xl mx-auto">
        <button onClick={onReset} className="text-2xl font-bold tracking-tighter text-primary-container font-serif hover:opacity-80 transition-opacity">
          Ripple Effect
        </button>
        <div className="flex items-center gap-4">
          <span className="hidden md:block text-white/40 font-label-sm uppercase tracking-widest">Decision Impact Simulator</span>
          <button onClick={onReset}
            className="bg-primary-container text-white px-5 py-2 rounded-full font-serif font-bold tracking-tight glow-button hover:bg-orange-600 transition-all active:scale-95 text-sm">
            New Project
          </button>
        </div>
      </div>
    </nav>
  )
}
