export type DeploymentLayer = 'deployment' | 'replicaset' | 'pod' | 'container'

export type ManifestSection = {
  id: string
  title: string
  layer: DeploymentLayer
  yaml: string
  detail: string
}

export const deploymentManifestSections: ManifestSection[] = [
  {
    id: 'identity', title: 'API and identity', layer: 'deployment',
    yaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  labels:
    app: web`,
    detail: 'apps/v1 identifies the workload API; kind chooses a Deployment. metadata names and labels the Deployment object itself. These labels are separate from the Pod template labels.',
  },
  {
    id: 'replicas', title: 'Replica target', layer: 'replicaset',
    yaml: `spec:
  replicas: 3`,
    detail: 'spec.replicas is the desired number of Pods, not a guarantee of readiness. The Deployment sets replica targets on its ReplicaSets, which create or remove Pods.',
  },
  {
    id: 'selector', title: 'Selector', layer: 'replicaset',
    yaml: `  selector:
    matchLabels:
      app: web`,
    detail: 'The selector must match the Pod template labels below. It identifies the Pods this Deployment manages; a Deployment selector is immutable after creation. ReplicaSets also use a generated pod-template-hash to distinguish revisions.',
  },
  {
    id: 'policy', title: 'Rollout policy', layer: 'deployment',
    yaml: `  revisionHistoryLimit: 5
  progressDeadlineSeconds: 300
  minReadySeconds: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0`,
    detail: 'Keep up to five old ReplicaSets for rollback after cleanup. A stalled rollout exceeding the progress deadline is reported as failed to progress; Kubernetes does not automatically roll back. A Pod must stay Ready for 10 seconds to count as available. With three desired replicas, maxSurge: 1 permits one extra Pod and maxUnavailable: 0 aims to keep three available during an update.',
  },
  {
    id: 'labels', title: 'Pod template labels', layer: 'pod',
    yaml: `  template:
    metadata:
      labels:
        app: web`,
    detail: 'spec.template is the blueprint for each Pod. Its app: web label matches the Deployment selector; a Service can also select this label. Changing the Pod template triggers a rollout.',
  },
  {
    id: 'container', title: 'Container blueprint', layer: 'container',
    yaml: `    spec:
      containers:
        - name: web
          image: nginx:1.27
          ports:
            - containerPort: 80`,
    detail: 'This Pod template runs one container from nginx:1.27 and documents its container port. containerPort alone neither opens a firewall nor creates a Service. Changing the image in this template triggers a rollout.',
  },
]

export const deploymentExampleManifest = deploymentManifestSections.map(section => section.yaml).join('\n')
