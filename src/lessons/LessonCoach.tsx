import { CheckCircle2, CircleHelp, Target } from 'lucide-react'
import './LessonCoach.css'

type LessonCoachProps = {
  task: string
  hint: string
  complete: boolean
  success: string
}

export default function LessonCoach({ task, hint, complete, success }: LessonCoachProps) {
  return <section className={`lesson-coach ${complete ? 'lesson-coach-complete' : ''}`} aria-live="polite">
    <div className="lesson-coach-heading"><Target size={15}/><b>TRY IT</b><span>{complete ? 'COMPLETE' : 'PRACTICE'}</span></div>
    <p>{task}</p>
    {complete && <div className="lesson-coach-success"><CheckCircle2 size={15}/>{success}</div>}
    <details><summary><CircleHelp size={13}/> Need a hint?</summary><p>{hint}</p></details>
  </section>
}