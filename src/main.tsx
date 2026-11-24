import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import KubernetesCourse from './KubernetesCourse'
import './index.css'

function LearningPath() {
  const [courseComplete, setCourseComplete] = React.useState(false)
  if (!courseComplete) {
    return <KubernetesCourse onComplete={() => setCourseComplete(true)} onSkip={() => setCourseComplete(true)} />
  }
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LearningPath />
  </React.StrictMode>,
)
