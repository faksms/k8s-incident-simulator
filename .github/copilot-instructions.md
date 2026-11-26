# Copilot instructions for SRE Night Shift

## Project conventions

- This is a React 18, TypeScript, Vite, Tailwind, and Framer Motion learning app. Follow the existing component, CSS, and test patterns; do not add dependencies for routine UI or animation work.
- Before changing a lesson, inspect its component, related styles and tests, and a nearby example with similar behavior. Reuse shared pieces such as `LessonCoach` and `StepSequenceControls` where they fit.
- Keep each lesson simulation specific to the Kubernetes concept it teaches. Prefer a meaningful learner action that changes modeled state and explains the result over static status cards or toggles that do not affect the example.
- Do not impose one visual layout or animation technique on every topic. Use SVG paths and moving packets for concepts that genuinely describe a flow; use stateful diagrams, controls, timelines, or other existing patterns when they teach the concept better. Match the surrounding lesson rather than adding a separate HUD, recording mode, or palette by default.

## PDF-based lessons

- When adapting a topic from a user-provided PDF, review the entire relevant section, including its diagrams, and cover its important high-level concepts rather than only the text or a few examples.
- Turn useful source illustrations into original, colorful, live animated and interactive explanations suited to the topic. For example, show resource relationships and let learners change a scenario to see the resulting state, rather than copying a static picture.
- When the source includes YAML or configuration, provide an interactive breakdown that links meaningful fields to the resources or behavior they control. Keep the example and its explanation consistent, and label simplifications.

## Interactive simulations

- Make controls functional and observable: learner actions should update the modeled resources, relationships, outcomes, or event explanation. Include a clear way to replay or reset multi-step interactions when appropriate.
- Represent healthy and failure states accurately for the concept. Use realistic Kubernetes terminology and commands where useful, but label simplified assumptions and do not present illustrative behavior as a real cluster operation.
- Make the current step and outcome understandable without relying on motion or color alone. Use the existing `LessonCoach` for a guided goal when appropriate; derive its `complete` state from the learner's actual interaction instead of inventing a callback or reporting success immediately.
- Use semantic buttons and controls, expose selected/pressed state where applicable, provide accessible status text, and keep keyboard interaction usable.
- Respect `useReducedMotion()` for automatic or ambient movement, following nearby examples. User-triggered state changes and explanations must remain usable when reduced motion is enabled.
- Keep animation state synchronized with the simulation state. Clean up timers and subscriptions, avoid stale updates, and prevent overlapping sequences when the learner changes or resets the scenario.

## Changes and verification

- Keep changes focused. Preserve existing lesson navigation, selection behavior, styling conventions, and progress tracking.
- Add or update focused tests for new or changed simulation behavior, following the colocated Vitest tests. Test meaningful state transitions and failure/reset cases rather than implementation details.
- Run the narrowest relevant tests, then `npm run build` for TypeScript and production-build validation when changing application code. Do not claim a simulation is interactive unless its controls and resulting states have been verified.
