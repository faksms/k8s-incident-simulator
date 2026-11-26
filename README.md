# SRE Night Shift

A browser-based interactive Kubernetes learning path and incident-response simulator built with React, TypeScript, Vite, Tailwind CSS, and Framer Motion.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Build and preview with `npm run build` and `npm run preview`.

## Learn and practice

Start with the architecture map, then explore the foundation topics using their simulations, notes, and knowledge checks. Select a topic to revisit it or continue to guided or independent incident practice. Passed checks are saved in this browser's local storage when available; they do not sync across devices and can be removed by clearing site data. From the incident welcome screen, you can return to the lessons.

Choose **Explore learning paths** for beginner, operator, incident-response, and CKA topic-explorer paths grouped into chapters, with career context and chapter progress. The dashboard shows passed checks, reviewed incidents, and the verified terminal exercise. It also tracks completed incident runs, guided runs, runs where an independent hint was revealed, and incorrect diagnosis submissions; unfinished runs are not counted. Paths recommend the first unchecked topic in chapter order, and Next/Previous follow the selected path. Choosing a topic outside that path switches back to the full topic index. These records show activity, not certification or proof of mastery. The weekly challenge rotates through the existing incident library each Monday (UTC), and can be replayed without deadlines or streaks.

Pages and lessons use bookmarkable hash URLs, which work on static hosting without server-side routing. Browser Back and Forward navigate between pages, lessons, incident scenarios, and practice modes. Incident investigation steps and lab changes are temporary; reloading a link starts that exercise again.

Open **Explore the topic index** on any course lesson to browse chapters and nested subtopics or search concepts. Next and previous follow that chapter order. The learning path includes original walkthroughs covering cluster setup, namespaces, service discovery, storage, configuration, StatefulSets, the API, RBAC, security, and terminology alongside the existing simulations. The DNS and storage labs model specific examples, not real infrastructure; their assumptions are shown in the lesson. These lessons cover topics also found in Nigel Poulton's *The Kubernetes Book*, without reproducing the book. Consult the [Kubernetes documentation](https://kubernetes.io/docs/) for current, version-specific guidance.

The CKA topic explorer adds introductory walkthroughs on kubeadm, cluster maintenance and interfaces, Helm and Kustomize, operators, scheduling, autoscaling, rollouts, Service exposure, NetworkPolicy, Gateway API, provisioning, and troubleshooting. Related topics remain in the full index. These are illustrative lessons, not complete exam preparation: the CKA is performance-based, and the terminal here supports only a limited simulated exercise. Consult the [official CKA domains and competencies](https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/) and current version-specific documentation; use real-cluster practice separately when possible.

Each topic includes an interactive example tailored to its concept. Change settings and compare outcomes, including in the DNS, storage, RBAC, scheduling, and rollout labs. The Pod lesson keeps its containers, shared resources, and controls together. These examples are simplified and do not change a real cluster. Automatic animation is disabled when the operating system requests reduced motion.

In incident practice, investigate simulated evidence, diagnose the cause, and review a recovery action. Guided mode includes prompts; independent mode hides the incident title and detailed summary until diagnosis, and offers **Reveal hint**. The first incident models a recovery and verification; the others review an action without applying or verifying it. Related lessons link to incidents where available. All cluster commands are simulated; no real cluster or credentials are used.

Includes 13 scenarios: OOMKilled, ImagePullBackOff, DNS failure, node memory and disk pressure, readiness/liveness probe failures, unreachable service, bad ingress, maxed HPA, expired TLS, stuck rollout, and Helm upgrade failure.

The simulated terminal lab is available from the architecture introduction and the Services lesson. Type `help` to see the supported commands, investigate the Service selector, correct it, and inspect the Service again to verify its endpoint. This is a fixed browser-only exercise, not a real cluster or a general-purpose terminal; lab state resets when you leave or reset it.

## Icon attribution

Architecture icons are from the [Kubernetes Icons Set](https://github.com/kubernetes/community/tree/a620d469b204a55912856084eae1f92a299b4852/icons), used under the Apache License 2.0. The [license text](public/licenses/kubernetes-icons-APACHE-2.0.txt) is included in the published build. Kubernetes trademarks are subject to the upstream project's trademark guidelines.
