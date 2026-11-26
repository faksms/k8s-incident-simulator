import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, RotateCcw, ShieldCheck, Terminal } from 'lucide-react'
import { initialLabState, runLabCommand } from './serviceLabEngine'
import './PracticalLab.css'

type Entry = { command: string; output: string }

export default function PracticalLab({ onBack, onVerified }: { onBack: () => void; onVerified: () => void }) {
  const [state, setState] = useState(initialLabState)
  const [command, setCommand] = useState('')
  const [entries, setEntries] = useState<Entry[]>([])
  const outputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const output = outputRef.current
    if (output) output.scrollTop = output.scrollHeight
  }, [entries])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!command.trim()) return
    const result = runLabCommand(state, command)
    if (!state.verified && result.state.verified) onVerified()
    setState(result.state)
    setEntries(current => [...current, { command: command.trim(), output: result.output }])
    setCommand('')
  }

  function reset() {
    setState(initialLabState)
    setEntries([])
    setCommand('')
  }

  return <main className="practical-page">
    <header className="practical-header">
      <button className="practical-back" onClick={onBack}><ArrowLeft size={17}/> Back to learning</button>
      <span><ShieldCheck size={16}/> BROWSER SIMULATION</span>
    </header>
    <div className="practical-layout">
      <section className="practical-brief" aria-labelledby="practical-title">
        <p className="practical-kicker">HANDS-ON LAB · SERVICES</p>
        <h1 id="practical-title">The frontend is unreachable.</h1>
        <p>Customers cannot reach the frontend Service. The application Pod is running. Investigate the Service and Pod, fix the problem, and verify the result.</p>
        <div className="practical-objective">
          <strong>Your mission</strong>
          <ol><li>Compare the Service selector with the Pod labels.</li><li>Correct the mismatch.</li><li>Inspect the Service again to verify its endpoints.</li></ol>
        </div>
        <details><summary>Need a hint?</summary><p>Use <code>help</code> to see supported commands. Describe the Service and compare its selector with the labels shown on the Pod.</p></details>
        <p className="practical-disclaimer">This is a simplified, browser-only simulation—not a real cluster or a general-purpose terminal. Only the commands listed by <code>help</code> are supported. Nothing is installed or executed on your computer.</p>
        {state.verified && <div className="practical-success" role="status"><strong>Endpoint verified</strong><p>The Service selector now matches the Ready Pod. In a real cluster, also test traffic and investigate why the mismatch occurred.</p></div>}
      </section>
      <section className="practical-terminal" aria-labelledby="terminal-title">
        <div className="practical-terminal-header"><h2 id="terminal-title"><Terminal size={18}/> Simulated terminal</h2><button onClick={reset}><RotateCcw size={15}/> Reset lab</button></div>
        <div ref={outputRef} className="practical-output" role="log" aria-label="Command history" aria-live="polite">
          <p>Training environment ready. Type <strong>help</strong> to list supported commands.</p>
          {entries.map((entry, index) => <div className="practical-entry" key={index}><div><span aria-hidden="true">$ </span>{entry.command}</div><pre>{entry.output}</pre></div>)}
        </div>
        <form className="practical-form" onSubmit={submit}>
          <label htmlFor="practical-command">Command</label>
          <div><span aria-hidden="true">$</span><input id="practical-command" value={command} onChange={event => setCommand(event.target.value)} placeholder="Type help to get started" autoComplete="off" spellCheck={false}/><button type="submit">Run</button></div>
        </form>
      </section>
    </div>
  </main>
}
