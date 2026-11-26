import React from 'react'
import ReactDOM from 'react-dom/client'
import App, { incidentCount } from './App'
import KubernetesCourse, { courseLessonIds, initialLessonIndex } from './KubernetesCourse'
import ClusterArchitecture from './ClusterArchitecture'
import PracticalLab from './PracticalLab'
import LearningDashboard from './LearningDashboard'
import { incidentProgressId, serviceLabProgressId, weeklyIncidentIndex } from './learningPaths'
import { decodeProgress, progressKey } from './progress'
import { decodePracticeProgress, practiceProgressKey, recordPracticeRun } from './practiceProgress'
import type { PracticeRun } from './practiceProgress'
import './index.css'
import './SitePolish.css'

function LearningPath() {
  const [chapter, setChapter] = React.useState<'architecture' | 'course' | 'incidents' | 'practical' | 'dashboard'>('architecture')
  const [practicalOrigin, setPracticalOrigin] = React.useState<'architecture' | 'course' | 'dashboard'>('architecture')
  const [incidentStart, setIncidentStart] = React.useState(0)
  const [weeklyChallenge, setWeeklyChallenge] = React.useState(false)
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
  const [savedPractice] = React.useState(() => {
    try {
      return { progress: decodePracticeProgress(window.localStorage.getItem(practiceProgressKey)), error: false }
    } catch (error) {
      console.warn('Could not load practice progress:', error)
      return { progress: {}, error: true }
    }
  })
  const [practiceProgress, setPracticeProgress] = React.useState(savedPractice.progress)
  const [practiceStorageError, setPracticeStorageError] = React.useState(savedPractice.error)
  React.useEffect(() => {
    if (storageError) return
    try {
      window.localStorage.setItem(progressKey, JSON.stringify([...passedLessons]))
    } catch (error) {
      console.warn('Could not save course progress:', error)
      setStorageError(true)
    }
  }, [passedLessons, storageError])
  React.useEffect(() => {
    if (practiceStorageError) return
    try {
      window.localStorage.setItem(practiceProgressKey, JSON.stringify(practiceProgress))
    } catch (error) {
      console.warn('Could not save practice progress:', error)
      setPracticeStorageError(true)
    }
  }, [practiceProgress, practiceStorageError])
  function navigate(next: 'architecture' | 'course' | 'incidents' | 'practical' | 'dashboard') {
    setChapter(next)
    window.scrollTo(0, 0)
  }
  function markPassed(id: string) {
    setPassedLessons(current => new Set(current).add(id))
  }
  function openPractical(origin: 'architecture' | 'course' | 'dashboard') {
    setPracticalOrigin(origin)
    navigate('practical')
  }
  function openTopic(id: string) {
    if (id === 'architecture') { navigate('architecture'); return }
    const index = courseLessonIds.indexOf(id)
    if (index < 0) throw new Error(`Unknown course topic: ${id}`)
    setLessonIndex(index)
    navigate('course')
  }
  function openIncidents(index: number, weekly: boolean) {
    setIncidentStart(index)
    setWeeklyChallenge(weekly)
    navigate('incidents')
  }
  function recordIncident(index: number, run: PracticeRun) {
    markPassed(incidentProgressId(index))
    setPracticeProgress(current => recordPracticeRun(current, index, run))
  }
  const page = chapter === 'architecture'
    ? <ClusterArchitecture onComplete={() => navigate('course')} onPractical={() => openPractical('architecture')} onDashboard={() => navigate('dashboard')} passed={passedLessons.has('architecture')} onPass={() => markPassed('architecture')} />
    : chapter === 'course'
      ? <KubernetesCourse index={lessonIndex} onIndexChange={setLessonIndex} passedLessons={passedLessons} onPass={markPassed} onArchitecture={() => navigate('architecture')} onComplete={() => openIncidents(0, false)} onSkip={() => openIncidents(0, false)} onPractical={() => openPractical('course')} onDashboard={() => navigate('dashboard')} onRelatedIncident={index => openIncidents(index, false)} />
      : chapter === 'practical'
        ? <PracticalLab onBack={() => navigate(practicalOrigin)} onVerified={() => markPassed(serviceLabProgressId)} />
        : chapter === 'dashboard'
          ? <LearningDashboard passed={passedLessons} practiceProgress={practiceProgress} lessonIds={['architecture', ...courseLessonIds]} incidentCount={incidentCount} weeklyIndex={weeklyIncidentIndex(new Date(), incidentCount)} onTopic={openTopic} onLab={() => openPractical('dashboard')} onIncident={index => openIncidents(index, true)} onBack={() => navigate('architecture')} />
          : <App initialIndex={incidentStart} initialGuided={!weeklyChallenge} onReturnToCourse={() => navigate('course')} onDashboard={() => navigate('dashboard')} onTopic={openTopic} onReviewed={recordIncident} />
  return <>{(storageError || practiceStorageError) && <p className="progress-storage-warning" role="alert">Some progress could not be saved or loaded in this browser. Affected records will only be kept for this session.</p>}{page}</>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><LearningPath /></React.StrictMode>,
)
