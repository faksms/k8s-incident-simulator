import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import KubernetesCourse from './KubernetesCourse'
import ClusterArchitecture from './ClusterArchitecture'
import './index.css'

function LearningPath() {
  const [showArchitecture, setShowArchitecture] = React.useState(true)
  const [courseComplete, setCourseComplete] = React.useState(false)
  if (showArchitecture) return <ClusterArchitecture onComplete={() => setShowArchitecture(false)} />
  if (!courseComplete) return <KubernetesCourse onComplete={() => setCourseComplete(true)} onSkip={() => setCourseComplete(true)} />
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LearningPath />
  </React.StrictMode>,
)
