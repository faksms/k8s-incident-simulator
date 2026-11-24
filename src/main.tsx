import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import KubernetesCourse from './KubernetesCourse'
import ClusterArchitecture from './ClusterArchitecture'
import './index.css'

function LearningPath() {
  const [chapter, setChapter] = React.useState<'architecture' | 'course' | 'incidents'>('architecture')
  if (chapter === 'architecture') return <ClusterArchitecture onComplete={() => setChapter('course')} />
  if (chapter === 'course') return <KubernetesCourse onComplete={() => setChapter('incidents')} onSkip={() => setChapter('incidents')} />
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><LearningPath /></React.StrictMode>,
)
