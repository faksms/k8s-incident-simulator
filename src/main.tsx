import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import KubernetesCourse from './KubernetesCourse'
import './index.css'

class LearningErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) return <App />
    return this.props.children
  }
}

function LearningGate() {
  let complete = false
  try {
    complete = localStorage.getItem('sre-foundations-complete') === 'true'
  } catch {
    complete = false
  }

  const [courseDone, setCourseDone] = React.useState(complete)
  const finishCourse = () => {
    try {
      localStorage.setItem('sre-foundations-complete', 'true')
    } catch {
      // The simulator remains usable when browser storage is unavailable.
    }
    setCourseDone(true)
  }

  if (!courseDone) {
    return <KubernetesCourse onComplete={finishCourse} onSkip={finishCourse} />
  }
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LearningErrorBoundary>
      <LearningGate />
    </LearningErrorBoundary>
  </React.StrictMode>,
)
