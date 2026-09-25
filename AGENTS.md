# AGENTS.md — LogiKeyMapSim project dispatcher

## Governance

- Top-level contract: [`constitution/CONSTITUTION.md`](constitution/CONSTITUTION.md)
- Current Operating Model: [`organization/profiles/release-driven-solo.md`](organization/profiles/release-driven-solo.md)
- Project facts: `README.md`, `package.json`, source, tests, and accepted project docs.

## Working rules

- Preserve the distinction between physical key arrangement, logical keyboard layout, and browser keyboard-event behavior.
- Use repository-controlled Next.js/test/lint/build scripts as the source-validation entry points.
- Bun is only auxiliary tooling for Agent Skills unless a separate application toolchain decision changes that.
- Browser/keyboard interaction evidence is distinct from source-only validation and must be tied to the tested candidate.
- Durable implementation/dependency state belongs in GitHub Issues; review/integration evidence belongs in Pull Requests.
