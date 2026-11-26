import React from 'react'
import ReactDOM from 'react-dom/client'
import App, { incidentCount } from './App'
import KubernetesCourse, { courseLessonIds, initialLessonIndex } from './KubernetesCourse'
import ClusterArchitecture from './ClusterArchitecture'
import PracticalLab from './PracticalLab'
import LearningDashboard from './LearningDashboard'
import { incidentProgressId, learningPaths, pathChapters, serviceLabProgressId, weeklyIncidentIndex } from './learningPaths'
import { decodeProgress, progressKey } from './progress'
import { decodePracticeProgress, practiceProgressKey, recordPracticeRun } from './practiceProgress'
import type { PracticeRun } from './practiceProgress'
import { parseRoute, routeHash } from './routes'
import type { ReturnRoute, Route } from './routes'
import './index.css'
import './SitePolish.css'

function LearningPath() {
  const [route, setRoute] = React.useState<Route>(() => parseRoute(window.location.hash, courseLessonIds, incidentCount))
  const lastLesson = React.useRef(courseLessonIds[initialLessonIndex])
  if (route.page === 'lesson') lastLesson.current = route.id
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
  React.useEffect(() => {
    const readLocation = () => setRoute(parseRoute(window.location.hash, courseLessonIds, incidentCount))
    window.addEventListener('popstate', readLocation)
    window.addEventListener('hashchange', readLocation)
    return () => { window.removeEventListener('popstate', readLocation); window.removeEventListener('hashchange', readLocation) }
  }, [])
  function navigate(next: Exclude<Route, { page: 'not-found' }>) {
    const hash = routeHash(next)
    if (window.location.hash !== hash) window.history.pushState(null, '', hash)
    setRoute(next)
    window.scrollTo(0, 0)
  }
  function markPassed(id: string) {
    setPassedLessons(current => new Set(current).add(id))
  }
  function openPractical(from: ReturnRoute) {
    navigate({ page: 'lab', from })
  }
  function openTopic(id: string, track?: string) {
    if (id === 'architecture') { navigate(track ? { page: 'architecture', track } : { page: 'architecture' }); return }
    const index = courseLessonIds.indexOf(id)
    if (index < 0) throw new Error(`Unknown course topic: ${id}`)
    navigate(track ? { page: 'lesson', id, track } : { page: 'lesson', id })
  }
  function openIncidents(index: number, weekly: boolean, from: ReturnRoute) {
    navigate({ page: 'incidents', index, guided: !weekly, from })
  }
  function recordIncident(index: number, run: PracticeRun) {
    markPassed(incidentProgressId(index))
    setPracticeProgress(current => recordPracticeRun(current, index, run))
  }
  const home: ReturnRoute = route.page === 'architecture' ? route : { page: 'architecture' }
  const dashboard: ReturnRoute = { page: 'dashboard' }
  const lesson: ReturnRoute = route.page === 'lesson' ? route : { page: 'lesson', id: lastLesson.current }
  const page = route.page === 'architecture'
    ? <ClusterArchitecture onComplete={() => {
        const path = learningPaths.find(item => item.id === route.track)
        const next = path && pathChapters(path).flatMap(chapter => chapter.topics).find(topic => topic.id !== 'architecture')
        if (next && path) openTopic(next.id, path.id)
        else openTopic(lastLesson.current)
      }} onPractical={() => openPractical(home)} onDashboard={() => navigate(dashboard)} passed={passedLessons.has('architecture')} onPass={() => markPassed('architecture')} trackName={learningPaths.find(path => path.id === route.track)?.title} />
    : route.page === 'lesson'
      ? <KubernetesCourse index={courseLessonIds.indexOf(route.id)} track={route.track} onIndexChange={(index, track) => openTopic(courseLessonIds[index], track)} passedLessons={passedLessons} onPass={markPassed} onArchitecture={track => openTopic('architecture', track)} onComplete={() => openIncidents(0, false, lesson)} onSkip={() => openIncidents(0, false, lesson)} onPractical={() => openPractical(lesson)} onDashboard={() => navigate(dashboard)} onRelatedIncident={index => openIncidents(index, false, lesson)} />
      : route.page === 'lab'
        ? <PracticalLab onBack={() => navigate(route.from)} onVerified={() => markPassed(serviceLabProgressId)} />
        : route.page === 'dashboard'
          ? <LearningDashboard passed={passedLessons} practiceProgress={practiceProgress} lessonIds={['architecture', ...courseLessonIds]} incidentCount={incidentCount} weeklyIndex={weeklyIncidentIndex(new Date(), incidentCount)} onTopic={openTopic} onLab={() => openPractical(dashboard)} onIncident={index => openIncidents(index, true, dashboard)} onBack={() => navigate(home)} />
          : route.page === 'incidents'
            ? <App initialIndex={route.index} initialGuided={route.guided} onScenarioChange={(index, guided) => navigate({ ...route, index, guided })} onReturnToCourse={() => route.from.page === 'lesson' ? navigate(route.from) : openTopic(lastLesson.current)} onDashboard={() => navigate(dashboard)} onTopic={openTopic} onReviewed={recordIncident} />
            : <main className="welcome"><section className="welcome-card"><h1>Page not found</h1><p>This link does not match a lesson or exercise.</p><button className="primary-button" onClick={() => navigate(home)}>Go to the start</button></section></main>
  return <>{(storageError || practiceStorageError) && <p className="progress-storage-warning" role="alert">Some progress could not be saved or loaded in this browser. Affected records will only be kept for this session.</p>}{page}</>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><LearningPath /></React.StrictMode>,
)
