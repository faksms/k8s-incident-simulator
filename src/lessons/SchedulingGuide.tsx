import { useEffect, useState } from 'react'
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion'
import { Box, RotateCcw, Server } from 'lucide-react'
import { evaluateScheduling, initialSchedulingSettings } from './schedulingModel'
import type { SchedulingSettings } from './schedulingModel'
import './SchedulingGuide.css'

const phases = ['Pod is waiting', 'Filter: check hard rules', 'Score: compare eligible nodes', 'Bind or remain Pending']

function PodCard({ reducedMotion }: { reducedMotion: boolean }) {
  return <motion.div className="sched-pod" layout={!reducedMotion} layoutId={reducedMotion ? undefined : 'scheduling-pod'} transition={{ duration: .8, ease: 'easeInOut' }}>
    <Box size={17} aria-hidden="true"/><span><b>checkout-pod</b><small>Example workload</small></span>
  </motion.div>
}

export default function SchedulingGuide() {
  const reducedMotion = Boolean(useReducedMotion())
  const [settings, setSettings] = useState(initialSchedulingSettings)
  const [phase, setPhase] = useState(0)
  const [playing, setPlaying] = useState(true)
  const { nodes, selected } = evaluateScheduling(settings)

  useEffect(() => {
    if (!playing || reducedMotion) return
    const timer = window.setInterval(() => setPhase(value => (value + 1) % phases.length), 2400)
    return () => window.clearInterval(timer)
  }, [playing, reducedMotion])

  function change(next: Partial<SchedulingSettings>) {
    setSettings(current => ({ ...current, ...next }))
    setPhase(0)
  }
  function reset() {
    setSettings(initialSchedulingSettings)
    setPhase(0)
    setPlaying(true)
  }

  return <section className="sched-guide" aria-labelledby="sched-guide-title">
    <header className="sched-guide-head">
      <div><p>VISUAL FIELD GUIDE · SCHEDULING</p><h2 id="sched-guide-title">How does a Pod find a node?</h2><span>Start with the moving example, then explore each scheduling rule below.</span></div>
      <button type="button" onClick={reset}><RotateCcw size={15}/> Reset</button>
    </header>
    <nav className="sched-jump" aria-label="Scheduling guide sections">
      {[
        ['schedule-animation', 'Animation'], ['schedule-resources', 'Resources'], ['schedule-selector', 'Node selector'],
        ['schedule-affinity', 'Node affinity'], ['schedule-taints', 'Taints & tolerations'],
        ['schedule-pods', 'Pod affinity'], ['schedule-spread', 'Topology spread'], ['schedule-debug', 'Troubleshooting'],
      ].map(([id, label]) => <button type="button" key={id} onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })}>{label}</button>)}
    </nav>

    <section className="sched-panel" id="schedule-animation" aria-labelledby="schedule-animation-title">
      <div className="sched-heading"><span>01 · INTERACTIVE ANIMATION</span><h3 id="schedule-animation-title">Filter, score, then bind</h3></div>
      <p>An unassigned Pod waits for a scheduler. The scheduler first removes nodes that fail any hard rule, then scores the remaining nodes and binds the Pod to a choice. Change the Pod's rules to watch the example repeat.</p>
      <div className="sched-controls">
        <fieldset><legend>CPU request</legend><div>{([1, 3] as const).map(value => <button type="button" key={value} aria-pressed={settings.cpu === value} onClick={() => change({ cpu: value })}>{value} CPU</button>)}</div></fieldset>
        <fieldset><legend>nodeSelector: disk</legend><div>{(['any', 'ssd', 'hdd'] as const).map(value => <button type="button" key={value} aria-pressed={settings.disk === value} onClick={() => change({ disk: value })}>{value === 'any' ? 'Any disk' : value}</button>)}</div></fieldset>
        <fieldset><legend>Required node affinity: zone</legend><div>{(['any', 'east', 'west'] as const).map(value => <button type="button" key={value} aria-pressed={settings.requiredZone === value} onClick={() => change({ requiredZone: value })}>{value === 'any' ? 'Any zone' : value}</button>)}</div></fieldset>
        <fieldset><legend>Preferred node affinity</legend><div><button type="button" aria-pressed={!settings.preferWest} onClick={() => change({ preferWest: false })}>No preference</button><button type="button" aria-pressed={settings.preferWest} onClick={() => change({ preferWest: true })}>Prefer west</button></div></fieldset>
        <fieldset><legend>GPU taint toleration</legend><div><button type="button" aria-pressed={!settings.tolerateGpu} onClick={() => change({ tolerateGpu: false })}>No toleration</button><button type="button" aria-pressed={settings.tolerateGpu} onClick={() => change({ tolerateGpu: true })}>Tolerate gpu</button></div></fieldset>
      </div>
      <div className="sched-player"><span>{reducedMotion ? 'Reduced motion · step manually' : playing ? 'REPEATING EXAMPLE' : 'PAUSED'} · {phases[phase]}</span><div><button type="button" disabled={reducedMotion} onClick={() => setPlaying(value => !value)}>{playing && !reducedMotion ? 'Pause' : 'Play'}</button><button type="button" onClick={() => { setPlaying(false); setPhase(value => (value + 1) % phases.length) }}>Next step</button><button type="button" onClick={() => setPhase(0)}>Replay</button></div></div>
      <LayoutGroup id="scheduler-guide">
        <div className="sched-diagram">
          <div className="sched-queue"><b>Pending Pod</b>{phase < 3 || !selected ? <PodCard reducedMotion={reducedMotion}/> : <div className="sched-empty">Bound to {selected.name}</div>}<small>Requests {settings.cpu} CPU</small></div>
          <div className="sched-scheduler"><b>kube-scheduler</b><span>{phases[phase]}</span><small>{phase === 0 ? 'Waits for an unassigned Pod' : phase === 1 ? 'Checks all hard requirements' : phase === 2 ? 'Ranks eligible nodes' : selected ? 'Binds the Pod to a node' : 'No eligible node; retry later'}</small></div>
          <div className="sched-nodes" aria-label="Example cluster nodes">{nodes.map(node => <div key={node.name} className={`sched-node ${phase >= 1 ? node.reasons.length ? 'sched-node-blocked' : 'sched-node-eligible' : ''}`}>
            <h4><Server size={16} aria-hidden="true"/> {node.name}</h4>
            <small>zone={node.zone} · disk={node.disk}</small><small>{node.availableCpu} CPU available for requests</small>
            <small>{node.gpuTaint ? 'Taint: dedicated=gpu:NoSchedule' : 'No example taint'}</small>
            {phase >= 1 && <div className="sched-node-result">{node.reasons.length ? <>NOT ELIGIBLE<ul>{node.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul></> : <>ELIGIBLE{phase >= 2 && <span> · preference score {node.score}</span>}</>}</div>}
            {phase === 3 && selected?.name === node.name && <PodCard reducedMotion={reducedMotion}/>}
          </div>)}</div>
        </div>
      </LayoutGroup>
      <div className="sched-outcome" role="status"><b>{phase < 3 ? phases[phase] : selected ? `Example choice: ${selected.name}` : 'No node fits: checkout-pod stays Pending'}</b><span>{phase < 3 ? 'Follow the checks and compare the nodes.' : selected ? 'The Pod passed every hard rule on this node.' : 'Change a hard rule or add capacity; a preference cannot make an ineligible node fit.'}</span></div>
      <p className="sched-note">Illustrative scheduler: available CPU is allocatable minus existing requests; only the displayed rules are modeled. Scores are simplified (west preference adds one point; ties use the displayed node order). Real scheduling considers additional filters, plugins, weights, resources, and cluster changes. Priority affects queue order and possible preemption, not whether hard placement rules can be ignored.</p>
    </section>

    <section className="sched-panel" id="schedule-resources" aria-labelledby="schedule-resources-title">
      <div className="sched-heading"><span>02 · CAPACITY</span><h3 id="schedule-resources-title">Resource requests: is there room?</h3></div>
      <p>The scheduler compares the Pod's requests with each node's allocatable resources minus existing requests, not the current CPU usage. CPU and memory are checked separately; limits govern runtime usage rather than replace requests.</p>
      <pre><code>{`spec:
  containers:
  - name: checkout
    image: nginx:1.27
    resources:
      requests:
        cpu: "1"
        memory: 256Mi`}</code></pre>
      <p className="sched-tip"><b>Try it:</b> Set the animation to 3 CPU. Every example node fails the capacity check, so the Pod stays Pending.</p>
    </section>

    <section className="sched-panel" id="schedule-selector" aria-labelledby="schedule-selector-title">
      <div className="sched-heading"><span>03 · NODE LABELS</span><h3 id="schedule-selector-title">nodeSelector: a simple hard match</h3></div>
      <p>Labels describe nodes. A Pod's <code>nodeSelector</code> requires every specified key and value to match; it does not add labels to nodes. For example, <code>disk: ssd</code> excludes nodes labeled <code>disk=hdd</code>.</p>
      <pre><code>{`spec:
  nodeSelector:
    disk: ssd`}</code></pre>
      <p className="sched-tip"><b>Try it:</b> Choose SSD in the animation. worker-north is filtered out because its disk label is HDD.</p>
    </section>

    <section className="sched-panel" id="schedule-affinity" aria-labelledby="schedule-affinity-title">
      <div className="sched-heading"><span>04 · NODE LABEL EXPRESSIONS</span><h3 id="schedule-affinity-title">Node affinity: required or preferred</h3></div>
      <p><b>Required</b> affinity is a hard filter; <b>preferred</b> affinity influences scoring among nodes that already passed filtering. With <code>requiredDuringSchedulingIgnoredDuringExecution</code>, a later label change does not by itself evict an already-running Pod. Required node selector terms are ORed; expressions within a term are ANDed. If both nodeSelector and required affinity are set, both must match.</p>
      <pre><code>{`spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: topology.kubernetes.io/zone
            operator: In
            values: [east]
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 1
        preference:
          matchExpressions:
          - key: topology.kubernetes.io/zone
            operator: In
            values: [east]`}</code></pre>
      <p className="sched-tip"><b>Try it:</b> Prefer west without a toleration: west still fails its taint check. Add the toleration to let the preference influence the example choice.</p>
    </section>

    <section className="sched-panel" id="schedule-taints" aria-labelledby="schedule-taints-title">
      <div className="sched-heading"><span>05 · NODE REPELLENTS</span><h3 id="schedule-taints-title">Taints and tolerations: permission, not selection</h3></div>
      <p>A taint is on a node; a toleration is on a Pod. A matching toleration permits consideration of the tainted node, but does not select or reserve it. <code>NoSchedule</code> blocks new placements without a match, <code>PreferNoSchedule</code> is a soft avoidance, and <code>NoExecute</code> can also evict existing Pods that do not tolerate it.</p>
      <pre><code>{`# Node taint: dedicated=gpu:NoSchedule
spec:
  tolerations:
  - key: dedicated
    operator: Equal
    value: gpu
    effect: NoSchedule`}</code></pre>
      <p className="sched-tip"><b>Try it:</b> Require west: the Pod remains Pending until it tolerates the example taint, provided its other requirements also fit.</p>
    </section>

    <section className="sched-panel" id="schedule-pods" aria-labelledby="schedule-pods-title">
      <div className="sched-heading"><span>06 · WORKLOAD RELATIONSHIPS</span><h3 id="schedule-pods-title">Pod affinity and anti-affinity</h3></div>
      <p>Pod affinity can place a Pod near matching Pods; Pod anti-affinity can keep it away from them. Both use a <code>topologyKey</code>, such as a node or zone label, and can be required or preferred. This example asks that a new checkout replica avoid nodes already hosting a matching checkout Pod.</p>
      <pre><code>{`spec:
  affinity:
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchLabels:
            app: checkout
        topologyKey: kubernetes.io/hostname`}</code></pre>
      <p className="sched-note">This separate rule is not simulated above. Pod affinity and anti-affinity depend on matching Pod labels, topology labels, namespaces, and the rest of the Pod's constraints.</p>
    </section>

    <section className="sched-panel" id="schedule-spread" aria-labelledby="schedule-spread-title">
      <div className="sched-heading"><span>07 · SPREAD REPLICAS</span><h3 id="schedule-spread-title">Topology spread constraints</h3></div>
      <p>Topology spread controls the distribution of matching Pods across topology domains, such as zones. <code>maxSkew</code> limits the allowed imbalance according to the constraint; <code>DoNotSchedule</code> is a hard restriction, while <code>ScheduleAnyway</code> is a preference.</p>
      <pre><code>{`spec:
  topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels:
        app: checkout`}</code></pre>
      <p className="sched-note">This separate rule is not simulated above. Spreading replicas does not create capacity, and eligible domains and other scheduling rules affect the result.</p>
    </section>

    <section className="sched-panel" id="schedule-debug" aria-labelledby="schedule-debug-title">
      <div className="sched-heading"><span>08 · INVESTIGATE</span><h3 id="schedule-debug-title">When a Pod stays Pending</h3></div>
      <p>Read the Pod's scheduling events, then inspect node labels, taints, and allocatable resources. A Pod can also be Pending after binding while waiting for an image or volume, so check whether <code>spec.nodeName</code> has been assigned and read the events.</p>
      <pre><code>{`kubectl get pod checkout-pod -o wide
kubectl describe pod checkout-pod
kubectl get nodes --show-labels
kubectl describe node worker-east
kubectl get events --sort-by=.lastTimestamp`}</code></pre>
      <p className="sched-note">Commands are illustrative; use your Pod, namespace, and node names. Directly setting <code>spec.nodeName</code> bypasses normal scheduler selection and is not the same as a nodeSelector. <a href="https://kubernetes.io/docs/concepts/scheduling-eviction/" target="_blank" rel="noreferrer">Kubernetes scheduling documentation</a>.</p>
    </section>
  </section>
}
