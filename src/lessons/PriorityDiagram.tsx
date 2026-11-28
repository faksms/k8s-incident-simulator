import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { Box, Server } from 'lucide-react'
import { preemptionOutcome, priorityQueue, resolvedPriority } from './priorityModel'
import type { PriorityModule, PrioritySettings } from './priorityModel'

type Props = { module: PriorityModule; settings: PrioritySettings; tick: number; playing: boolean; reducedMotion: boolean }
type Pod = { name: string; value: number | null }

function MovingPod({ pod, id, reducedMotion, status }: { pod: Pod; id: string; reducedMotion: boolean; status?: string }) {
  const tone = pod.value === null ? 'unresolved' : pod.value >= 1000 ? 'critical' : pod.value >= 500 ? 'standard' : 'batch'
  return <motion.div layout={!reducedMotion} layoutId={reducedMotion ? undefined : id} transition={{ duration: .65, ease: 'easeInOut' }} className={`priority-diagram-pod tone-${tone} ${status === 'Terminating' ? 'is-terminating' : ''}`}>
    <Box size={16} aria-hidden="true"/><span><b>{pod.name}</b><small>{pod.value === null ? 'Priority not yet resolved' : `Priority ${pod.value}`}{status ? ` · ${status}` : ''}</small></span>
  </motion.div>
}

export default function PriorityDiagram({ module, settings, tick, playing, reducedMotion }: Props) {
  const queue = priorityQueue(settings.tier)
  const incoming = queue.find(pod => pod.id === 'incoming')!
  const existing = queue.find(pod => pod.id === 'existing')!
  const victim = queue.find(pod => pod.id === 'victim')!
  const outcome = preemptionOutcome(settings)
  const resolved = resolvedPriority(settings)
  const terminating = outcome === 'preempt' && tick >= 3 && tick < 6
  const scheduled = outcome === 'preempt' && tick >= 6
  const queued = tick >= 2
  const considered = tick >= 6
  const queueItems = (queued ? queue : queue.filter(pod => pod.id !== 'incoming')).filter((_, index) => !considered || index !== 0)
  const queueHead = considered ? queue[0] : null

  return <LayoutGroup id="priority-diagram">
    <div className={`priority-stage priority-diagram ${playing && !reducedMotion ? 'priority-playing' : ''}`}>
      {module === 'queue' && <>
        <div className="priority-stage-head"><b>Priority scheduling queue</b><span>{!queued ? 'A Pod arrives' : !considered ? 'Higher priority moves to the front' : 'Scheduler considers the head'}</span></div>
        <div className="priority-diagram-grid priority-queue-grid">
          <div className="priority-zone"><h3>Incoming Pod</h3><div className="priority-zone-body">{!queued && <MovingPod pod={incoming} id="queue-incoming" reducedMotion={reducedMotion}/>}</div><small>A new Pending Pod</small></div>
          <div className="priority-zone priority-queue-zone"><h3>Pending queue</h3><div className="priority-zone-body priority-stack">{queueItems.map((pod, index) => <div className="priority-queue-slot" key={pod.id}><span>#{index + 1}</span><MovingPod pod={pod} id={`queue-${pod.id}`} reducedMotion={reducedMotion}/></div>)}</div><small>Ordered by priority</small></div>
          <div className="priority-zone"><h3>Next to consider</h3><div className="priority-zone-body">{queueHead ? <MovingPod pod={queueHead} id={`queue-${queueHead.id}`} reducedMotion={reducedMotion} status="Being considered"/> : <div className="priority-placeholder">Waiting for queue head</div>}</div><small>Placement checks follow</small></div>
        </div>
        <p>After sorting, <b>{queue[0].name} ({queue[0].value})</b> is considered first in this example. Equal-priority ordering and scheduling retries are simplified.</p>
      </>}
      {module === 'preemption' && <>
        <div className="priority-stage-head"><b>Preemption on a full node</b><span>{outcome !== 'preempt' ? 'Pending · no preemption' : tick < 2 ? 'Pending Pod arrives' : tick < 3 ? 'Scheduler evaluates the node' : terminating ? 'Victim is terminating' : 'Pod scheduled in this example'}</span></div>
        <div className="priority-diagram-grid priority-preempt-grid">
          <div className="priority-zone"><h3>Pending Pod</h3><small>Policy: {settings.policy}</small><div className="priority-zone-body">{!scheduled ? <MovingPod pod={incoming} id="preempt-incoming" reducedMotion={reducedMotion} status="Pending"/> : <div className="priority-placeholder">Pod moved to worker-1</div>}</div>{outcome === 'preempt' && tick >= 2 && !scheduled && <small className="priority-nomination">Example nomination: worker-1</small>}</div>
          <div className={`priority-zone priority-node-zone ${outcome !== 'preempt' && tick >= 2 ? 'priority-blocked' : ''}`}><h3><Server size={15} aria-hidden="true"/> worker-1 · 2 / 2 CPU</h3><small>One CPU requested per Pod</small><div className="priority-zone-body priority-stack"><MovingPod pod={existing} id="resident-standard" reducedMotion={reducedMotion}/><AnimatePresence initial={false}>{!scheduled && <motion.div key="victim" exit={reducedMotion ? undefined : { opacity: 0, y: 28 }} transition={{duration:.45}}><MovingPod pod={victim} id="resident-batch" reducedMotion={reducedMotion} status={terminating ? 'Terminating' : 'Running'}/></motion.div>}</AnimatePresence>{scheduled && <MovingPod pod={incoming} id="preempt-incoming" reducedMotion={reducedMotion} status="Scheduled"/>}</div>{terminating && <div className="priority-grace"><span>Grace period · {6 - tick}s remaining</span><div><i style={{width: `${(6 - tick) / 3 * 100}%`}}/></div></div>}</div>
        </div>
        <p>{outcome === 'never' ? 'Never prevents this incoming Pod from preempting other Pods. It must wait for a suitable node.' : outcome === 'priority' ? 'The incoming Pod is not higher priority than the running Pods, so it cannot preempt them.' : tick < 3 ? `The scheduler may nominate this node and select the lower-priority ${victim.name} as a victim.` : terminating ? 'The victim gets a simplified 3-second graceful termination period; the incoming Pod waits.' : 'After the victim exits, this example places the incoming Pod. Real scheduling can still change.'}</p>
        <p className="priority-pdb">{settings.pdb ? 'PDB violation: the scheduler tries to avoid it, but a PDB is best effort during preemption. When preemption is allowed and no suitable alternative exists, it may still preempt a lower-priority victim.' : 'PDB: this example assumes the victim can be removed without violating a budget. A PDB is not a hard guarantee against scheduler preemption.'}</p>
      </>}
      {module === 'inheritance' && <>
        <div className="priority-stage-head"><b>Priority inheritance</b><span>{tick < 3 ? 'Deployment creates a Pod from its template' : tick < 6 ? 'Admission resolves the Pod priority' : 'New Pods receive their priority'}</span></div>
        <div className="priority-diagram-grid priority-inherit-grid">
          <div className="priority-zone"><h3>Pod template &amp; defaults</h3><div className={`priority-source ${settings.explicit ? 'source-active' : ''}`}><b>Deployment template</b><small>priorityClassName: {settings.explicit ? 'critical' : '(omitted)'}</small>{tick < 3 && <MovingPod pod={{name:'web-1',value:null}} id="inherit-pod" reducedMotion={reducedMotion}/>}</div><div className={`priority-source ${!settings.explicit ? 'source-active' : ''}`}><b>Cluster default</b><small>{settings.globalDefault ? 'standard-default · 100' : 'No default · priority 0'}</small></div></div>
          <div className="priority-zone"><h3>Priority admission</h3><div className="priority-zone-body">{tick >= 3 && tick < 6 ? <MovingPod pod={{name:'web-1',value:resolved.value}} id="inherit-pod" reducedMotion={reducedMotion} status="Resolved"/> : <div className="priority-placeholder">Resolve the class</div>}</div><small>{settings.explicit ? 'Explicit class' : settings.globalDefault ? 'Global default' : 'Fallback to 0'}</small></div>
          <div className="priority-zone"><h3>Created Pods</h3><div className="priority-zone-body priority-stack">{tick >= 6 ? <><MovingPod pod={{name:'web-1',value:resolved.value}} id="inherit-pod" reducedMotion={reducedMotion}/>{[2, 3].map((replica, index) => tick >= 7 + index && <motion.div key={replica} initial={reducedMotion ? false : { opacity: 0, y: -12, scale: .9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .45 }}><MovingPod pod={{name:`web-${replica}`,value:resolved.value}} id={`inherit-replica-${replica}`} reducedMotion={reducedMotion}/></motion.div>)}</> : <div className="priority-placeholder">Awaiting admission</div>}</div><small>Each Pod resolves priority at admission</small></div>
        </div>
        <p>{settings.explicit ? 'Each Pod inherits the class name from the template; admission resolves it to a priority. The explicit class takes precedence over any global default.' : settings.globalDefault ? 'The template omits a class name, so admission applies the configured global default to each new Pod.' : 'The template omits a class name and there is no global default, so each new Pod receives priority 0.'} This rollout assumes the same settings for each Pod. Existing Pods are not retroactively changed by changing a default.</p>
      </>}
    </div>
  </LayoutGroup>
}
