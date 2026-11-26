import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import KubernetesCourse, { initialLessonIndex } from './KubernetesCourse'
import ClusterArchitecture from './ClusterArchitecture'
import { decodeProgress, progressKey } from './progress'
import './index.css'
import './SitePolish.css'

function LearningPath() {
  const [chapter, setChapter] = React.useState<'architecture' | 'course' | 'incidents'>('architecture')
  const [lessonIndex, setLessonIndex] = React.useState(initialLessonIndex)
  const [savedProgress] = React.useState(() => {
    try {
      return { lessons: decodeProgress(window.localStorage.getItem(progressKey)), error: false }
    } catch (error) {
      console.warn('Could not load course progress:', error)
      return { lessons: new Set<string>(), error: true }
    }
  })
  const [passedLessons, setPassedLessons] = React.useState(savedProgress.lessons)
  const [storageError, setStorageError] = React.useState(savedProgress.error)
  React.useEffect(() => {
    if (storageError) return
    try {
      window.localStorage.setItem(progressKey, JSON.stringify([...passedLessons]))
    } catch (error) {
      console.warn('Could not save course progress:', error)
      setStorageError(true)
    }
  }, [passedLessons, storageError])
  function navigate(next: 'architecture' | 'course' | 'incidents') {
    setChapter(next)
    window.scrollTo(0, 0)
  }
  function markPassed(id: string) {
    setPassedLessons(current => new Set(current).add(id))
  }
  const page = chapter === 'architecture'
    ? <ClusterArchitecture onComplete={() => navigate('course')} passed={passedLessons.has('architecture')} onPass={() => markPassed('architecture')} />
    : chapter === 'course'
      ? <KubernetesCourse index={lessonIndex} onIndexChange={setLessonIndex} passedLessons={passedLessons} onPass={markPassed} onArchitecture={() => navigate('architecture')} onComplete={() => navigate('incidents')} onSkip={() => navigate('incidents')} />
      : <App onReturnToCourse={() => navigate('course')} />
  return <>{storageError && <p className="progress-storage-warning" role="alert">Progress could not be saved or loaded in this browser. Your checks will only be kept for this session.</p>}{page}</>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><LearningPath /></React.StrictMode>,
)
