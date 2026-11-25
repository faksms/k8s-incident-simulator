# SRE Night Shift

A cyberpunk browser-based Kubernetes incident-response simulator built with React, TypeScript, Vite, Tailwind CSS, and Framer Motion.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Build and preview with `npm run build` and `npm run preview`.

## Play

Pick a difficulty, investigate the alert using cluster topology, logs, metrics, and events, diagnose its root cause, and apply the displayed remediation in the simulated `kubectl` terminal. Keep availability at or above 95% and resolve incidents in under ten minutes. All cluster commands are simulated; no real cluster or credentials are used.

Includes 13 scenarios: OOMKilled, ImagePullBackOff, DNS failure, node memory and disk pressure, readiness/liveness probe failures, unreachable service, bad ingress, maxed HPA, expired TLS, stuck rollout, and Helm upgrade failure.

## Icon attribution

Architecture icons are from the [Kubernetes Icons Set](https://github.com/kubernetes/community/tree/a620d469b204a55912856084eae1f92a299b4852/icons), used under the Apache License 2.0. The [license text](public/licenses/kubernetes-icons-APACHE-2.0.txt) is included in the published build. Kubernetes trademarks are subject to the upstream project's trademark guidelines.
