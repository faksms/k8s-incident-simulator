# SRE Night Shift

A browser-based interactive Kubernetes learning path and incident-response simulator built with React, TypeScript, Vite, Tailwind CSS, and Framer Motion.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Build and preview with `npm run build` and `npm run preview`.

## Learn and practice

Start with the architecture map, then explore the foundation topics using their simulations, notes, and knowledge checks. Select a topic to revisit it or continue to guided or independent incident practice. Passed checks are retained while the page remains open, but are reset on reload. From the incident welcome screen, you can return to the lessons.

Open **Explore the topic index** on any course lesson to search concepts and jump between topics. The learning path includes original walkthroughs covering cluster setup, namespaces, service discovery, storage, configuration, StatefulSets, the API, RBAC, security, and terminology alongside the existing simulations. These lessons cover topics also found in Nigel Poulton's *The Kubernetes Book*, without reproducing the book. Consult the [Kubernetes documentation](https://kubernetes.io/docs/) for current, version-specific guidance.

Concept-map signals and illustrative paths loop automatically. Use their pause and step controls to inspect them; concept-map signals do not change workload settings. Automatic playback is disabled when the operating system requests reduced motion.

In incident practice, investigate simulated evidence, diagnose the cause, and choose a recovery action. Guided mode includes prompts; in independent mode, use **Reveal hint** when needed. All cluster commands are simulated; no real cluster or credentials are used.

Includes 13 scenarios: OOMKilled, ImagePullBackOff, DNS failure, node memory and disk pressure, readiness/liveness probe failures, unreachable service, bad ingress, maxed HPA, expired TLS, stuck rollout, and Helm upgrade failure.

## Icon attribution

Architecture icons are from the [Kubernetes Icons Set](https://github.com/kubernetes/community/tree/a620d469b204a55912856084eae1f92a299b4852/icons), used under the Apache License 2.0. The [license text](public/licenses/kubernetes-icons-APACHE-2.0.txt) is included in the published build. Kubernetes trademarks are subject to the upstream project's trademark guidelines.
