import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import KubernetesCourse from './KubernetesCourse'
import './index.css'

function LearningGate() {
  const [showCourse, setShowCourse] = React.useState(true)

  if (showCourse) {
    return <KubernetesCourse onComplete={() => setShowCourse(false)} onSkip={() => setShowCourse(false)} />
  }

  return <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LearningGate />
  </React.StrictMode>,
)
