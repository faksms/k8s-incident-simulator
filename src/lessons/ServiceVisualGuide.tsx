import { useState } from 'react'
import { Box, FileCode2, Globe, Network, RotateCcw } from 'lucide-react'
import { serviceManifestSections } from './serviceManifest'
import type { ServiceField } from './serviceManifest'
import ServiceAccessDiagram, { exposureDetails } from './ServiceAccessDiagram'
import type { Exposure } from './ServiceAccessDiagram'
import './ServiceVisualGuide.css'

export default function ServiceVisualGuide() {
  const [field, setField] = useState<ServiceField>('identity')
  const [tierMatches, setTierMatches] = useState(true)
  const [ready, setReady] = useState(true)
  const [generation, setGeneration] = useState(0)
  const [exposure, setExposure] = useState<Exposure>('NodePort')
  const selected = serviceManifestSections.find(section => section.id === field)!
  const eligible = tierMatches && ready

  function reset() {
    setField('identity')
    setTierMatches(true)
    setReady(true)
    setGeneration(0)
    setExposure('NodePort')
  }

  return <section className="svc-guide" aria-labelledby="svc-guide-title">
    <header className="svc-guide-header">
      <div><p>VISUAL FIELD GUIDE · SERVICES</p><h2 id="svc-guide-title">A stable front door for changing Pods</h2><span>Follow discovery and traffic, experiment with labels and readiness, then connect the YAML to each part of the picture.</span></div>
      <button type="button" onClick={reset}><RotateCcw size={15}/> Reset guide</button>
    </header>

    <section className="svc-panel" aria-labelledby="svc-discovery-title">
      <div className="svc-panel-title"><div><p>01 · DISCOVERY &amp; ENDPOINTS</p><h3 id="svc-discovery-title">One address, changing backends</h3></div><Network aria-hidden="true"/></div>
      <div className="svc-path" aria-label="Client discovery and Service traffic">
        <div className="svc-node svc-client-node"><Globe size={19}/><b>Client &amp; DNS</b><small>api.default.svc.cluster.local → 10.96.14.20</small></div>
        <span className="svc-arrow active" aria-hidden="true"><i/></span>
        <div className="svc-node svc-front"><Network size={19}/><b>Service · api</b><small>10.96.14.20 :80</small><small>app=api AND tier=frontend</small></div>
        <span className={`svc-arrow ${eligible ? 'active' : ''}`} aria-hidden="true"><i/></span>
        <div className={`svc-node svc-pod ${eligible ? '' : 'unavailable'}`}><Box size={19}/><b>Pod · api-{generation + 1}</b><small>10.42.0.{generation % 2 === 0 ? '11' : '24'} :8080</small><small>app=api · tier={tierMatches ? 'frontend' : 'worker'} · team=blue</small><small>{ready ? 'Ready' : 'Not Ready'} · {eligible ? 'receives normal traffic' : 'not eligible for normal traffic'}</small></div>
      </div>
      <div className="svc-endpoints" role="status" aria-live="polite"><b>EndpointSlice · discovery data, not a hop</b><span>{!tierMatches ? 'No selected Pod in this example: tier does not match.' : `${generation % 2 === 0 ? '10.42.0.11' : '10.42.0.24'}:8080 · ready: ${ready ? 'true' : 'false'}. ${ready ? 'Eligible for normal Service traffic.' : 'Not normally used for Service traffic.'}`}</span></div>
      <div className="svc-controls">
        <button type="button" onClick={() => setGeneration(value => value + 1)}>Replace Pod</button>
        <button type="button" aria-pressed={tierMatches} onClick={() => setTierMatches(value => !value)}>{tierMatches ? 'Change tier label' : 'Restore tier label'}</button>
        <button type="button" aria-pressed={ready} onClick={() => setReady(value => !value)}>{ready ? 'Mark Pod not Ready' : 'Mark Pod Ready'}</button>
      </div>
      <p className="svc-note">Illustrative single-Pod, default-namespace example: replacing a Pod changes its identity and example IP, not this Service’s address. The Service exists independently of a Deployment; a controller can replace Pods. EndpointSlices record endpoint addresses and conditions for the data plane; they are not in the packet path. Extra labels do not prevent a match. Readiness is manually controlled here.</p>
    </section>

    <section className="svc-panel" aria-labelledby="svc-blueprint-title">
      <div className="svc-panel-title"><div><p>02 · CONFIGURATION</p><h3 id="svc-blueprint-title">Which YAML field controls what?</h3></div><FileCode2 aria-hidden="true"/></div>
      <div className="svc-blueprint">
        <div className="svc-code"><div className="svc-code-heading">service.yaml · SELECT A SECTION</div>{serviceManifestSections.map(section => <button type="button" key={section.id} className={field === section.id ? 'selected' : ''} aria-pressed={field === section.id} aria-label={`${section.title}: ${section.yaml.replace(/\n/g, ', ')}`} onClick={() => setField(section.id)}><code>{section.yaml}</code></button>)}</div>
        <div className="svc-field-map">
          {serviceManifestSections.map(section => <button type="button" key={section.id} className={`svc-field svc-field-${section.id} ${field === section.id ? 'selected' : ''}`} aria-pressed={field === section.id} onClick={() => setField(section.id)}><b>{section.title}</b><span>{section.id === 'identity' ? 'Service name & DNS' : section.id === 'type' ? 'How clients enter' : section.id === 'selector' ? 'Which Pod labels match' : 'Node :30080 → Service :80 → Pod :8080'}</span></button>)}
          <div className="svc-detail" role="status" aria-live="polite"><b>{selected.title}</b><p>{selected.detail}</p></div>
        </div>
      </div>
      <p className="svc-note">The manifest describes a NodePort Service; the example Pod above represents an application listening on TCP 8080 with both selector labels. IP addresses are illustrative. Selecting a field explains it; it does not edit the manifest.</p>
    </section>

    <section className="svc-panel" aria-labelledby="svc-types-title">
      <div className="svc-panel-title"><div><p>03 · ACCESS PATHS</p><h3 id="svc-types-title">Choose how clients reach the app</h3></div><Globe aria-hidden="true"/></div>
      <div className="svc-types" aria-label="Service exposure types">{(Object.keys(exposureDetails) as Exposure[]).map(type => <button type="button" key={type} aria-pressed={exposure === type} onClick={() => setExposure(type)}>{type}</button>)}</div>
      <ServiceAccessDiagram exposure={exposure}/>
      <p className="svc-type-description" role="status" aria-live="polite"><b>{exposure}:</b> {exposureDetails[exposure]}</p>
      <p className="svc-note">These are alternative simplified examples, not changes to the YAML above. Cluster DNS normally resolves a Service name to its ClusterIP; short names depend on the caller’s namespace and DNS search configuration. Service environment variables reflect Services available when the Pod starts and can become stale. A Service alone does not guarantee application availability or equal request distribution.</p>
    </section>
  </section>
}
