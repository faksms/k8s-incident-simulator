export type ServiceField = 'identity' | 'type' | 'selector' | 'ports'

export const serviceManifestSections: { id: ServiceField; title: string; yaml: string; detail: string }[] = [
  {
    id: 'identity', title: 'API and identity',
    yaml: `apiVersion: v1
kind: Service
metadata:
  name: api`,
    detail: 'v1 is the core API and Service is the resource kind. The name identifies the Service and forms part of its DNS name; metadata labels would label the Service itself, not select Pods.',
  },
  {
    id: 'type', title: 'Exposure type',
    yaml: `spec:
  type: NodePort`,
    detail: 'NodePort provides a port on cluster nodes as well as a ClusterIP. A client needs a reachable node address and permitted network traffic. The type can be changed to suit the cluster and access requirements.',
  },
  {
    id: 'selector', title: 'Pod selector',
    yaml: `  selector:
    app: api
    tier: frontend`,
    detail: 'Both app=api AND tier=frontend must match Pod labels in the same namespace. Extra Pod labels are fine. Matching does not mean the application is Ready or reachable.',
  },
  {
    id: 'ports', title: 'Port mapping',
    yaml: `  ports:
    - name: http
      protocol: TCP
      port: 80
      targetPort: 8080
      nodePort: 30080`,
    detail: 'Clients use the Service port 80 or a reachable node on 30080. Traffic is forwarded to port 8080 on an eligible Pod. The app must actually listen there; declaring a port does not start a listener.',
  },
]

export const serviceExampleManifest = serviceManifestSections.map(section => section.yaml).join('\n')
