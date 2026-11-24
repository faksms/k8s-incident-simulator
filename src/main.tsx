import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import KubernetesCourse from './KubernetesCourse'
import './index.css'

class CourseErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return <App />
    return this.props.children
  }
}

function LearningPath() {
  const [courseComplete, setCourseComplete] = React.useState(false)
  if (!courseComplete) {
    return (
      <CourseErrorBoundary>
        <KubernetesCourse onComplete={() => setCourseComplete(true)} onSkip={() => setCourseComplete(true)} />
      </CourseErrorBoundary>
    )
  }
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LearningPath />
  </React.StrictMode>,
)
