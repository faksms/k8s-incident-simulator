import { Box, Cloud, Globe, Network, Server } from 'lucide-react'

export type Exposure = 'ClusterIP' | 'NodePort' | 'LoadBalancer'

export const exposureDetails: Record<Exposure, string> = {
  ClusterIP: 'An in-cluster client uses DNS or the ClusterIP. The Service selects matching Ready Pods across nodes; external clients need another entry point.',
  NodePort: 'A reachable node accepts traffic on port 30080. With the default externalTrafficPolicy: Cluster, the Service data plane can forward it to a Ready Pod on a different node; firewalls and networking still matter.',
  LoadBalancer: 'A compatible provider or controller provisions the load balancer. Its address can be pending, private, or public depending on the environment, and may incur costs.',
}

export default function ServiceAccessDiagram({ exposure }: { exposure: Exposure }) {
  return <div className="svc-architecture" aria-label={`${exposure} Service architecture`}>
    {exposure !== 'ClusterIP' && <div className="svc-external">
      <div className="svc-external-client"><Globe size={18} aria-hidden="true"/><span><b>External client</b><small>{exposure === 'NodePort' ? 'Connect to a reachable node :30080' : 'Connect to the load balancer :80'}</small></span></div>
      {exposure === 'LoadBalancer' && <div className="svc-cloud"><Cloud size={19} aria-hidden="true"/><span><b>Provider load balancer</b><small>External address → Service backend</small></span></div>}
    </div>}
    <div className="svc-cluster">
      <div className="svc-cluster-title"><span>EXAMPLE KUBERNETES CLUSTER</span><span>namespace: default</span></div>
      {exposure === 'ClusterIP' && <div className="svc-internal-client"><Globe size={17} aria-hidden="true"/><span><b>In-cluster client</b><small>DNS: api.default.svc.cluster.local</small></span></div>}
      {exposure === 'NodePort' && <div className="svc-node-entries" aria-label="NodePort entry on each node">
        {[1, 2, 3].map(node => <div key={node}><b>Node {node} entry</b><span>:30080</span></div>)}
      </div>}
      {exposure === 'NodePort' && <div className="svc-entry-link">↓ Service forwarding</div>}
      <div className="svc-architecture-service"><Network size={20} aria-hidden="true"/><span><b>Service · api</b><small>ClusterIP 10.96.14.20 :80</small><small>selector: app=api AND tier=frontend</small></span></div>
      <div className="svc-branch" aria-hidden="true"><svg viewBox="0 0 600 50" preserveAspectRatio="none"><path d="M300 0 V18 H100 V50 M300 18 V50 M300 18 H500 V50"/><path className="svc-branch-motion" d="M300 0 V18 H100 V50 M300 18 V50 M300 18 H500 V50"/></svg></div>
      <div className="svc-replica-label"><b>ReplicaSet · api</b><span>maintains 3 Pod replicas · Service selects the Pods, not the ReplicaSet</span></div>
      <div className="svc-architecture-nodes">
        {[1, 2, 3].map(node => <div className="svc-architecture-node" key={node}>
          <div className="svc-node-title"><Server size={16} aria-hidden="true"/><b>Node {node}</b>{exposure === 'NodePort' && <span>NodePort :30080</span>}</div>
          <div className="svc-architecture-pod"><Box size={18} aria-hidden="true"/><div><b>Pod · api-{node}</b><small>Ready · app=api</small><small>tier=frontend · :8080</small></div></div>
        </div>)}
      </div>
      <div className="svc-architecture-legend"><span>━━ Service traffic to eligible Pods</span><span>▣ ReplicaSet ownership (not traffic)</span></div>
    </div>
    <p className="svc-architecture-note">{exposure === 'NodePort' ? 'The entry boxes correspond to the ports on the nodes below. A request enters through one reachable node, then may be forwarded to any of the three eligible Pods.' : exposure === 'LoadBalancer' ? 'The provider forwards traffic to the Service backends; the actual integration is provider-specific and may use node ports or route directly to Pods.' : 'The in-cluster client resolves the Service name, then connects to its virtual IP; each branch represents a possible backend, not a simultaneous request.'}</p>
  </div>
}
