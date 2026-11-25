import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react'
import './StepSequenceControls.css'

type Props = {
  active: number
  total: number
  playing: boolean
  intervalMs?: number
  onPrevious: () => void
  onNext: () => void
  onToggle: () => void
  onReset: () => void
  compact?: boolean
}

export default function StepSequenceControls({ active, total, playing, intervalMs = 2800, onPrevious, onNext, onToggle, onReset, compact=false }: Props) {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    setProgress(100)
    if (!playing) return
    const start = performance.now()
    const tick = window.setInterval(() => {
      const elapsed = performance.now() - start
      setProgress(Math.max(0, 100 - elapsed / intervalMs * 100))
    }, 80)
    return () => window.clearInterval(tick)
  }, [active, playing, intervalMs])

  const seconds = Math.max(0, Math.ceil(progress / 100 * (intervalMs / 1000)))

  return <div className={`step-sequence-controls ${compact ? 'step-sequence-compact' : ''}`}>
    <button type="button" className="step-control-icon" onClick={onPrevious} disabled={active === 0} aria-label="Previous step"><ChevronLeft size={16}/><span>Previous</span></button>
    <button type="button" className="step-control-primary" onClick={onToggle} aria-label={playing ? 'Pause sequence' : 'Play sequence'}>{playing ? <Pause size={15}/> : <Play size={15}/>}<span>{playing ? 'Pause' : 'Play'}</span></button>
    <button type="button" className="step-control-icon" onClick={onNext} disabled={active >= total - 1} aria-label="Next step"><span>Next</span><ChevronRight size={16}/></button>
    <button type="button" className="step-control-icon" onClick={onReset} aria-label="Reset sequence"><RotateCcw size={15}/><span>Reset</span></button>
    <div className="step-countdown" style={{ '--step-progress': `${progress}%` } as CSSProperties} aria-label={`${seconds} seconds until next step`}>
      <span>{playing ? seconds : 'Ⅱ'}</span>
    </div>
  </div>
}
