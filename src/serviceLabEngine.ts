export type LabState = { selectorFixed: boolean; verified: boolean }
export type LabResult = { state: LabState; output: string }

export const initialLabState: LabState = { selectorFixed: false, verified: false }

export function runLabCommand(state: LabState, input: string): LabResult {
  const command = input.trim().replace(/\s+/g, ' ')
  const unchanged = (output: string): LabResult => ({ state, output })
  switch (command) {
    case 'help':
      return unchanged([
        'Supported commands:',
        'kubectl get pods --show-labels',
        'kubectl get service frontend',
        'kubectl describe service frontend',
        'kubectl set selector service frontend app=web-frontend',
      ].join('\n'))
    case 'kubectl get pods --show-labels':
      return unchanged('NAME             READY   STATUS    RESTARTS   LABELS\nfrontend-668b    1/1     Running   0          app=web-frontend')
    case 'kubectl get service frontend':
      return unchanged('NAME       TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)\nfrontend   ClusterIP   10.96.0.10    <none>        80/TCP')
    case 'kubectl describe service frontend': {
      const output = `Name:              frontend\nType:              ClusterIP\nIP:                10.96.0.10\nPort:              80/TCP\nTargetPort:        8080/TCP\nSelector:          app=${state.selectorFixed ? 'web-frontend' : 'frontend'}\nEndpoints:         ${state.selectorFixed ? '10.244.1.5:8080' : '<none>'}`
      return { state: state.selectorFixed ? { ...state, verified: true } : state, output }
    }
    case 'kubectl set selector service frontend app=web-frontend':
      return { state: { selectorFixed: true, verified: false }, output: 'service/frontend selector updated\nInspect the Service again to verify its endpoints.' }
    default:
      return unchanged('Command not supported in this simulation. Type help to see the available commands.')
  }
}
