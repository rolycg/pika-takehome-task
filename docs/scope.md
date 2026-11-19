# Scope

## Required (Part 1: local Create Image app)
- **Apps page:** exactly one card, Create Image.
- **Side nav:** Apps, Projects, Library, Jobs, Discover. Every tab except Apps shows an empty page.
- **Create Image composer:** prompt; aspect ratio `1:1 | 16:9 | 9:16`; style `Photorealistic | Illustration | Cinematic`. Example prompt: *"A tiny astronaut exploring a bioluminescent forest."*
- **Generate:** sends the inputs to the backend, which validates them, creates **one** generation and returns its id without waiting for completion.
- **One active generation at a time:** Generate is disabled while one is queued or processing.
- **Assets panel:** every generation, newest first, with its status and original inputs.
- **Mocked async model:** returns `queued` immediately, then moves to `processing`, then `succeeded`/`failed` after visible delays. A trimmed, case-insensitive `fail` ends `failed`; everything else returns the same local fixture.
- **UI behavior:** updates without a reload, distinguishes every state, and never creates duplicates from one action.
- **Backend authority:** the backend owns ids, inputs, statuses and timestamps, and rejects empty prompts and unsupported options.
- **Persistence:** history survives a restart. Policy for interrupted work: **resume** ([ADR-0008](decisions/0008-restart-resume-policy.md)).
- **Provider boundary:** the mock sits behind a boundary that a real provider can replace ([ADR-0004](decisions/0004-provider-boundary-event-stream.md)).

## Required (Part 2)
`production-system-design.md` at the repo root, ~1,400–2,000 words, covering the **full** Creation product (Home, Apps, Projects, Library, Jobs, Discover). Not framed as productionizing this repo.

## Explicitly out of scope (for the submitted code)
> The take-home application is local and is not deployed. Do not implement the production architecture.
> For the code you submit, real providers, video, uploads, Retry, Reuse, Cancel, authentication, billing,
> deployment infrastructure, production queues, multi-user behavior, mobile layouts, and pixel-perfect
> reproduction remain out of scope. These items are not automatically out of scope for production-
> system-design.md; address them where the hypothetical full production Creation product requires them.

## Precedence
The Figma is the source for layout and copy; the brief is the source for behavior and scope. **When they conflict, the brief wins.** Deviations are listed in [ADR-0009](decisions/0009-figma-vs-brief-deviations.md) and [design/figma.md](design/figma.md).
