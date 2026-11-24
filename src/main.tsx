import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import KubernetesCourse from './KubernetesCourse'
import './index.css'

function LearningGate() {
  const [courseDone, setCourseDone] = React.useState(() => localStorage.getItem('sre-foundations-complete') === 'true')
  if (!courseDone) return <KubernetesCourse onComplete={() => { localStorage.setItem('sre-foundations-complete', 'true'); setCourseDone(true) }} onSkip={() => { localStorage.setItem('sre-foundations-complete', 'true'); setCourseDone(true) }} />
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><LearningGate /></React.StrictMode>)
