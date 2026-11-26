import { useState } from 'react'
import { ArrowDown, Box, Boxes, FileCode2, Network, Server, Workflow } from 'lucide-react'
import { deploymentManifestSections } from './deploymentManifest'
import type { DeploymentLayer } from './deploymentManifest'
import './DeploymentVisualGuide.css'

const layers: { id: DeploymentLayer; title: string; caption: string; icon: typeof Workflow }[] = [
  { id: 'deployment', title: 'Deployment', caption: 'manages rollout & history', icon: Workflow },
  { id: 'replicaset', title: 'ReplicaSet', caption: 'maintains Pod count', icon: Boxes },
  { id: 'pod', title: 'Pod template', caption: 'blueprint for each Pod', icon: Box },
  { id: 'container', title: 'Container', caption: 'runs the application image', icon: Server },
]

export default function DeploymentVisualGuide() {
  const [selectedId, setSelectedId] = useState(deploymentManifestSections[0].id)
  const [serviceMatches, setServiceMatches] = useState(true)
  const selected = deploymentManifestSections.find(section => section.id === selectedId)!

  function selectLayer(layer: DeploymentLayer) {
    const section = deploymentManifestSections.find(item => item.layer === layer)!
    setSelectedId(section.id)
  }

  return <section className="deployment-guide" aria-labelledby="deployment-guide-title">
    <header className="deployment-guide-header">
      <div><p>VISUAL FIELD GUIDE · DEPLOYMENTS</p><h2 id="deployment-guide-title">See what each YAML section controls</h2><span>Select a block of the manifest or a layer of the diagram. The highlight links the configuration to its role.</span></div>
      <FileCode2 size={26} aria-hidden="true"/>
    </header>
    <div className="deployment-blueprint">
      <section className="blueprint-code" aria-labelledby="blueprint-code-title">
        <div className="blueprint-label"><b id="blueprint-code-title">deployment.yaml</b><span>SELECT A SECTION</span></div>
        <div className="blueprint-code-sections">{deploymentManifestSections.map(section =>
          <button type="button" key={section.id} className={`blueprint-code-block ${selected.id===section.id?'selected':''}`} aria-pressed={selected.id===section.id} aria-label={`${section.title}: ${section.yaml.replace(/\n/g, ', ')}`} onClick={()=>setSelectedId(section.id)}><code>{section.yaml}</code></button>
        )}</div>
      </section>
      <div className="blueprint-explainer">
        <section className="blueprint-layers" aria-label="Deployment resource relationships">
          <div className="blueprint-label"><b>FROM DECLARATION TO APP</b><span>SELECT A LAYER</span></div>
          {layers.map((layer,index)=>{
            const Icon = layer.icon
            return <div key={layer.id} className="blueprint-layer-row">
              <button type="button" className={`blueprint-layer layer-${layer.id} ${selected.layer===layer.id?'selected':''}`} aria-pressed={selected.layer===layer.id} onClick={()=>selectLayer(layer.id)}>
                <Icon size={20} aria-hidden="true"/><span><b>{layer.title}</b><small>{layer.caption}</small></span><i aria-hidden="true"/>
              </button>
              {index<layers.length-1&&<div className="blueprint-connector" aria-hidden="true"><ArrowDown size={15}/></div>}
            </div>
          })}
          <p>One Deployment describes one Pod template; its ReplicaSet creates multiple Pods from that template. During an update, old and new ReplicaSets can coexist. An unmanaged Pod does not gain replica management or rollout history by itself.</p>
        </section>
        <div className="blueprint-detail" role="status" aria-live="polite"><small>SELECTED · {selected.layer.toUpperCase()}</small><h3>{selected.title}</h3><p>{selected.detail}</p></div>
      </div>
    </div>
    <section className="deployment-service" aria-labelledby="deployment-service-title">
      <header><div><p>CONNECT THE APP</p><h3 id="deployment-service-title">A Service finds Pods by label</h3></div><Network size={22} aria-hidden="true"/></header>
      <div className="service-visual">
        <div className="service-visual-node service-client"><b>Client</b><small>inside the cluster</small></div>
        <span className="service-visual-link connected" aria-hidden="true"><i/></span>
        <div className="service-visual-node service-resource"><b>Service · web</b><small>selector: app={serviceMatches?'web':'other'}</small><small>port 80 → targetPort 80</small></div>
        <span className={`service-visual-link ${serviceMatches?'connected':''}`} aria-hidden="true"><i/></span>
        <div className="service-visual-node service-backends"><b>Ready Pods</b><small>label: app=web</small><span className="service-pod-icons" aria-hidden="true"><Box size={17}/><Box size={17}/><Box size={17}/></span></div>
      </div>
      <div className="service-result"><button type="button" onClick={()=>setServiceMatches(value=>!value)}>{serviceMatches?'Try a mismatched selector':'Restore matching selector'}</button><p role="status" aria-live="polite">{serviceMatches?'3 matching Ready endpoints: the Service can route to the web Pods in this example.':'0 matching endpoints: the Service cannot route to these Pods until the selector matches.'}</p></div>
      <p className="service-caveat">This example assumes all three Pods are Ready and listen on port 80. The default ClusterIP Service is reachable inside the cluster; external access requires a suitable entry point, such as a NodePort with a reachable node and firewall rules.</p>
    </section>
  </section>
}
