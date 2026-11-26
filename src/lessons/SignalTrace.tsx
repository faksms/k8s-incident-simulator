import { useEffect, useState } from 'react'
import { Activity, ArrowRight, Pause, Play, RotateCcw } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import StepSequenceControls from './StepSequenceControls'
import './SignalTrace.css'

type TraceStep = { label: string; detail: string }
type SignalTraceProps = {
  title: string
  steps: TraceStep[]
  playToken?: number
}

const stepInterval = 7000

export default function SignalTrace({ title, steps, playToken }: SignalTraceProps) {
  const [active, setActive] = useState(0)
  const reducedMotion = useReducedMotion()
  const [playing, setPlaying] = useState(() => !reducedMotion)

  useEffect(() => {
    if (!playing) return
    const timer = window.setTimeout(() => setActive(current => (current + 1) % steps.length), stepInterval)
    return () => window.clearTimeout(timer)
  }, [playing, active, steps.length])

  useEffect(() => {
    if (reducedMotion) setPlaying(false)
  }, [reducedMotion])

  useEffect(() => {
    if (playToken === undefined || playToken === 0) return
    if (reducedMotion) {
      setActive(steps.length - 1)
      return
    }
    setActive(0)
    setPlaying(true)
  }, [playToken, reducedMotion, steps.length])

  function start() {
    if (reducedMotion) {
      setActive(steps.length - 1)
      return
    }
    if (active >= steps.length - 1) setActive(0)
    setPlaying(true)
  }

  function select(index: number) {
    setPlaying(false)
    setActive(index)
  }

  function previous() {
    setPlaying(false)
    setActive(current => Math.max(0, current - 1))
  }

  function next() {
    setPlaying(false)
    setActive(current => Math.min(steps.length - 1, current + 1))
  }

  function reset() {
    setPlaying(false)
    setActive(0)
  }

  const position = steps.length < 2 ? 50 : 8 + active / (steps.length - 1) * 84

  return <section className="signal-trace" data-playing={playing} aria-label={`${title} animated data path`}>
    <header className="signal-trace-header"><span><Activity size={15}/>{title}</span><div><small>{String(active + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</small><button onClick={playing ? () => setPlaying(false) : start} aria-label={playing ? 'Pause data path' : 'Play data path'}>{playing ? <Pause size={14}/> : <Play size={14}/>}<b>{playing ? 'Pause' : 'Play path'}</b></button><button onClick={() => { setPlaying(false); setActive(0) }} aria-label="Reset data path"><RotateCcw size={14}/></button></div></header>
    <div className="signal-route">
      <span className="signal-route-line"/>
      <motion.i className="signal-packet" animate={{ left: `${position}%` }} transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 100, damping: 18 }}/>
      {steps.map((step, index) => <button key={index} className={`signal-step ${index === active ? 'signal-step-active' : ''} ${index < active ? 'signal-step-done' : ''}`} onClick={() => select(index)} aria-current={index === active ? 'step' : undefined}><span>{String(index + 1).padStart(2, '0')}</span><b>{step.label}</b>{index < steps.length - 1 && <ArrowRight className="signal-step-arrow" size={13}/>}</button>)}
    </div>
    <div className="signal-narration" aria-live={playing ? 'off' : 'polite'}><b>WHAT THE HIGHLIGHT SHOWS · {steps[active].label}</b><p>{steps[active].detail}</p></div>
    <p className="signal-step-caption">The moving marker illustrates this concept; use the simulation controls to change the example state.</p>
    <StepSequenceControls active={active} total={steps.length} playing={playing} intervalMs={stepInterval} onPrevious={previous} onNext={next} onToggle={() => setPlaying(value => !value)} onReset={reset} compact />
  </section>
}
