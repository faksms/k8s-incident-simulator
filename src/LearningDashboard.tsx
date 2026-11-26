import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Terminal } from 'lucide-react'
import { incidentProgressId, learningPaths, nextPathTopic, pathChapters, serviceLabProgressId } from './learningPaths'
import type { PracticeProgress } from './practiceProgress'
import './LearningDashboard.css'

type Props = {
  passed: Set<string>
  practiceProgress: PracticeProgress
  lessonIds: string[]
  incidentCount: number
  weeklyIndex: number
  onTopic: (id: string, track?: string) => void
  onLab: () => void
  onIncident: (index: number) => void
  onBack: () => void
}

export default function LearningDashboard({ passed, practiceProgress, lessonIds, incidentCount, weeklyIndex, onTopic, onLab, onIncident, onBack }: Props) {
  const completedLessons = lessonIds.filter(id => passed.has(id)).length
  const reviewedIncidents = Array.from({ length: incidentCount }, (_, index) => passed.has(incidentProgressId(index))).filter(Boolean).length
  const runs = Object.values(practiceProgress).reduce((total, item) => ({
    completedRuns: total.completedRuns + item.completedRuns,
    guidedRuns: total.guidedRuns + item.guidedRuns,
    hintsRevealed: total.hintsRevealed + item.hintsRevealed,
    wrongDiagnoses: total.wrongDiagnoses + item.wrongDiagnoses,
  }), { completedRuns: 0, guidedRuns: 0, hintsRevealed: 0, wrongDiagnoses: 0 })
  return <main className="dashboard-page">
    <header className="dashboard-header"><button onClick={onBack}><ArrowLeft size={16}/> Back to architecture</button><span>YOUR LEARNING DASHBOARD</span></header>
    <div className="dashboard-shell">
      <p className="dashboard-kicker">LEARN · PRACTICE · REVISIT</p>
      <h1>Build confidence, one skill at a time.</h1>
      <p className="dashboard-intro">Choose a path or jump into practice. Your checks and completed exercises are saved in this browser when storage is available.</p>
      <section className="dashboard-summary" aria-label="Your learning evidence">
        <div><strong>{completedLessons} / {lessonIds.length}</strong><span>Lesson checks passed</span></div>
        <div><strong>{reviewedIncidents} / {incidentCount}</strong><span>Incidents reviewed</span></div>
        <div><strong>{passed.has(serviceLabProgressId) ? 'Verified' : 'Not yet'}</strong><span>Service terminal lab</span></div>
      </section>
      <p className="dashboard-note">These are practice records, not a certification or proof of mastery. Progress stays on this device and can be removed by clearing site data.</p>
      <section className="dashboard-evidence" aria-labelledby="evidence-title">
        <h2 id="evidence-title">Incident practice evidence</h2>
        <p>Completed runs: {runs.completedRuns} · Guided runs: {runs.guidedRuns} · Runs with an independent hint: {runs.hintsRevealed} · Incorrect diagnosis submissions: {runs.wrongDiagnoses}</p>
        <p>Counts include repeat runs and only record completed reviews. Guided runs include automatic tips; use these signals to decide what to revisit, not as a score.</p>
      </section>
      <section aria-labelledby="paths-title">
        <div className="dashboard-section-heading"><div><p className="dashboard-kicker">CHOOSE YOUR DIRECTION</p><h2 id="paths-title">Your chapter-by-chapter journey</h2></div><p>Start with the beginner path, then choose a direction. A passed check counts in every path that uses that topic.</p></div>
        <div className="dashboard-paths">{learningPaths.map(path => {
          const count = path.topics.filter(topic => passed.has(topic.id)).length
          const next = nextPathTopic(path, passed)
          return <article className="dashboard-card" key={path.id}>
            <BookOpen size={22}/><h3>{path.title}</h3><p>{path.description}</p><p><strong>Where this helps:</strong> {path.career}</p>
            {path.id === 'cka' && <p>Introductory topic coverage, not a complete CKA preparation course. The exam is hands-on; this site uses simulations. See the <a href="https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/" target="_blank" rel="noreferrer">official CKA information</a>.</p>}
            <div className="dashboard-count">{count} / {path.topics.length} checks passed</div>
            <progress value={count} max={path.topics.length} aria-label={`${path.title} checks passed`}/>
            <div className="path-chapters">{pathChapters(path).map((chapter, index) => <section key={chapter.id} className="path-chapter">
              <h4>Chapter {index + 1}: {chapter.title}</h4>
              <small>{chapter.topics.filter(topic => passed.has(topic.id)).length} / {chapter.topics.length} checks passed</small>
              <ul>{chapter.topics.map(topic => <li key={topic.id}><button onClick={() => onTopic(topic.id, path.id)}>{passed.has(topic.id) ? <CheckCircle2 size={15}/> : <span aria-hidden="true">○</span>}{topic.title}</button></li>)}</ul>
            </section>)}</div>
            <button className="dashboard-primary" onClick={() => onTopic(next.id, path.id)}>{count === path.topics.length ? 'Review' : 'Continue'}: {next.title} <ArrowRight size={15}/></button>
          </article>
        })}</div>
      </section>
      <section className="dashboard-practice" aria-labelledby="practice-title">
        <div className="dashboard-section-heading"><div><p className="dashboard-kicker">PUT IT INTO PRACTICE</p><h2 id="practice-title">Practice and revisit</h2></div></div>
        <div className="dashboard-practice-grid">
          <article className="dashboard-card"><Terminal size={22}/><h3>Service troubleshooting lab</h3><p>Use simulated kubectl commands to investigate and repair a Service selector.</p><button className="dashboard-primary" onClick={onLab}>{passed.has(serviceLabProgressId) ? 'Try the lab again' : 'Start terminal lab'} <ArrowRight size={15}/></button></article>
          <article className="dashboard-card"><BookOpen size={22}/><h3>Weekly incident challenge</h3><p>Revisit a rotating incident from the existing library. The selection changes each Monday in UTC; no streaks or deadlines.</p><button className="dashboard-primary" onClick={() => onIncident(weeklyIndex)}>Try this week’s incident <ArrowRight size={15}/></button></article>
        </div>
      </section>
      <p className="dashboard-note">All practice is simulated in your browser. No real Kubernetes cluster is connected.</p>
    </div>
  </main>
}
