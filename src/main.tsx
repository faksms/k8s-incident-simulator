import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import KubernetesCourse from './KubernetesCourse'
import ClusterArchitecture from './ClusterArchitecture'
import './index.css'
import './SitePolish.css'

function LearningPath() {
  const [chapter, setChapter] = React.useState<'architecture' | 'course' | 'incidents'>('architecture')
  const [lessonIndex, setLessonIndex] = React.useState(0)
  const [passedLessons, setPassedLessons] = React.useState<Set<string>>(() => new Set())
  function navigate(next: 'architecture' | 'course' | 'incidents') {
    setChapter(next)
    window.scrollTo(0, 0)
  }
  function markPassed(id: string) {
    setPassedLessons(current => new Set(current).add(id))
  }
  if (chapter === 'architecture') return <ClusterArchitecture onComplete={() => navigate('course')} passed={passedLessons.has('architecture')} onPass={() => markPassed('architecture')} />
  if (chapter === 'course') return <KubernetesCourse index={lessonIndex} onIndexChange={setLessonIndex} passedLessons={passedLessons} onPass={markPassed} onArchitecture={() => navigate('architecture')} onComplete={() => navigate('incidents')} onSkip={() => navigate('incidents')} />
  return <App onReturnToCourse={() => navigate('course')} />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><LearningPath /></React.StrictMode>,
)
