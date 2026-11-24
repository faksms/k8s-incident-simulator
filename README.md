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
